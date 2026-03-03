use anchor_lang::prelude::*;

pub const PROJECT_SEED: &[u8] = b"PROJECT";

#[account]
#[derive(InitSpace, Debug)]
pub struct Project {
    pub project_authority: Pubkey,
    #[max_len(50)]
    pub project_name: String, 
    pub target_amount: u64,
    pub collected_amount: u64,
    pub withdrawn_amount: u64,
    pub project_state: ProjectState,
    pub milestones_posted: u8, 
    pub milestones_completed: u8, 
    pub funding_deadline: i64, 
    pub delivery_deadline: i64, 
    pub funder_count: u32, 
    pub bump: u8,
}

#[derive(Clone, Copy, PartialEq, Eq, InitSpace, AnchorSerialize, AnchorDeserialize, Debug)]
pub enum ProjectState {
    Funding,
    Development,
    Failed,
    Completed,
}