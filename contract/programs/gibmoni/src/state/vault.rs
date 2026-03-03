use anchor_lang::prelude::*;

pub const VAULT_SEED: &[u8] = b"VAULT";

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub bump: u8,
}