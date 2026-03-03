use anchor_lang::prelude::*;
use crate::{errors::Error, state::*};

const MAX_BONUS: u64 = 9;
const MAX_WEIGHT: u64 = 5_000;
const HALF_LIFE: u64 = 100;

pub fn integer_sqrt(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[derive(Accounts)]
pub struct VoteOnMilestone<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_SEED, voter.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    #[account(
        seeds = [PROJECT_SEED, project.project_name.as_bytes(),project.project_authority.as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        constraint = milestone.project_id == project.key() @ Error::InvalidProject,
        seeds= [MILESTONE_SEED, project.project_authority.key().as_ref(), project.key().as_ref(), &[milestone.milestone_type as u8]],
        bump = milestone.bump
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(
        seeds = [CONTRIBUTION_SEED,  voter.key().as_ref(), project.key().as_ref()],
        constraint = contribution.funder == voter.key() @ Error::InvalidProject,
        constraint = contribution.project == project.key() @ Error::InvalidProject,
        bump = contribution.bump
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(
        init_if_needed,
        payer = voter,
        space = Vote::DISCRIMINATOR.len() + Vote::INIT_SPACE,
        seeds = [VOTE_SEED, milestone.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    pub system_program: Program<'info, System>,
}

impl<'info> VoteOnMilestone<'info> {
    pub fn vote_on_milestone(&mut self, decision: bool, bumps: VoteOnMilestoneBumps) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        let is_new_vote = self.vote.attempt_count == 0;

        if !is_new_vote {
            require!(
                self.vote.attempt_count < self.milestone.attempt_number,
                Error::AlreadyVoted 
            );
        }

        require!(
            self.milestone.milestone_status == MilestoneState::Voting,
            Error::NotVotingStage
        );

        require!(
            current_time <= self.milestone.voting_end_time,
            Error::NotEnoughTimeLeft
        );

        let failed_projects = self.user.projects_posted.saturating_sub(self.user.projects_succeeded);
        let global_sol_contributed = self.user.contributed_amount.checked_div(1_000_000_000).unwrap_or(0);
        let raw_score = self.user.votes_casted.saturating_add(self.user.milestones_succeeded.saturating_mul(5)).saturating_add(self.user.projects_succeeded.saturating_mul(20)).saturating_add(global_sol_contributed);
        let penalty = failed_projects.saturating_mul(10);
        let adjusted_score = raw_score.saturating_sub(penalty);
        let mut reputation = 1u64;

        if adjusted_score > 0 {
            let numerator = MAX_BONUS.saturating_mul(adjusted_score);
            let denominator = adjusted_score.saturating_add(HALF_LIFE);
            let bounded_bonus = numerator.saturating_div(denominator);
            reputation = reputation.saturating_add(bounded_bonus);
        }

        let seconds_since_active = current_time
            .checked_sub(self.user.last_active_time)
            .ok_or(Error::Overflow)?;

        let days_inactive = (seconds_since_active / 86_400) as u64;

        let decayed_rep = HALF_LIFE
            .saturating_mul(reputation)
            .checked_div(HALF_LIFE.saturating_add(days_inactive))
            .ok_or(Error::Overflow)?;

        reputation = decayed_rep.max(1);

        let raw_sqrt = integer_sqrt(self.contribution.amount);
        let base_power = raw_sqrt.checked_div(100).unwrap_or(0);

        let weight = (base_power )
            .checked_mul(reputation)
            .ok_or(Error::Overflow)?;

        let mut final_weight = weight;

        final_weight = final_weight.min(MAX_WEIGHT);

        self.vote.set_inner(Vote {
            voter: self.voter.key(),
            project_id: self.project.key(),
            milestone_id: self.milestone.key(),
            decision,
            weight: final_weight,
            attempt_count: self.milestone.attempt_number,
            bump: bumps.vote,
        });

        if decision {
            self.milestone.vote_for_weight = self.milestone.vote_for_weight.saturating_add(final_weight);
        } else {
            self.milestone.vote_against_weight = self.milestone.vote_against_weight.saturating_add(final_weight);
        }

        self.milestone.votes_casted = self.milestone.votes_casted.saturating_add(1);
        self.milestone.capital_casted = self.milestone.capital_casted.saturating_add(self.contribution.amount);
        self.user.votes_casted = self.user.votes_casted.saturating_add(1);
        self.user.last_active_time = current_time;

        Ok(())
    }
}