use anchor_lang::prelude::*;

pub const USER_SEED: &[u8] = b"USER";

#[account]
#[derive(InitSpace)]
pub struct User {
    pub contributed_amount: u64,
    pub votes_casted: u64,
    pub projects_posted: u64,
    pub milestones_succeeded: u64, 
    pub projects_succeeded: u64, 
    pub time_joined: i64, 
    pub last_active_time: i64,
    pub bump: u8,
}