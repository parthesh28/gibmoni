use anchor_lang::prelude::*;

pub const CONTRIBUTION_SEED: &[u8] = b"CONTRIBUTION";

#[account]
#[derive(InitSpace)]
pub struct Contribution {
    pub funder: Pubkey,
    pub project: Pubkey,
    pub amount: u64,
    pub refunded: bool,
    pub bump: u8,
}