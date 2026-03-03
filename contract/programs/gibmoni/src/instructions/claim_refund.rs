use anchor_lang::prelude::*;
use crate::errors::Error;
use crate::state::{CONTRIBUTION_SEED, Contribution, PROJECT_SEED, Project, ProjectState, USER_SEED, User, VAULT_SEED, Vault};

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    /// CHECK: only mutate lamports and verify seeds
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
        seeds = [USER_SEED, funder.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    #[account(
        mut,
        seeds = [CONTRIBUTION_SEED, funder.key().as_ref(), project.key().as_ref()],
        bump = contribution.bump,
        has_one = funder,
        has_one = project,
    )]
    pub contribution: Account<'info, Contribution>,

    pub system_program: Program<'info, System>,
}

impl<'info> ClaimRefund<'info> {
    pub fn claim_refund(&mut self) -> Result<()> {

        require!(
            self.project.project_state == ProjectState::Failed,
            Error::ProjectNotFailed 
        );

        require!(
            self.contribution.amount > 0,
            Error::NoContribution
        );

        require!(
            !self.contribution.refunded,
            Error::AlreadyRefunded
        );

        let remaining_funds = self.project.collected_amount.saturating_sub(self.project.withdrawn_amount);
        
        let refund_amount = (self.contribution.amount as u128)
        .checked_mul(remaining_funds as u128)
        .ok_or(Error::Overflow)?
        .checked_div(self.project.collected_amount as u128)
        .ok_or(Error::Overflow)? as u64;

        **self.vault.to_account_info().lamports.borrow_mut() = self.vault.to_account_info().lamports()
        .checked_sub(refund_amount)
        .ok_or(Error::Overflow)?; 
    
        **self.funder.to_account_info().lamports.borrow_mut() = self.funder.to_account_info().lamports()
        .checked_add(refund_amount)
        .ok_or(Error::Overflow)?;

        self.contribution.refunded = true;
        self.user.contributed_amount = self.user.contributed_amount.checked_sub(self.contribution.amount).ok_or(Error::Overflow)?;

        Ok(())
    }
}