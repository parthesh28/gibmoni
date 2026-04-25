use anchor_lang::prelude::*;

pub const TREASURY_SEED: &[u8] = b"TREASURY";

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub authority: Pubkey,        // The admin who can withdraw funds to stake
    pub total_fees_collected: u64, // Good metric for analytics
    pub bump: u8,
}