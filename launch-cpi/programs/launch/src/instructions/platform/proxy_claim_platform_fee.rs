use anchor_lang::{accounts::interface_account::InterfaceAccount, prelude::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};
use raydium_launch_cpi::states::*;
use raydium_launch_cpi::{cpi, program::RaydiumLaunchpad};

/// Accounts required for claim platform fee
#[derive(Accounts)]
pub struct ProxyClaimPlatformFee<'info> {
    ///  Raydium launchpad program
    pub launchpad_program: Program<'info, RaydiumLaunchpad>,
    /// Only the wallet stored in platform_config can collect platform fees
    #[account(
        mut,
        address = platform_config.platform_fee_wallet
    )]
    pub platform_fee_wallet: Signer<'info>,

    /// PDA that acts as the authority for pool vault and mint operations
    /// Generated using AUTH_SEED
    /// CHECK: This is a PDA, safety checks performed in seeds constraint
    #[account(
        seeds = [
            raydium_launch_cpi::AUTH_SEED.as_bytes(),
        ],
        bump,
        seeds::program = launchpad_program.key(),
    )]
    pub authority: UncheckedAccount<'info>,

    /// Account that stores the pool's state and parameters
    /// PDA generated using POOL_SEED and both token mints
    #[account(mut)]
    pub pool_state: Box<Account<'info, PoolState>>,

    /// The platform config account
    #[account(
        address = pool_state.platform_config
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    //// The address that holds pool tokens for quote token
    #[account(
        mut,
        address = pool_state.quote_vault
    )]
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: The address that receives the collected quote token fees
    #[account(
       mut,
    //    associated_token::mint = quote_mint,
    //    associated_token::authority = platform_fee_wallet,
    //    associated_token::token_program = token_program,
    )]
    pub recipient_token_account: UncheckedAccount<'info>,

    /// The mint of quote token vault
    #[account(
        address = quote_vault.mint
    )]
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    /// SPL program for input token transfers
    pub token_program: Program<'info, Token>,

    /// Required for account creation
    pub system_program: Program<'info, System>,

    /// Required for associated token program
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn proxy_claim_platform_fee(ctx: Context<ProxyClaimPlatformFee>) -> Result<()> {
    let cpi_accounts = cpi::accounts::ClaimPlatformFee {
        platform_fee_wallet: ctx.accounts.platform_fee_wallet.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        platform_config: ctx.accounts.platform_config.to_account_info(),
        quote_vault: ctx.accounts.quote_vault.to_account_info(),
        recipient_token_account: ctx.accounts.recipient_token_account.to_account_info(),
        quote_mint: ctx.accounts.quote_mint.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
    };

    cpi::claim_platform_fee(CpiContext::new(
        ctx.accounts.launchpad_program.to_account_info(),
        cpi_accounts,
    ))
}
