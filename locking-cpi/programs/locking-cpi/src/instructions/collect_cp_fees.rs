use anchor_lang::prelude::*;
use anchor_spl::{
    memo::Memo,
    token::Token,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};
use raydium_cpmm_cpi::program::RaydiumCpmm;
use raydium_locking_cpi::{cpi, program::RaydiumLiquidityLocking, states::LockedCpLiquidityState};
use std::u64;

#[derive(Accounts)]
pub struct CollectCpFee<'info> {
    pub locking_program: Program<'info, RaydiumLiquidityLocking>,

    /// CHECK: the authority of token vault that cp is locked
    #[account(
        seeds = [
            raydium_locking_cpi::LOCK_CP_AUTH_SEED.as_bytes(),
        ],
        bump,
        seeds::program = locking_program,
    )]
    pub authority: UncheckedAccount<'info>,

    /// Fee nft owner who is allowed to receive fees
    pub fee_nft_owner: Signer<'info>,

    /// Fee token account
    #[account(
        token::mint = locked_liquidity.fee_nft_mint,
        token::authority = fee_nft_owner,
        constraint = fee_nft_account.amount == 1
    )]
    pub fee_nft_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Store the locked the information of liquidity
    #[account(
        mut,
        constraint = locked_liquidity.fee_nft_mint == fee_nft_account.mint
    )]
    pub locked_liquidity: Account<'info, LockedCpLiquidityState>,

    /// cpmm program
    pub cpmm_program: Program<'info, RaydiumCpmm>,

    /// CHECK: cp program vault and lp mint authority
    #[account(
        seeds = [
            raydium_cpmm_cpi::AUTH_SEED.as_bytes(),
        ],
        bump,
        seeds::program = cpmm_program,
    )]
    pub cp_authority: UncheckedAccount<'info>,

    /// Pool state account
    #[account(
        mut,
        address = locked_liquidity.pool_id
    )]
    pub pool_state: AccountLoader<'info, raydium_cpmm_cpi::states::PoolState>,

    /// lp mint
    #[account(
        mut,
        address = pool_state.load()?.lp_mint
    )]
    pub lp_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The token account for receive token_0
    #[account(
        mut,
        token::mint = token_0_vault.mint,
    )]
    pub recipient_token_0_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The token account for receive token_1
    #[account(
        mut,
        token::mint = token_1_vault.mint,
    )]
    pub recipient_token_1_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The address that holds pool tokens for token_0
    #[account(
        mut,
        constraint = token_0_vault.key() == pool_state.load()?.token_0_vault
    )]
    pub token_0_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The address that holds pool tokens for token_1
    #[account(
        mut,
        constraint = token_1_vault.key() == pool_state.load()?.token_1_vault
    )]
    pub token_1_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The mint of token_0 vault
    #[account(
        address = token_0_vault.mint
    )]
    pub vault_0_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The mint of token_1 vault
    #[account(
        address = token_1_vault.mint
    )]
    pub vault_1_mint: Box<InterfaceAccount<'info, Mint>>,

    /// locked lp token account
    #[account(
        mut,
        associated_token::mint = lp_mint,
        associated_token::authority = authority,
        token::token_program = token_program,
    )]
    pub locked_lp_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// token Program
    pub token_program: Program<'info, Token>,

    /// Token program 2022
    pub token_program_2022: Program<'info, Token2022>,

    /// memo program
    #[account()]
    pub memo_program: Program<'info, Memo>,
}

pub fn collect_cp_fees<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, CollectCpFee<'info>>,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::CollectCpFee {
        authority: ctx.accounts.authority.to_account_info(),
        fee_nft_owner: ctx.accounts.fee_nft_owner.to_account_info(),
        fee_nft_account: ctx.accounts.fee_nft_account.to_account_info(),
        locked_liquidity: ctx.accounts.locked_liquidity.to_account_info(),
        cpmm_program: ctx.accounts.cpmm_program.to_account_info(),
        cp_authority: ctx.accounts.cp_authority.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        lp_mint: ctx.accounts.lp_mint.to_account_info(),
        recipient_token_0_account: ctx.accounts.recipient_token_0_account.to_account_info(),
        recipient_token_1_account: ctx.accounts.recipient_token_1_account.to_account_info(),
        token_0_vault: ctx.accounts.token_0_vault.to_account_info(),
        token_1_vault: ctx.accounts.token_1_vault.to_account_info(),
        vault_0_mint: ctx.accounts.vault_0_mint.to_account_info(),
        vault_1_mint: ctx.accounts.vault_1_mint.to_account_info(),
        locked_lp_vault: ctx.accounts.locked_lp_vault.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_program_2022: ctx.accounts.token_program_2022.to_account_info(),
        memo_program: ctx.accounts.memo_program.to_account_info(),
    };
    cpi::collect_cp_fees(
        CpiContext::new(ctx.accounts.locking_program.to_account_info(), cpi_accounts),
        u64::MAX,
    )
}
