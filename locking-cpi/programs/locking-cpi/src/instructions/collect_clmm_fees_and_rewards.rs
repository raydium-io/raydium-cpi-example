use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    memo::Memo,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};
use raydium_clmm_cpi::{
    program::RaydiumClmm,
    states::{
        PersonalPositionState, ProtocolPositionState, TickArrayState, POSITION_SEED,
    },
};
use raydium_locking_cpi::{cpi, program::RaydiumLiquidityLocking, states::{LOCKED_POSITION_SEED,LockedClmmPositionState}};


#[derive(Accounts)]
pub struct CollectClmmFeeAndReward<'info> {
    pub locking_program: Program<'info, RaydiumLiquidityLocking>,

    /// CHECK: the authority of position nft account that clmm is locked
    #[account(
        seeds = [
            raydium_locking_cpi::LOCK_CLMM_AUTH_SEED.as_bytes(),
        ],
        bump,
        seeds::program = locking_program,
    )]
    pub authority: UncheckedAccount<'info>,
    
    /// The owner who has fee nft account
    pub fee_nft_owner: Signer<'info>,

    /// Fee token account
    #[account(
        token::mint = locked_position.fee_nft_mint,
        token::authority = fee_nft_owner,
        constraint = fee_nft_account.amount == 1
    )]
    pub fee_nft_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Store the locked the information of position
    #[account(
        seeds = [
            LOCKED_POSITION_SEED.as_bytes(),
            fee_nft_account.mint.as_ref(),
        ],
        bump,
        seeds::program = locking_program,
    )]
    pub locked_position: Box<Account<'info, LockedClmmPositionState>>,

    /// clmm program
    pub clmm_program: Program<'info, RaydiumClmm>,

    /// Program ATA locked NFT account or user ATA position NFT account
    #[account(
        mut,
        constraint = locked_nft_account.mint == personal_position.nft_mint && locked_nft_account.amount == 1,
        address = locked_position.locked_nft_account,
        token::authority = authority,
    )]
    pub locked_nft_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Decrease liquidity for this position
    #[account(
        mut, 
        address = locked_position.position_id,
        constraint = personal_position.pool_id == pool_state.key()
    )]
    pub personal_position: Box<Account<'info, PersonalPositionState>>,

    #[account(mut)]
    pub pool_state: AccountLoader<'info, raydium_clmm_cpi::states::PoolState>,

    #[account(
        mut,
        seeds = [
            POSITION_SEED.as_bytes(),
            pool_state.key().as_ref(),
            &personal_position.tick_lower_index.to_be_bytes(),
            &personal_position.tick_upper_index.to_be_bytes(),
        ],
        bump,
        constraint = protocol_position.pool_id == pool_state.key(),
        seeds::program = clmm_program,
    )]
    pub protocol_position: Box<Account<'info, ProtocolPositionState>>,

    /// The address that holds pool tokens for token_0
    #[account(
        mut,
        address = pool_state.load()?.token_vault_0
    )]
    pub token_0_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The address that holds pool tokens for token_1
    #[account(
        mut,
        address = pool_state.load()?.token_vault_1
    )]
    pub token_1_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Stores init state for the lower tick
    #[account(mut, constraint = tick_array_lower.load()?.pool_id == pool_state.key())]
    pub tick_array_lower: AccountLoader<'info, TickArrayState>,

    /// Stores init state for the upper tick
    #[account(mut, constraint = tick_array_upper.load()?.pool_id == pool_state.key())]
    pub tick_array_upper: AccountLoader<'info, TickArrayState>,

    /// The destination token account for receive amount_0
    #[account(
        mut,
        token::mint = token_0_vault.mint
    )]
    pub recipient_token_0_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The destination token account for receive amount_1
    #[account(
        mut,
        token::mint = token_1_vault.mint
    )]
    pub recipient_token_1_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// SPL program to transfer out tokens
    pub token_program: Program<'info, Token>,
    
    /// Token program 2022
    pub token_program_2022: Program<'info, Token2022>,

    /// memo program
    pub memo_program: Program<'info, Memo>,

    /// The mint of token vault 0
    #[account(
        address = token_0_vault.mint
    )]
    pub vault_0_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The mint of token vault 1
    #[account(
        address = token_1_vault.mint
    )]
    pub vault_1_mint: Box<InterfaceAccount<'info, Mint>>,
    // remaining account
    // #[account(
    //     seeds = [
    //         POOL_TICK_ARRAY_BITMAP_SEED.as_bytes(),
    //         pool_state.key().as_ref(),
    //     ],
    //     bump
    // )]
    // pub tick_array_bitmap: AccountLoader<'info, TickArrayBitmapExtension>,
}

pub fn collect_clmm_fees_and_rewards<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, CollectClmmFeeAndReward<'info>>,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::CollectClmmFeeAndReward {
        authority:ctx.accounts.authority.to_account_info(),
        fee_nft_owner:ctx.accounts.fee_nft_owner.to_account_info(),
        fee_nft_account:ctx.accounts.fee_nft_account.to_account_info(),
        locked_position:ctx.accounts.locked_position.to_account_info(),
        clmm_program:ctx.accounts.clmm_program.to_account_info(),
        locked_nft_account:ctx.accounts.locked_nft_account.to_account_info(),
        personal_position:ctx.accounts.personal_position.to_account_info(),
        pool_state:ctx.accounts.pool_state.to_account_info(),
        protocol_position:ctx.accounts.protocol_position.to_account_info(),
        token_0_vault:ctx.accounts.token_0_vault.to_account_info(),
        token_1_vault:ctx.accounts.token_1_vault.to_account_info(),
        tick_array_lower:ctx.accounts.tick_array_lower.to_account_info(),
        tick_array_upper:ctx.accounts.tick_array_upper.to_account_info(),
        recipient_token_0_account:ctx.accounts.recipient_token_0_account.to_account_info(),
        recipient_token_1_account:ctx.accounts.recipient_token_1_account.to_account_info(),
        token_program:ctx.accounts.token_program.to_account_info(),
        token_program_2022:ctx.accounts.token_program_2022.to_account_info(),
        memo_program:ctx.accounts.memo_program.to_account_info(),
        vault_0_mint:ctx.accounts.vault_0_mint.to_account_info(),
        vault_1_mint:ctx.accounts.vault_1_mint.to_account_info(),
    };
    cpi::collect_clmm_fees_and_rewards(CpiContext::new(ctx.accounts.locking_program.to_account_info(), cpi_accounts).with_remaining_accounts(ctx.remaining_accounts.to_vec()))
}
