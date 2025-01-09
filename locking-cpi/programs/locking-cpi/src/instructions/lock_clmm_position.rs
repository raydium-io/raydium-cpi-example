use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::Metadata,
    token::Token,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use raydium_clmm_cpi::states::PersonalPositionState;
use raydium_locking_cpi::{cpi, program::RaydiumLiquidityLocking, states::LOCKED_POSITION_SEED};

#[derive(Accounts)]
pub struct LockClmmPosition<'info> {
    pub locking_program: Program<'info, RaydiumLiquidityLocking>,

    /// CHECK: the authority of position nft account that clmm is locked
    #[account(
         seeds = [
            raydium_locking_cpi::LOCK_CLMM_AUTH_SEED.as_bytes(),
        ],
        bump,
        seeds::program = locking_program.key(),
    )]
    pub authority: UncheckedAccount<'info>,

    /// Pay to create account lamports
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The position NFT owner
    pub position_nft_owner: Signer<'info>,

    /// CHECK: locked position NFT allows who to collect fee
    pub fee_nft_owner: UncheckedAccount<'info>,

    /// The token account for the tokenized position
    #[account(
        mut,
        constraint = position_nft_account.mint == personal_position.nft_mint && position_nft_account.amount == 1,
        token::authority = position_nft_owner,
        token::token_program = locked_nft_token_program,
    )]
    pub position_nft_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Lock personal position associated with position_nft_account's mint
    #[account()]
    pub personal_position: Box<Account<'info, PersonalPositionState>>,

    /// Position NFT mint to create a ATA `locked_nft_account` belongs to program
    #[account(
        address = position_nft_account.mint
    )]
    pub position_nft_mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: Program's token account where `position_nft_account` will transfer to, init by locking program
    #[account(
        mut,
        // associated_token::mint = position_nft_mint,
        // associated_token::authority = authority,
        // associated_token::token_program = locked_nft_token_program,
    )]
    pub locked_nft_account: UncheckedAccount<'info>,

    /// CHECK: Store the locked information of the personal position, init by locking program
    #[account(
        mut,
        seeds = [
            LOCKED_POSITION_SEED.as_bytes(),
            fee_nft_mint.key().as_ref(),
        ],
        bump,
        seeds::program = locking_program.key(),
    )]
    pub locked_position: UncheckedAccount<'info>,

    /// CHECK: Create a unique fee nft mint, init by locking program
    #[account(mut)]
    pub fee_nft_mint: Signer<'info>,

    /// CHECK: Token account where fee nft will be minted to, init by locking program
    #[account(
        mut,
        // associated_token::mint = fee_nft_mint,
        // associated_token::authority = fee_nft_owner,
        // associated_token::token_program = fee_nft_token_program,
    )]
    pub fee_nft_account: UncheckedAccount<'info>,

    /// To store metaplex metadata
    /// CHECK: Safety check performed inside function body
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    /// Program to create NFT metadata account
    /// CHECK: Metadata program address constraint applied
    pub metadata_program: Program<'info, Metadata>,

    /// Program to create an ATA for receiving fee NFT
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// Sysvar for token mint and ATA creation
    pub rent: Sysvar<'info, Rent>,

    /// Token program fee NFT mint/account belongs to
    pub fee_nft_token_program: Program<'info, Token>,

    /// Token program position NFT mint/account belongs to
    pub locked_nft_token_program: Interface<'info, TokenInterface>,

    /// Program to create new account
    pub system_program: Program<'info, System>,
}

pub fn lock_clmm_position<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, LockClmmPosition<'info>>,
    with_metadata: bool,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::LockClmmPosition {
        authority: ctx.accounts.authority.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        position_nft_owner: ctx.accounts.position_nft_owner.to_account_info(),
        fee_nft_owner: ctx.accounts.fee_nft_owner.to_account_info(),
        position_nft_account: ctx.accounts.position_nft_account.to_account_info(),
        personal_position: ctx.accounts.personal_position.to_account_info(),
        position_nft_mint: ctx.accounts.position_nft_mint.to_account_info(),
        locked_nft_account: ctx.accounts.locked_nft_account.to_account_info(),
        locked_position: ctx.accounts.locked_position.to_account_info(),
        fee_nft_mint: ctx.accounts.fee_nft_mint.to_account_info(),
        fee_nft_account: ctx.accounts.fee_nft_account.to_account_info(),
        metadata_account: ctx.accounts.metadata_account.to_account_info(),
        metadata_program: ctx.accounts.metadata_program.to_account_info(),
        associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        fee_nft_token_program: ctx.accounts.fee_nft_token_program.to_account_info(),
        locked_nft_token_program: ctx.accounts.locked_nft_token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.locking_program.to_account_info(), cpi_accounts);
    cpi::lock_clmm_position(cpi_context, with_metadata)
}
