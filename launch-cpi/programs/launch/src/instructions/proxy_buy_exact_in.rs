use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use raydium_launch_cpi::states::*;
use raydium_launch_cpi::{cpi, program::RaydiumLaunchpad};

/// Accounts required for performing a buy operation in the pool
/// Buy means trading quote tokens for base tokens
#[derive(Accounts)]
pub struct ProxySwap<'info> {
    ///  Raydium launchpad program
    pub launchpad_program: Program<'info, RaydiumLaunchpad>,
    /// The user performing the swap operation
    /// Must sign the transaction and pay for fees
    pub payer: Signer<'info>,

    /// PDA that acts as the authority for pool vault operations
    /// Generated using AUTH_SEED
    /// CHECK: Safety checks performed in seeds constraint
    #[account(
        seeds = [
            raydium_launch_cpi::AUTH_SEED.as_bytes(),
        ],
        seeds::program = launchpad_program.key(),
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    /// Global configuration account containing protocol-wide settings
    /// Used to read protocol fee rates and curve type
    #[account(
        address = pool_state.global_config
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// Platform configuration account containing platform-wide settings
    /// Used to read platform fee rate
    #[account(
        address = pool_state.platform_config
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,

    /// The pool state account where the swap will be performed
    /// Contains current pool parameters and balances
    #[account(mut)]
    pub pool_state: Box<Account<'info, PoolState>>,

    /// The user's token account for base tokens (tokens being bought)
    /// Will receive the output tokens after the swap
    #[account(
        mut,
        token::mint = base_token_mint,
        token::authority = payer
    )]
    pub user_base_token: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The user's token account for quote tokens (tokens being sold)
    /// Will be debited for the input amount
    #[account(
        mut,
        token::mint = quote_token_mint,
        token::authority = payer
    )]
    pub user_quote_token: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The pool's vault for base tokens
    /// Will be debited to send tokens to the user
    #[account(
        mut,
        address = pool_state.base_vault
    )]
    pub base_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The pool's vault for quote tokens
    /// Will receive the input tokens from the user
    #[account(
        mut,
        address = pool_state.quote_vault
    )]
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The mint of the base token
    /// Used for transfer fee calculations if applicable
    #[account()]
    pub base_token_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The mint of the quote token
    #[account()]
    pub quote_token_mint: Box<InterfaceAccount<'info, Mint>>,

    /// SPL Token program for base token transfers
    pub base_token_program: Interface<'info, TokenInterface>,

    /// SPL Token program for quote token transfers
    pub quote_token_program: Program<'info, Token>,
    /// CHECK: Only the event authority can invoke self-CPI
    #[account(
        seeds = [b"__event_authority"],
        seeds::program = launchpad_program.key(),
        bump
    )]
    pub event_authority: AccountInfo<'info>,
    // Additional accounts:
    // share_fee_receiver if fee sharing is enabled
}

/// Use the given amount of quote tokens to purchase base tokens.
pub fn proxy_buy_exact_in<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
    amount_in: u64,
    minimum_amount_out: u64,
    share_fee_rate: u64,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::Swap {
        payer: ctx.accounts.payer.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
        global_config: ctx.accounts.global_config.to_account_info(),
        platform_config: ctx.accounts.platform_config.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        user_base_token: ctx.accounts.user_base_token.to_account_info(),
        user_quote_token: ctx.accounts.user_quote_token.to_account_info(),
        base_vault: ctx.accounts.base_vault.to_account_info(),
        quote_vault: ctx.accounts.quote_vault.to_account_info(),
        base_token_mint: ctx.accounts.base_token_mint.to_account_info(),
        quote_token_mint: ctx.accounts.quote_token_mint.to_account_info(),
        base_token_program: ctx.accounts.base_token_program.to_account_info(),
        quote_token_program: ctx.accounts.quote_token_program.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.launchpad_program.to_account_info(),
    };

    cpi::buy_exact_in(
        CpiContext::new(
            ctx.accounts.launchpad_program.to_account_info(),
            cpi_accounts,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        amount_in,
        minimum_amount_out,
        share_fee_rate,
    )
}
