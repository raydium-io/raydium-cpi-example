use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};
use raydium_amm_v3::{
    cpi,
    program::AmmV3,
    states::{AmmConfig, POOL_SEED, POOL_TICK_ARRAY_BITMAP_SEED, POOL_VAULT_SEED},
};
// use solana_program::{program::invoke_signed, system_instruction};
#[derive(Accounts)]
pub struct ProxyInitialize<'info> {
    pub clmm_program: Program<'info, AmmV3>,

    /// Address paying to create the pool. Can be anyone
    #[account(mut)]
    pub pool_creator: Signer<'info>,

    /// Which config the pool belongs to.
    pub amm_config: Box<Account<'info, AmmConfig>>,

    /// CHECK: Initialize an account to store the pool state
    #[account(
        mut,
        seeds = [
            POOL_SEED.as_bytes(),
            amm_config.key().as_ref(),
            token_mint_0.key().as_ref(),
            token_mint_1.key().as_ref(),
        ],
        bump,
    )]
    pub pool_state: UncheckedAccount<'info>,

    /// Token_0 mint, the key must grater then token_1 mint.
    #[account(
        constraint = token_mint_0.key() < token_mint_1.key(),
        mint::token_program = token_program_0
    )]
    pub token_mint_0: Box<InterfaceAccount<'info, Mint>>,

    /// Token_1 mint
    #[account(
        mint::token_program = token_program_1
    )]
    pub token_mint_1: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: Token_0 vault for the pool
    #[account(
        mut,
        seeds =[
            POOL_VAULT_SEED.as_bytes(),
            pool_state.key().as_ref(),
            token_mint_0.key().as_ref(),
        ],
        bump,
    )]
    pub token_vault_0: UncheckedAccount<'info>,

    /// CHECK: Token_1 vault for the pool
    #[account(
        mut,
        seeds =[
            POOL_VAULT_SEED.as_bytes(),
            pool_state.key().as_ref(),
            token_mint_1.key().as_ref(),
        ],
        bump,
    )]
    pub token_vault_1: UncheckedAccount<'info>,

    /// CHECK: Initialize an account to store oracle observations, the account must be created off-chain, constract will initialzied it
    #[account(mut)]
    pub observation_state: UncheckedAccount<'info>,

    /// CHECK: Initialize an account to store if a tick array is initialized.
    #[account(
        mut,
        seeds = [
            POOL_TICK_ARRAY_BITMAP_SEED.as_bytes(),
            pool_state.key().as_ref(),
        ],
        bump,
    )]
    pub tick_array_bitmap: UncheckedAccount<'info>,

    /// Spl token program or token program 2022
    pub token_program_0: Interface<'info, TokenInterface>,
    /// Spl token program or token program 2022
    pub token_program_1: Interface<'info, TokenInterface>,
    /// To create a new program account
    pub system_program: Program<'info, System>,
    /// Sysvar for program account
    pub rent: Sysvar<'info, Rent>,
}

pub fn proxy_initialize(
    ctx: Context<ProxyInitialize>,
    sqrt_price_x64: u128,
    open_time: u64,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::CreatePool {
        pool_creator: ctx.accounts.pool_creator.to_account_info(),
        amm_config: ctx.accounts.amm_config.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        token_mint_0: ctx.accounts.token_mint_0.to_account_info(),
        token_mint_1: ctx.accounts.token_mint_1.to_account_info(),
        token_vault_0: ctx.accounts.token_vault_0.to_account_info(),
        token_vault_1: ctx.accounts.token_vault_1.to_account_info(),
        observation_state: ctx.accounts.observation_state.to_account_info(),
        tick_array_bitmap: ctx.accounts.tick_array_bitmap.to_account_info(),
        token_program_0: ctx.accounts.token_program_0.to_account_info(),
        token_program_1: ctx.accounts.token_program_1.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.clmm_program.to_account_info(), cpi_accounts);
    cpi::create_pool(cpi_context, sqrt_price_x64, open_time)
}
