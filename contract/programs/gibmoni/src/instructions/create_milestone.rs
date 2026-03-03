use crate::{
    errors::Error,
    state::{PROJECT_SEED, Project, ProjectState, USER_SEED, User, VAULT_SEED, Vault, milestone::*},
};
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::{prelude::*, InstructionData};
use tuktuk_program::{
    compile_transaction,
    tuktuk::{
        cpi::{accounts::QueueTaskV0, queue_task_v0},
        program::Tuktuk,
        types::TriggerV0,
    },
    types::QueueTaskArgsV0,
    TransactionSourceV0,
};

#[derive(Accounts)]
#[instruction(milestone_type: MilestoneType)]
pub struct CreateMilestone<'info> {
    #[account(mut)]
    pub milestone_authority: Signer<'info>,

    #[account(
        init,
        space = Milestone::DISCRIMINATOR.len() +  Milestone::INIT_SPACE,
        seeds= [MILESTONE_SEED, project.project_authority.key().as_ref(), project.key().as_ref(), &[milestone_type as u8]],
        payer = milestone_authority,
        bump
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_name.as_bytes(), project.project_authority.as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [USER_SEED, milestone_authority.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    // tuktuk
    #[account(mut)]
    /// CHECK: no need to parse, just using it in CPI
    pub task_queue: UncheckedAccount<'info>,

    /// CHECK: no need to parse, just using it in CPI
    pub task_queue_authority: UncheckedAccount<'info>,

    /// CHECK: initialized in CPI
    #[account(mut)]
    pub task: UncheckedAccount<'info>,

    /// CHECK: via seeds
    #[account(
        mut,
        seeds = [b"queue_authority"],
        bump
    )]
    pub queue_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub tuktuk_program: Program<'info, Tuktuk>,
}

impl<'info> CreateMilestone<'info> {
    pub fn create_milestone(
        &mut self,
        milestone_type: MilestoneType,
        task_id: u16,
        bumps: CreateMilestoneBumps,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        let deadline = current_time.checked_add(60).ok_or(Error::Overflow)?;

        require!(
            self.project.project_state == ProjectState::Development,
            Error::ProjectNotDeveloping
        );

        require!(
            deadline <= self.project.delivery_deadline,
            Error::NotEnoughTimeLeft
        );

        require!(
            self.project.milestones_posted < 4,
            Error::InvalidMilestoneCount
        );

        self.milestone.set_inner(Milestone {
            project_id: self.project.key(),
            attempt_number: 1,
            milestone_status: MilestoneState::Voting,
            milestone_type: milestone_type,
            votes_casted: 0,
            capital_casted: 0,
            voting_end_time: deadline,
            vote_against_weight: 0,
            vote_for_weight: 0,
            bump: bumps.milestone,
        });

        self.project.milestones_posted = self.project.milestones_posted.saturating_add(1);
        self.user.last_active_time = clock.unix_timestamp;

        let (compiled_tx, _) = compile_transaction(
            vec![Instruction {
                program_id: crate::ID,
                accounts: crate::__client_accounts_approve_milestone::ApproveMilestone {
                    project: self.project.key(),
                    milestone: self.milestone.key(),
                    user: self.user.key(),
                    vault: self.vault.key(),
                    project_authority: self.milestone_authority.key(),
                    system_program: self.system_program.key(),
                }
                .to_account_metas(None)
                .to_vec(),
                data: crate::instruction::ApproveMilestone {}.data(),
            }],
            vec![],
        )
        .unwrap();
    
        queue_task_v0(
            CpiContext::new_with_signer(
                self.tuktuk_program.to_account_info(),
                QueueTaskV0 {
                    payer: self.milestone_authority.to_account_info(),
                    queue_authority: self.queue_authority.to_account_info(),
                    task_queue: self.task_queue.to_account_info(),
                    task_queue_authority: self.task_queue_authority.to_account_info(),
                    task: self.task.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
                &[&["queue_authority".as_bytes(), &[bumps.queue_authority]]],
            ),
            QueueTaskArgsV0 {
                trigger: TriggerV0::Timestamp(deadline),
                transaction: TransactionSourceV0::CompiledV0(compiled_tx),
                crank_reward: Some(1000001),
                free_tasks: 1,
                id: task_id,
                description: "test".to_string(),
            },
        )?;

        Ok(())
    }
}