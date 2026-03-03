use crate::{errors::Error, state::*};
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

#[derive(Accounts)]
pub struct ContributeFund<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_name.as_bytes(), project.project_authority.as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [USER_SEED, funder.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    #[account(
        init_if_needed,
        payer = funder,
        space = Contribution::DISCRIMINATOR.len() +  Contribution::INIT_SPACE,
        seeds= [CONTRIBUTION_SEED,  funder.key().as_ref(), project.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, Contribution>,

    pub system_program: Program<'info, System>,
}

impl<'info> ContributeFund<'info> {
    pub fn contribute_fund(&mut self, amount: u64, bumps: ContributeFundBumps) -> Result<()> {
        let clock = Clock::get()?;

        require!(amount > 0, Error::ZeroAmount);

        require!(
            self.project.project_state == ProjectState::Funding,
            Error::ProjectNotFunding
        );
        
        require!(
            clock.unix_timestamp <= self.project.funding_deadline,
            Error::ProjectNotFunding
        );

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.funder.to_account_info(),
                    to: self.vault.to_account_info(),
                },
            ),
            amount,
        )?;

    let is_new_contributor = self.contribution.amount == 0;

        if is_new_contributor {
            self.contribution.funder = self.funder.key();
            self.contribution.project = self.project.key();
            self.contribution.refunded = false;
            self.contribution.bump = bumps.contribution;

            self.project.funder_count = self.project.funder_count.checked_add(1).ok_or(Error::Overflow)?;
        }

        self.contribution.amount = self.contribution.amount.checked_add(amount).ok_or(Error::Overflow)?;
        self.project.collected_amount = self.project.collected_amount.checked_add(amount).ok_or(Error::Overflow)?;

        if self.project.collected_amount >= self.project.target_amount {
            self.project.project_state = ProjectState::Development;
        }

        self.user.contributed_amount = self.user.contributed_amount.checked_add(amount).ok_or(Error::Overflow)?;
        self.user.last_active_time = clock.unix_timestamp;

        Ok(())
    }
}