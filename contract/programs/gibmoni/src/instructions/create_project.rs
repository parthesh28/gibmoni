use crate::{
    errors::Error,
    state::{project::*, User, USER_SEED},
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

#[derive(Clone, Debug, AnchorDeserialize, AnchorSerialize)]
pub struct CreateProjectArgs {
    pub project_name: String,
    pub target_amount: u64,
    pub funding_deadline: i64,
    pub delivery_deadline: i64,
}

#[derive(Accounts)]
#[instruction(project_name: String)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub project_authority: Signer<'info>,

    #[account(
        init,
        payer = project_authority,
        space = Project::DISCRIMINATOR.len() +  Project::INIT_SPACE,
        seeds= [PROJECT_SEED, project_name.as_bytes(), project_authority.key().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [USER_SEED, project_authority.key().as_ref()],
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

impl<'info> CreateProject<'info> {
    pub fn create_project(
        &mut self,
        args: CreateProjectArgs,
        task_id: u16,
        bumps: CreateProjectBumps,
    ) -> Result<()> {
        let clock = Clock::get()?;
        require!(args.target_amount > 0, Error::ZeroAmount);

        require!(
            args.funding_deadline > clock.unix_timestamp,
            Error::InvalidDeadline
        );
        require!(
            args.delivery_deadline > clock.unix_timestamp,
            Error::InvalidDeadline
        );

        require!(
            args.delivery_deadline > args.funding_deadline,
            Error::InvalidDeadline
        );

        self.project.set_inner(Project {
            project_authority: self.project_authority.key(),
            project_name: args.project_name,
            target_amount: args.target_amount,
            collected_amount: 0,
            withdrawn_amount: 0,
            project_state: ProjectState::Funding,
            milestones_posted: 0,
            milestones_completed: 0,
            funding_deadline: args.funding_deadline,
            delivery_deadline: args.delivery_deadline,
            funder_count: 0,
            bump: bumps.project,
        });

        self.user.projects_posted = self
            .user
            .projects_posted
            .checked_add(1)
            .ok_or(Error::Overflow)?;
        self.user.last_active_time = clock.unix_timestamp;

        let (compiled_tx, _) = compile_transaction(
            vec![Instruction {
                program_id: crate::ID,
                accounts: crate::__client_accounts_cancel_unfunded_project::CancelUnfundedProject {
                    project: self.project.key(),
                }
                .to_account_metas(None)
                .to_vec(),
                data: crate::instruction::CancelUnfundedProject {}.data(),
            }],
            vec![],
        )
        .unwrap();

        queue_task_v0(
            CpiContext::new_with_signer(
                self.tuktuk_program.to_account_info(),
                QueueTaskV0 {
                    payer: self.project_authority.to_account_info(),
                    queue_authority: self.queue_authority.to_account_info(),
                    task_queue: self.task_queue.to_account_info(),
                    task_queue_authority: self.task_queue_authority.to_account_info(),
                    task: self.task.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
                &[&["queue_authority".as_bytes(), &[bumps.queue_authority]]],
            ),
            QueueTaskArgsV0 {
                trigger: TriggerV0::Timestamp(self.project.funding_deadline),
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
