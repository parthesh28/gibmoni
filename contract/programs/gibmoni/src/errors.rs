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
    
    #[msg("Previous Milestone is not approved yet.")]
    PreviousMilestoneNotApproved,

    #[msg("Given deadline is invalid.")]
    InvalidDeadline,

    #[msg("Deadline has not passed yet.")]
    DeadlineNotPassed,

    #[msg("Target amount has already been reached.")]
    TargetAlreadyReached,

    #[msg("Milestones must be created in the correct chronological order.")]
    InvalidMilestoneOrder,

    #[msg("Error while processing the signature.")]
    ScoreTimestampExpired,

    #[msg("Instruction at index 0 is not the Ed25519 program")]
    InvalidEd25519Program,

    #[msg("Ed25519 instruction data is too short")]
    InvalidEd25519DataLength,
    
    #[msg("Ed25519 instruction index is incorrect")]
    InvalidEd25519IxIndex ,

    #[msg("Ed25519 instruction must contain exactly one signature")]
    InvalidNumSignatures,

    #[msg("The Oracle Public Key does not match the Ed25519 instruction")]
    OraclePubkeyMismatch,

    #[msg("The reconstructed message does not match the Ed25519 instruction")]
    OracleMessageMismatch,
    
    #[msg("The Oracle Signature does not match the Ed25519 instruction")]
    OracleSignatureMismatch,

}
