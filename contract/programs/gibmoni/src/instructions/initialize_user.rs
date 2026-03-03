use anchor_lang::prelude::*;

use crate::state::{User, USER_SEED};

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = User::DISCRIMINATOR.len() + User::INIT_SPACE,
        seeds = [USER_SEED, user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, User>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeUser<'info> {
    pub fn initialize_user(&mut self, bumps: InitializeUserBumps) -> Result<()> {
        self.user_account.set_inner(User {
            contributed_amount: 0,
            votes_casted: 0,
            projects_posted: 0,
            milestones_succeeded: 0,
            projects_succeeded: 0,
            time_joined: Clock::get()?.unix_timestamp,
            last_active_time: Clock::get()?.unix_timestamp,
            bump: bumps.user_account,
        });

        Ok(())
    }
}