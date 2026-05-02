use anchor_lang::{prelude::*, solana_program};

use crate::{
    errors::Error,
    helpers::{verify_ed25519_ix, ORACLE_PUBKEY},
    state::{User, USER_SEED},
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

    /// CHECK: Instructions sysvar account, verified against the canonical sysvar ID.
    #[account(address = solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeUser<'info> {
    pub fn initialize_user(
        &mut self,
        ix_index: u8,
        wallet_score: u16,
        github_score: u16,
        score_timestamp: i64,
        oracle_signature: [u8; 64],
        bumps: InitializeUserBumps,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        let time_diff = now.saturating_sub(score_timestamp).abs();

        require!(time_diff <= 300, Error::ScoreTimestampExpired);

        let wallet_key = self.user.key();
        let message = format!(
            "gibmoni-scores:{}:{}:{}:{}",
            wallet_key, wallet_score, github_score, score_timestamp
        );

        let oracle_pubkey_bytes: &[u8; 32] = ORACLE_PUBKEY
            .as_ref()
            .try_into()
            .map_err(|_| Error::OraclePubkeyMismatch)?;

        verify_ed25519_ix(
            &self.instructions_sysvar,
            ix_index,
            oracle_pubkey_bytes,
            message.as_bytes(),
            &oracle_signature,
        )?;

        self.user_account.set_inner(User {
            contributed_amount: 0,
            votes_casted: 0,
            projects_posted: 0,
            milestones_succeeded: 0,
            projects_succeeded: 0,
            time_joined: now,
            last_active_time: now,
            initial_github_score: github_score,
            initial_wallet_score: wallet_score,
            reputation: 0,
            bump: bumps.user_account,
        });

        Ok(())
    }
}
