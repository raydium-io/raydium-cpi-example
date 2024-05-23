
use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{Mint,TokenAccount};
use raydium_amm_v3::{
    cpi,
    program::AmmV3,
    states::{PersonalPositionState, POSITION_SEED,},
};
#[derive(Accounts)]
pub struct ProxyClosePosition<'info> {
    pub clmm_program: Program<'info, AmmV3>,
    /// The position nft owner
    #[account(mut)]
    pub nft_owner: Signer<'info>,

    /// Unique token mint address
    #[account(
      mut,
      address = personal_position.nft_mint,
      mint::token_program = token_program,
    )]
    pub position_nft_mint: Box<InterfaceAccount<'info, Mint>>,

    /// Token account where position NFT will be minted
    #[account(
        mut,
        associated_token::mint = position_nft_mint,
        associated_token::authority = nft_owner,
        constraint = position_nft_account.amount == 1,
        token::token_program = token_program,
    )]
    pub position_nft_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// To store metaplex metadata
    /// CHECK: Safety check performed inside function body
    // #[account(mut)]
    // pub metadata_account: UncheckedAccount<'info>,

    /// Metadata for the tokenized position
    #[account(
        mut, 
        seeds = [POSITION_SEED.as_bytes(), position_nft_mint.key().as_ref()],
        bump,
        close = nft_owner
    )]
    pub personal_position: Box<Account<'info, PersonalPositionState>>,

    /// Program to create the position manager state account
    pub system_program: Program<'info, System>,
    /// Program to create mint account and mint tokens
    pub token_program: Program<'info, Token>,
    // /// Reserved for upgrade
    // pub token_program_2022: Program<'info, Token2022>,
}

pub fn proxy_close_position<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ProxyClosePosition<'info>>,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::ClosePosition {
        nft_owner:ctx.accounts.nft_owner.to_account_info(),
        position_nft_mint:ctx.accounts.position_nft_mint.to_account_info(),
        position_nft_account:ctx.accounts.position_nft_account.to_account_info(),
        personal_position:ctx.accounts.personal_position.to_account_info(),
        system_program:ctx.accounts.system_program.to_account_info(),
        token_program:ctx.accounts.token_program.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.clmm_program.to_account_info(), cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec());
    cpi::close_position( cpi_context)
}