use anchor_lang::{prelude::*, solana_program};

use crate::{
    errors::Error,
    helpers::{ORACLE_PUBKEY, verify_ed25519_ix},
    state::{USER_SEED, User},
};

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

    /// CHECK: Instructions sysvar account
    #[account(address = solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeUser<'info> {
    pub fn initialize_user(
        &mut self,
        wallet_score: u16,
        github_score: u16,
        score_timestamp: i64,
        oracle_signature: [u8; 64],
        bumps: InitializeUserBumps,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let time_diff = clock.unix_timestamp.checked_sub(score_timestamp).unwrap();
        require!(
            time_diff >= 0 && time_diff <= 300,
            Error::ScoreTimestampExpired
        );

        let wallet_key = self.user.key();
        let message = format!(
            "gibmoni-scores:{}:{}:{}:{}",
            wallet_key, wallet_score, github_score, score_timestamp
        );

        verify_ed25519_ix(
            &self.instructions_sysvar,
            &ORACLE_PUBKEY.as_ref(),
            message.as_bytes(),
            &oracle_signature,
        )?;

        self.user_account.set_inner(User {
            contributed_amount: 0,
            votes_casted: 0,
            projects_posted: 0,
            milestones_succeeded: 0,
            projects_succeeded: 0,
            time_joined: Clock::get()?.unix_timestamp,
            last_active_time: Clock::get()?.unix_timestamp,
            initial_github_score: github_score,
            initial_wallet_score: wallet_score,
            reputation: 0,
            bump: bumps.user_account,
        });

        Ok(())
    }
}
