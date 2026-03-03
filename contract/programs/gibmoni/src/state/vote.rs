use anchor_lang::{prelude::*};

pub const VOTE_SEED: &[u8] = b"VOTE";

#[account]
#[derive(InitSpace, Debug)]
pub struct Vote{
    pub voter: Pubkey,
    pub project_id: Pubkey,
    pub milestone_id: Pubkey,
    pub decision: bool,
    pub weight: u64, 
    pub attempt_count: u8,
    pub bump: u8
}