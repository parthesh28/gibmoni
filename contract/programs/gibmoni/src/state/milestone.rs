use anchor_lang::prelude::*;

pub const MILESTONE_SEED: &[u8] = b"MILESTONE";

#[account]
#[derive(InitSpace, Debug)]
pub struct Milestone{
    pub project_id: Pubkey,
    pub attempt_number: u8,
    pub milestone_status: MilestoneState,
    pub milestone_type: MilestoneType,
    pub votes_casted: u32,
    pub capital_casted: u64,
    pub voting_end_time: i64,
    pub vote_against_weight: u64, 
    pub vote_for_weight: u64, 
    pub bump: u8
}

#[derive(Clone, Copy, PartialEq, Eq, InitSpace, AnchorSerialize, AnchorDeserialize, Debug)]
pub enum MilestoneState {
    Voting,
    Approved,
    Disapproved,
}

#[derive(Clone, Copy, InitSpace, AnchorSerialize, AnchorDeserialize, Debug)]
#[repr(u8)]
pub enum MilestoneType{
    Design,
    Development,
    Testing, 
    Deployment,
}