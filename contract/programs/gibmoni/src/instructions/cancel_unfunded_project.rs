use anchor_lang::prelude::*;
use crate::{errors::Error, state::*};

#[derive(Accounts)]
pub struct CancelUnfundedProject<'info> {
    
    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_name.as_bytes(), project.project_authority.as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,
}

impl<'info> CancelUnfundedProject<'info> {
    pub fn cancel_unfunded_project(&mut self) -> Result<()> {
        let clock = Clock::get()?;

        require!(
            self.project.project_state == ProjectState::Funding,
            Error::ProjectNotFunding 
        );

        require!(
            clock.unix_timestamp > self.project.funding_deadline,
            Error::DeadlineNotPassed
        );

        require!(
            self.project.collected_amount < self.project.target_amount,
            Error::TargetAlreadyReached
        );

        self.project.project_state = ProjectState::Failed;

        Ok(())
    }
}