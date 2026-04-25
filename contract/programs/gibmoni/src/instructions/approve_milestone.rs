use crate::{errors::Error, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
    // no signer needed for automation
    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_name.as_bytes(), project.project_authority.as_ref()],
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
        seeds = [USER_SEED, project.project_authority.as_ref()],
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

    /// CHECK: only sending SOL to the exact pubkey stored in the Project state
    #[account(
        mut,
        address = project.project_authority
    )]
    pub project_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> ApproveMilestone<'info> {
    pub fn approve_milestone(&mut self) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(
            self.milestone.milestone_status == MilestoneState::Voting,
            Error::NotVotingStage
        );

        require!(
            current_time > self.milestone.voting_end_time,
            Error::NotVotingStage
        );

        let required_funder_quorum = (self.project.funder_count as u64)
            .saturating_mul(30)
            .checked_div(100)
            .ok_or(Error::Overflow)?;

        let required_capital_quorum = self
            .project
            .collected_amount
            .saturating_mul(30)
            .checked_div(100)
            .ok_or(Error::Overflow)?;

        let headcount_passed = (self.milestone.votes_casted as u64) >= required_funder_quorum;
        let capital_passed = self.milestone.capital_casted >= required_capital_quorum;

        let quorum_met = headcount_passed && capital_passed;
        let vote_passed = self.milestone.vote_for_weight > self.milestone.vote_against_weight;
        let max_attempts_reached = self.milestone.attempt_number >= 3;

        let is_approved = if quorum_met {
            vote_passed
        } else {
            max_attempts_reached
        };

        if is_approved {
            self.milestone.milestone_status = MilestoneState::Approved;

            self.project.milestones_completed = self.project.milestones_completed.saturating_add(1);

            self.user.milestones_succeeded = self.user.milestones_succeeded.saturating_add(1);

            if self.project.milestones_completed == 4 {
                self.project.project_state = ProjectState::Completed;
                self.user.projects_succeeded = self.user.projects_succeeded.saturating_add(1);
            }

            let payout_amount = if self.project.milestones_completed == 4 {
                
                self.project
                    .collected_amount
                    .saturating_sub(self.project.withdrawn_amount)
            } else {
                self.project.collected_amount.checked_div(4).ok_or(Error::Overflow)?
            };

            let fee_amount = payout_amount
                .checked_mul(2)
                .ok_or(Error::Overflow)?
                .checked_div(100)
                .ok_or(Error::Overflow)?;

            let developer_amount = payout_amount
                .checked_sub(fee_amount)
                .ok_or(Error::Overflow)?;

            **self.vault.to_account_info().lamports.borrow_mut() = self
                .vault
                .to_account_info()
                .lamports()
                .checked_sub(payout_amount)
                .ok_or(Error::InsufficientFunds)?;

            **self.project_authority.lamports.borrow_mut() = self
                .project_authority
                .lamports()
                .checked_add(developer_amount)
                .ok_or(Error::Overflow)?;

            **self.treasury.to_account_info().lamports.borrow_mut() = self
                .treasury
                .to_account_info()
                .lamports()
                .checked_add(fee_amount)
                .ok_or(Error::Overflow)?;

            self.treasury.total_fees_collected = self
                .treasury
                .total_fees_collected
                .saturating_add(fee_amount);

            self.project.withdrawn_amount =
                self.project.withdrawn_amount.saturating_add(payout_amount);
        } else {
            self.milestone.milestone_status = MilestoneState::Disapproved;

            if current_time > self.project.delivery_deadline || max_attempts_reached {
                self.project.project_state = ProjectState::Failed;
            }
        }

        Ok(())
    }
}