use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::Metadata,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

use raydium_locking_cpi::{cpi, program::RaydiumLiquidityLocking, states::LOCKED_LIQUIDITY_SEED};

#[derive(Accounts)]
pub struct LockCpLiquidity<'info> {
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

    /// Pay to create account lamports
    #[account(mut)]
    pub payer: Signer<'info>,

    /// who want to lock liquidity
    pub liquidity_owner: Signer<'info>,

    /// CHECK: locked liquidity allow who to collect fee
    pub fee_nft_owner: UncheckedAccount<'info>,

    /// CHECK: Create a unique fee nft mint, init by locking program
    #[account(mut)]
    pub fee_nft_mint: Signer<'info>,

    /// CHECK: Token account where fee nft will be minted to, init by locking program
    #[account(
        mut,
        // associated_token::mint = fee_nft_mint,
        // associated_token::authority = fee_nft_owner,
        // token::token_program = token_program,
    )]
    pub fee_nft_account: UncheckedAccount<'info>,

    /// Indicates which pool the locked liquidity belong to
    #[account()]
    pub pool_state: AccountLoader<'info, raydium_cpmm_cpi::states::PoolState>,

    /// CHECK: Store the locked information of liquidity, init by locking program
    #[account(
        mut,
        seeds = [
            LOCKED_LIQUIDITY_SEED.as_bytes(),
            fee_nft_mint.key().as_ref(),
        ],
        bump,
        seeds::program = locking_program,
    )]
    pub locked_liquidity: UncheckedAccount<'info>,

    /// The mint of liquidity token
    #[account(address = pool_state.load()?.lp_mint)]
    pub lp_mint: Box<InterfaceAccount<'info, Mint>>,

    /// liquidity owner lp token account
    #[account(
        mut,
        token::mint = lp_mint,
        token::authority = liquidity_owner,
    )]
    pub liquidity_owner_lp: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: Locked lp token deposit to, init by locking program
    #[account(
        mut,
        // associated_token::mint = lp_mint,
        // associated_token::authority = authority,
        // token::token_program = token_program,
    )]
    pub locked_lp_vault: UncheckedAccount<'info>,

    /// The address that holds pool tokens for token_0
    #[account(
        mut,
        address = pool_state.load()?.token_0_vault
    )]
    pub token_0_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The address that holds pool tokens for token_1
    #[account(
        mut,
        address = pool_state.load()?.token_1_vault
    )]
    pub token_1_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// To store metaplex metadata
    /// CHECK: Safety check performed inside function body
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    /// Sysvar for token mint and ATA creation
    pub rent: Sysvar<'info, Rent>,

    /// Program to create the new account
    pub system_program: Program<'info, System>,

    /// Program to create/transfer mint/token account
    pub token_program: Program<'info, Token>,

    /// Program to create an ATA for receiving fee NFT
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// Program to create NFT metadata accunt
    /// CHECK: Metadata program address constraint applied
    pub metadata_program: Program<'info, Metadata>,
}

pub fn lock_cp_liquidity(
    ctx: Context<LockCpLiquidity>,
    lp_amount: u64,
    with_metadata: bool,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::LockCpLiquidity {
        authority: ctx.accounts.authority.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        liquidity_owner: ctx.accounts.liquidity_owner.to_account_info(),
        fee_nft_owner: ctx.accounts.fee_nft_owner.to_account_info(),
        fee_nft_mint: ctx.accounts.fee_nft_mint.to_account_info(),
        fee_nft_account: ctx.accounts.fee_nft_account.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        locked_liquidity: ctx.accounts.locked_liquidity.to_account_info(),
        lp_mint: ctx.accounts.lp_mint.to_account_info(),
        liquidity_owner_lp: ctx.accounts.liquidity_owner_lp.to_account_info(),
        locked_lp_vault: ctx.accounts.locked_lp_vault.to_account_info(),
        token_0_vault: ctx.accounts.token_0_vault.to_account_info(),
        token_1_vault: ctx.accounts.token_1_vault.to_account_info(),
        metadata_account: ctx.accounts.metadata_account.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
        metadata_program: ctx.accounts.metadata_program.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.locking_program.to_account_info(), cpi_accounts);
    cpi::lock_cp_liquidity(cpi_context, lp_amount, with_metadata)
}
