use raydium_launch_cpi::states::*;
use raydium_launch_cpi::{cpi, program::RaydiumLaunchpad};

use anchor_lang::{accounts::interface_account::InterfaceAccount, prelude::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::spl_token,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

/// Accounts required for initializing a new trading pool
#[derive(Accounts)]
pub struct ProxyClaimVestedToken<'info> {
    ///  Raydium launchpad program
    pub launchpad_program: Program<'info, RaydiumLaunchpad>,
    /// The beneficiary of the vesting account
    #[account(
        mut,
        address = vesting_record.beneficiary
    )]
    pub beneficiary: Signer<'info>,

    /// PDA that acts as the authority for pool vault and mint operations
    /// Generated using AUTH_SEED
    /// CHECK: This is a PDA, safety checks performed in seeds constraint
    #[account(
        seeds = [
            raydium_launch_cpi::AUTH_SEED.as_bytes(),
        ],
        seeds::program = launchpad_program.key(),
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    /// Account that stores the pool's state and parameters
    /// PDA generated using POOL_SEED and both token mints
    #[account(
        mut,
        address = vesting_record.pool
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    /// The vesting record account
    #[account(
        mut,
        seeds =[
            POOL_VESTING_SEED.as_bytes(),
            pool_state.key().as_ref(),
            beneficiary.key().as_ref(),
        ],
        seeds::program = launchpad_program.key(),
        bump,
    )]
    pub vesting_record: Box<Account<'info, VestingRecord>>,

    /// The pool's vault for base tokens
    /// Will be debited to send tokens to the user
    #[account(
        mut,
        address = pool_state.base_vault
    )]
    pub base_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK:
    #[account(
    //    associated_token::mint = base_token_mint,
    //    associated_token::authority = beneficiary,
    //    associated_token::token_program = base_token_program,
    )]
    pub user_base_token: UncheckedAccount<'info>,

    /// The mint for the base token (token being sold)
    /// Created in this instruction with specified decimals
    #[account(
        mint::token_program = base_token_program,
        address = base_vault.mint
    )]
    pub base_token_mint: Box<InterfaceAccount<'info, Mint>>,

    /// SPL Token program for the base token
    /// Must be the standard Token program
    #[account(
        address = spl_token::id()
    )]
    pub base_token_program: Interface<'info, TokenInterface>,

    /// Required for account creation
    pub system_program: Program<'info, System>,

    /// Required for associated token program
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn proxy_claim_vested_token(ctx: Context<ProxyClaimVestedToken>) -> Result<()> {
    let cpi_accounts = cpi::accounts::ClaimVestedToken {
        beneficiary: ctx.accounts.beneficiary.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        vesting_record: ctx.accounts.vesting_record.to_account_info(),
        base_vault: ctx.accounts.base_vault.to_account_info(),
        user_base_token: ctx.accounts.user_base_token.to_account_info(),
        base_token_mint: ctx.accounts.base_token_mint.to_account_info(),
        base_token_program: ctx.accounts.base_token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
    };

    cpi::claim_vested_token(CpiContext::new(
        ctx.accounts.launchpad_program.to_account_info(),
        cpi_accounts,
    ))
}
