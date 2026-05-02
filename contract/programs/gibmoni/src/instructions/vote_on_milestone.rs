use crate::{errors::Error, state::*};
use anchor_lang::prelude::*;

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
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            self.vote.attempt_count < self.milestone.attempt_number || self.vote.attempt_count == 0,
            Error::AlreadyVoted
        );
        require!(
            self.milestone.milestone_status == MilestoneState::Voting,
            Error::NotVotingStage
        );
        require!(
            current_time <= self.milestone.voting_end_time,
            Error::NotEnoughTimeLeft
        );

        let sol_contributed = self
            .user
            .contributed_amount
            .checked_div(1_000_000_000)
            .unwrap_or(0);
        let failed_projects = self
            .user
            .projects_posted
            .saturating_sub(self.user.projects_succeeded);

        let raw_score = self
            .user
            .votes_casted
            .saturating_add(self.user.milestones_succeeded.saturating_mul(5))
            .saturating_add(self.user.projects_succeeded.saturating_mul(20))
            .saturating_add(sol_contributed)
            .saturating_sub(failed_projects.saturating_mul(10));

        let reputation = if raw_score > 0 {
            let bonus = MAX_BONUS
                .saturating_mul(raw_score)
                .saturating_div(raw_score.saturating_add(HALF_LIFE));
            1u64.saturating_add(bonus)
        } else {
            1u64
        };

        let seconds_inactive = current_time
            .checked_sub(self.user.last_active_time)
            .ok_or(Error::Overflow)?
            .max(0) as u64;

        let days_inactive = seconds_inactive.saturating_div(86_400);

        let decayed = HALF_LIFE
            .saturating_mul(reputation)
            .checked_div(HALF_LIFE.saturating_add(days_inactive))
            .ok_or(Error::Overflow)?
            .max(1);

        let reputation = if self.user.votes_casted <= 10 {
            let off_chain_sum = (self.user.initial_wallet_score as u64)
                .saturating_add(self.user.initial_github_score as u64);
            let boost_bps = off_chain_sum.saturating_mul(25).saturating_div(100);
            decayed
                .saturating_mul(10_000u64.saturating_add(boost_bps))
                .saturating_div(10_000)
        } else {
            decayed
        };

        let raw_sqrt = integer_sqrt(self.contribution.amount);
        let base_power = raw_sqrt.checked_div(100).unwrap_or(0);
        let weight = base_power
            .checked_mul(reputation)
            .ok_or(Error::Overflow)?
            .min(MAX_WEIGHT);

        self.vote.set_inner(Vote {
            voter: self.voter.key(),
            project_id: self.project.key(),
            milestone_id: self.milestone.key(),
            decision,
            weight,
            attempt_count: self.milestone.attempt_number,
            bump: bumps.vote,
        });

        if decision {
            self.milestone.vote_for_weight = self.milestone.vote_for_weight.saturating_add(weight);
        } else {
            self.milestone.vote_against_weight =
                self.milestone.vote_against_weight.saturating_add(weight);
        }

        self.milestone.votes_casted = self.milestone.votes_casted.saturating_add(1);
        self.milestone.capital_casted = self
            .milestone
            .capital_casted
            .saturating_add(self.contribution.amount);
        self.user.votes_casted = self.user.votes_casted.saturating_add(1);
        self.user.last_active_time = current_time;

        Ok(())
    }
}
