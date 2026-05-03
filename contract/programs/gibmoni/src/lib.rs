use anchor_lang::prelude::*;

mod errors;
mod helpers;
mod instructions;
mod state;

use instructions::*;
use state::MilestoneType;

declare_id!("9qmeNAZdQvMnrpj8mC6Yi8w9EoJPfzjD6ayYhrKpnquY");

#[program]
pub mod gibmoni {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(ctx.bumps)?;
        Ok(())
    }

    pub fn initialize_user(
        ctx: Context<InitializeUser>,
        ix_index: u8,
        wallet_score: u16,
        github_score: u16,
        score_timestamp: i64,
        oracle_signature: [u8; 64],
    ) -> Result<()> {
        ctx.accounts.initialize_user(
            ix_index,
            wallet_score,
            github_score,
            score_timestamp,
            oracle_signature,
            ctx.bumps,
        )?;
        Ok(())
    }

    pub fn create_project(
        ctx: Context<CreateProject>,
        args: CreateProjectArgs,
        task_id: u16,
    ) -> Result<()> {
        ctx.accounts.create_project(args, task_id, ctx.bumps)?;
        Ok(())
    }

    pub fn create_milestone(
        ctx: Context<CreateMilestone>,
        milestone_type: MilestoneType,
        task_id: u16,
    ) -> Result<()> {
        ctx.accounts
            .create_milestone(milestone_type, task_id, ctx.bumps)?;
        Ok(())
    }

    pub fn contribute_fund(ctx: Context<ContributeFund>, amount: u64) -> Result<()> {
        ctx.accounts.contribute_fund(amount, ctx.bumps)?;
        Ok(())
    }

    pub fn vote_on_milestone(ctx: Context<VoteOnMilestone>, approve: bool) -> Result<()> {
        ctx.accounts.vote_on_milestone(approve, ctx.bumps)?;
        Ok(())
    }
    pub fn approve_milestone(ctx: Context<ApproveMilestone>) -> Result<()> {
        ctx.accounts.approve_milestone()?;
        Ok(())
    }

    pub fn retry_milestone(ctx: Context<RetryMilestone>, task_id: u16) -> Result<()> {
        ctx.accounts.retry_milestone(task_id, ctx.bumps)?;
        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        ctx.accounts.claim_refund()?;
        Ok(())
    }

    pub fn cancel_unfunded_project(ctx: Context<CancelUnfundedProject>) -> Result<()> {
        ctx.accounts.cancel_unfunded_project()?;
        Ok(())
    }
}
