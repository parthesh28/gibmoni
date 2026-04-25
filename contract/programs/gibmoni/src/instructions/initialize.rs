use anchor_lang::prelude::*;

use crate::state::{Treasury, Vault, TREASURY_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = Vault::DISCRIMINATOR.len() + Vault::INIT_SPACE,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = admin,
        space = Treasury::DISCRIMINATOR.len() + Treasury::INIT_SPACE,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bumps: InitializeBumps) -> Result<()> {
        self.vault.set_inner(Vault {
            authority: self.admin.key(),
            bump: bumps.vault,
        });

        self.treasury.set_inner(Treasury {
            authority: self.admin.key(),
            total_fees_collected: 0,
            bump: bumps.treasury,
        });

        Ok(())
    }
}