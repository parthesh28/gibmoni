use crate::{errors::Error, state::*};
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
pub struct RetryMilestone<'info> {
    #[account(mut)]
    pub milestone_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_name.as_bytes(), milestone_authority.key().as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        constraint = milestone.project_id == project.key() @ Error::InvalidProject,
        seeds= [MILESTONE_SEED, project.project_authority.key().as_ref(), project.key().as_ref(), &[milestone.milestone_type as u8]],
        bump = milestone.bump
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(
        mut,
        seeds = [USER_SEED, milestone_authority.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    //tuktuk
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

impl<'info> RetryMilestone<'info> {
    pub fn retry_milestone(&mut self, task_id: u16, bumps: RetryMilestoneBumps) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        
        require!(
            self.project.project_state != ProjectState::Failed,
            Error::ProjectExpired
        );
        
        require!(
            self.milestone.milestone_status == MilestoneState::Disapproved,
            Error::NotDisapproved
        );

        require!(
            self.milestone.attempt_number < 3,
            Error::MaxAttemptsReached
        );

        let new_voting_deadline = current_time.saturating_add(60);

        require!(
            new_voting_deadline <= self.project.delivery_deadline,
            Error::NotEnoughTimeLeft
        );

        self.milestone.vote_for_weight = 0;
        self.milestone.vote_against_weight = 0;
        self.milestone.votes_casted = 0;
        self.milestone.capital_casted = 0;
        self.milestone.attempt_number = self.milestone.attempt_number.saturating_add(1);
        self.milestone.voting_end_time = new_voting_deadline; 
        self.milestone.milestone_status = MilestoneState::Voting;

        self.user.last_active_time = clock.unix_timestamp;
        
        let (compiled_tx, _) = compile_transaction(
            vec![Instruction {
                program_id: crate::ID,
                accounts: crate::__client_accounts_approve_milestone::ApproveMilestone {
                    project: self.project.key(),
                    milestone: self.milestone.key(),
                    user: self.user.key(),
                    vault: self.vault.key(),
                    treasury: self.treasury.key(), 
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
                trigger: TriggerV0::Timestamp(new_voting_deadline),
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