use anchor_lang::prelude::*;
use raydium_launch_cpi::states::*;
use raydium_launch_cpi::{cpi, program::RaydiumLaunchpad};

#[derive(Accounts)]
pub struct ProxyCreateVestingAccount<'info> {
    ///  Raydium launchpad program
    pub launchpad_program: Program<'info, RaydiumLaunchpad>,
    /// The account paying for the initialization costs
    /// This can be any account with sufficient SOL to cover the transaction    
    #[account(
        mut,
        address = pool_state.creator
    )]
    pub creator: Signer<'info>,

    /// CHECK:The beneficiary of the vesting account
    /// The beneficiary is used to receive the allocated linear release of tokens.
    /// Once this account is set, it cannot be modified, so please ensure the validity of this account,
    /// otherwise, the unlocked tokens will not be claimable.
    #[account(mut)]
    pub beneficiary: UncheckedAccount<'info>,

    /// The pool state account
    #[account(mut)]
    pub pool_state: Account<'info, PoolState>,

    /// CHECK: The vesting record account
    #[account(
        seeds =[
            POOL_VESTING_SEED.as_bytes(),
            pool_state.key().as_ref(),
            beneficiary.key().as_ref(),
        ],
        bump,
        seeds::program = launchpad_program.key(),
    )]
    pub vesting_record: UncheckedAccount<'info>,

    /// Required for account creation
    pub system_program: Program<'info, System>,
}

pub fn proxy_create_vesting_account(
    ctx: Context<ProxyCreateVestingAccount>,
    share_amount: u64,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::CreateVestingAccount {
        creator: ctx.accounts.creator.to_account_info(),
        beneficiary: ctx.accounts.beneficiary.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        vesting_record: ctx.accounts.vesting_record.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    cpi::create_vesting_account(
        CpiContext::new(
            ctx.accounts.launchpad_program.to_account_info(),
            cpi_accounts,
        ),
        share_amount,
    )
}
