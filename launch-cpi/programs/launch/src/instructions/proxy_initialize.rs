use anchor_lang::{accounts::interface_account::InterfaceAccount, prelude::*};
use anchor_spl::{
    metadata::Metadata,
    token::spl_token,
    token::Token,
    token_interface::{Mint, TokenInterface},
};
use raydium_launch_cpi::states::*;
use raydium_launch_cpi::{cpi, program::RaydiumLaunchpad};

/// Accounts required for initializing a new trading pool
#[derive(Accounts)]
#[instruction(base_mint_param: MintParams)]
pub struct ProxyInitialize<'info> {
    ///  Raydium launchpad program
    pub launchpad_program: Program<'info, RaydiumLaunchpad>,
    /// The account paying for the initialization costs
    /// This can be any account with sufficient SOL to cover the transaction
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: The creator of base token
    #[account()]
    pub creator: UncheckedAccount<'info>,

    /// Global configuration account containing protocol-wide settings
    /// Includes settings like quote token mint and fee parameters
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// Platform configuration account containing platform info
    /// Includes settings like the fee_rate, name, web, img of the platform
    pub platform_config: Box<Account<'info, PlatformConfig>>,

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

    /// CHECK: Account that stores the pool's state and parameters
    /// PDA generated using POOL_SEED and both token mints
    #[account(
        mut,
        seeds = [
            POOL_SEED.as_bytes(),
            base_mint.key().as_ref(),
            quote_mint.key().as_ref()
        ],
        bump,
        seeds::program = launchpad_program.key(),
    )]
    pub pool_state: UncheckedAccount<'info>,

    /// The mint for the base token (token being sold)
    /// Created in this instruction with specified decimals
    #[account(
        mut,
        // mint::decimals = base_mint_param.decimals,
        // mint::authority = authority,
        // mint::token_program = base_token_program,
    )]
    pub base_mint: Signer<'info>,

    /// The mint for the quote token (token used to buy)
    /// Must match the quote_mint specified in global config
    #[account(
        address = global_config.quote_mint,
        mint::token_program = quote_token_program
    )]
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    /// Token account that holds the pool's base tokens
    /// PDA generated using POOL_VAULT_SEED
    /// CHECK: Initialized in this instruction
    #[account(
        mut,
        seeds =[
            POOL_VAULT_SEED.as_bytes(),
            pool_state.key().as_ref(),
            base_mint.key().as_ref(),
        ],
        bump,
        // token::mint = base_mint,
        // token::authority = authority,
        // token::token_program = base_token_program,
        seeds::program = launchpad_program.key(),
    )]
    pub base_vault: UncheckedAccount<'info>,

    /// Token account that holds the pool's quote tokens
    /// PDA generated using POOL_VAULT_SEED
    /// CHECK: Initialized in this instruction
    #[account(
        mut,
        seeds =[
            POOL_VAULT_SEED.as_bytes(),
            pool_state.key().as_ref(),
            quote_mint.key().as_ref(),
        ],
        bump,
        // token::mint = quote_mint,
        // token::authority = authority,
        // token::token_program = quote_token_program,
        seeds::program = launchpad_program.key(),
    )]
    pub quote_vault: UncheckedAccount<'info>,

    /// Account to store the base token's metadata
    /// Created using Metaplex metadata program
    /// CHECK: Safety check performed inside metadata program   
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    /// SPL Token program for the base token
    /// Must be the standard Token program
    #[account(
        address = spl_token::id()
    )]
    pub base_token_program: Interface<'info, TokenInterface>,

    /// SPL Token program for the quote token
    pub quote_token_program: Program<'info, Token>,

    /// Metaplex Token Metadata program
    /// Used to create metadata for the base token
    pub metadata_program: Program<'info, Metadata>,

    /// Required for account creation
    pub system_program: Program<'info, System>,

    /// Required for rent exempt calculations
    pub rent_program: Sysvar<'info, Rent>,
    /// CHECK: Only the event authority can invoke self-CPI
    #[account(
        seeds = [b"__event_authority"],
        seeds::program = launchpad_program.key(),
        bump
    )]
    pub event_authority: AccountInfo<'info>,
}

/// Initializes a new trading pool with the specified paramete
pub fn proxy_initialize(
    ctx: Context<ProxyInitialize>,
    base_mint_param: MintParams,
    curve_param: CurveParams,
    vesting_param: VestingParams,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::Initialize {
        payer: ctx.accounts.payer.to_account_info(),
        creator: ctx.accounts.creator.to_account_info(),
        global_config: ctx.accounts.global_config.to_account_info(),
        platform_config: ctx.accounts.platform_config.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        base_mint: ctx.accounts.base_mint.to_account_info(),
        base_vault: ctx.accounts.base_vault.to_account_info(),
        quote_mint: ctx.accounts.quote_mint.to_account_info(),
        quote_vault: ctx.accounts.quote_vault.to_account_info(),
        metadata_account: ctx.accounts.metadata_account.to_account_info(),
        base_token_program: ctx.accounts.base_token_program.to_account_info(),
        quote_token_program: ctx.accounts.quote_token_program.to_account_info(),
        metadata_program: ctx.accounts.metadata_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent_program: ctx.accounts.rent_program.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.launchpad_program.to_account_info(),
    };

    cpi::initialize(
        CpiContext::new(
            ctx.accounts.launchpad_program.to_account_info(),
            cpi_accounts,
        ),
        base_mint_param,
        curve_param,
        vesting_param,
    )
}
