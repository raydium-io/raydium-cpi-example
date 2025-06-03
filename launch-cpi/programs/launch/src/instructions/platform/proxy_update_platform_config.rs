use anchor_lang::prelude::*;
use raydium_launch_cpi::states::*;
use raydium_launch_cpi::{cpi, program::RaydiumLaunchpad};

#[derive(Accounts)]
pub struct ProxyUpdatePlatformConfig<'info> {
    ///  Raydium launchpad program
    pub launchpad_program: Program<'info, RaydiumLaunchpad>,
    /// The account paying for the initialization costs  
    pub platform_admin: Signer<'info>,

    /// Platform config account to be changed
    #[account(
        mut,
        seeds =[
            PLATFORM_CONFIG_SEED.as_bytes(),
            platform_admin.key().as_ref(),
        ],
        bump,
        seeds::program = launchpad_program.key(),
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    // maybe remaining_accounts need:
    // #[account(
    //     owner = crate::cpswap_program::ID,
    // )]
    // pub cpswap_config: UncheckedAccount<'info>,
}

pub fn proxy_update_platform_config<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ProxyUpdatePlatformConfig<'info>>,
    param: PlatformConfigParam,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::UpdatePlatformConfig {
        platform_admin: ctx.accounts.platform_admin.to_account_info(),
        platform_config: ctx.accounts.platform_config.to_account_info(),
    };

    cpi::update_platform_config(
        CpiContext::new(
            ctx.accounts.launchpad_program.to_account_info(),
            cpi_accounts,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        param,
    )
}
