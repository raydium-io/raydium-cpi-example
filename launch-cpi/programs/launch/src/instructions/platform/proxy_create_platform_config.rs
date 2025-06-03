use anchor_lang::prelude::*;
use raydium_launch_cpi::states::*;
use raydium_launch_cpi::{cpi, program::RaydiumLaunchpad};

#[derive(Accounts)]
pub struct ProxyCreatePlatformConfig<'info> {
    ///  Raydium launchpad program
    pub launchpad_program: Program<'info, RaydiumLaunchpad>,
    /// The account paying for the initialization costs  
    #[account(mut)]
    pub platform_admin: Signer<'info>,

    /// CHECK:The wallet for the platform to receive platform fee
    #[account()]
    pub platform_fee_wallet: UncheckedAccount<'info>,

    /// CHECK:The wallet for the platform to receive migrate liquidity nft(Only support cpswap program)
    #[account()]
    pub platform_nft_wallet: UncheckedAccount<'info>,

    /// The platform config account
    #[account(
        seeds =[
            PLATFORM_CONFIG_SEED.as_bytes(),
            platform_admin.key().as_ref(),
        ],
        bump,
        seeds::program = launchpad_program.key(),
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK:CpSwap config Account.
    #[account(
        owner = raydium_launch_cpi::cpswap_program::ID,
    )]
    pub cpswap_config: UncheckedAccount<'info>,

    /// Required for account creation
    pub system_program: Program<'info, System>,
}

pub fn proxy_create_platform_config(
    ctx: Context<ProxyCreatePlatformConfig>,
    platform_params: PlatformParams,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::CreatePlatformConfig {
        platform_admin: ctx.accounts.platform_admin.to_account_info(),
        platform_fee_wallet: ctx.accounts.platform_fee_wallet.to_account_info(),
        platform_nft_wallet: ctx.accounts.platform_nft_wallet.to_account_info(),
        platform_config: ctx.accounts.platform_config.to_account_info(),
        cpswap_config: ctx.accounts.cpswap_config.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    cpi::create_platform_config(
        CpiContext::new(
            ctx.accounts.launchpad_program.to_account_info(),
            cpi_accounts,
        ),
        platform_params,
    )
}
