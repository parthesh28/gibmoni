use anchor_lang::prelude::*;

#[error_code]
pub enum Error {
    #[msg("Amount cannot be zero.")]
    ZeroAmount,
    
    #[msg("Project is invalid")]
    InvalidProject,

    #[msg("Invalid milestone type provided.")]
    InvalidMilestoneType,

    #[msg("Project is not in funding stage anymore.")]
    ProjectNotFunding,

    #[msg("Project is not in developing stage rightnow.")]
    ProjectNotDeveloping,

    #[msg("Project funding deadline is execeeded.")]
    ProjectExpired,

    #[msg("Numerical overflow.")]
    Overflow,

    #[msg("Milestone is not in voting stage.")]
    NotVotingStage,

    #[msg("Project not in failed state")]
    ProjectNotFailed,

    #[msg("No contribution found for the given user.")]
    NoContribution,

    #[msg("Refund already claimed by the user.")]
    AlreadyRefunded,

    #[msg("Insufficient funds in vault.")]
    InsufficientFunds,

    #[msg("You can only retry a milestone in Disapprove stage.")]
    NotDisapproved,

    #[msg("Maximum number of attempts for the milestone have been reached.")]
    MaxAttemptsReached,

    #[msg("There is not enough time left to conduct a full vote.")]
    NotEnoughTimeLeft,

    #[msg("Invalid milestone count.")]
    InvalidMilestoneCount,
    
    #[msg("Vote has been already casted.")]
    AlreadyVoted,

    #[msg("Given deadline is invalid.")]
    InvalidDeadline,

    #[msg("Deadline has not passed yet.")]
    DeadlineNotPassed,

    #[msg("Target amount has already been reached.")]
    TargetAlreadyReached,
}