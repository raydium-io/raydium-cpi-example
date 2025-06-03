use anchor_lang::prelude::*;

pub mod instructions;
use instructions::*;

use raydium_launch_cpi::states::{
    CurveParams, MintParams, PlatformConfigParam, PlatformParams, VestingParams,
};

declare_id!("CiGdspnMYqzgRLp8nKcbXXryBeDeJ4UKZZbgoqy9NV8i");

#[program]
pub mod launch_cpi_example {
    use super::*;

    /// Initializes a new trading pool
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts containing pool and token information
    ///
    pub fn proxy_initialize(
        ctx: Context<ProxyInitialize>,
        base_mint_param: MintParams,
        curve_param: CurveParams,
        vesting_param: VestingParams,
    ) -> Result<()> {
        instructions::proxy_initialize(ctx, base_mint_param, curve_param, vesting_param)
    }

    /// Use the given amount of quote tokens to purchase base tokens.
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    /// * `amount_in` - Amount of quote token to purchase
    /// * `minimum_amount_out` - Minimum amount of base token to receive (slippage protection)
    /// * `share_fee_rate` - Fee rate for the share
    ///
    pub fn proxy_buy_exact_in<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
        amount_in: u64,
        minimum_amount_out: u64,
        share_fee_rate: u64,
    ) -> Result<()> {
        instructions::proxy_buy_exact_in(ctx, amount_in, minimum_amount_out, share_fee_rate)
    }

    /// Use quote tokens to purchase the given amount of base tokens.
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    /// * `amount_out` - Amount of base token to receive
    /// * `maximum_amount_in` - Maximum amount of quote token to purchase (slippage protection)
    /// * `share_fee_rate` - Fee rate for the share
    pub fn proxy_buy_exact_out<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
        amount_out: u64,
        maximum_amount_in: u64,
        share_fee_rate: u64,
    ) -> Result<()> {
        instructions::proxy_buy_exact_out(ctx, amount_out, maximum_amount_in, share_fee_rate)
    }

    /// Use the given amount of base tokens to sell for quote tokens.
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    /// * `amount_in` - Amount of base token to sell
    /// * `minimum_amount_out` - Minimum amount of quote token to receive (slippage protection)
    /// * `share_fee_rate` - Fee rate for the share
    ///
    pub fn proxy_sell_exact_in<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
        amount_in: u64,
        minimum_amount_out: u64,
        share_fee_rate: u64,
    ) -> Result<()> {
        instructions::proxy_sell_exact_in(ctx, amount_in, minimum_amount_out, share_fee_rate)
    }

    /// Sell base tokens for the given amount of quote tokens.
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    /// * `amount_out` - Amount of quote token to receive
    /// * `maximum_amount_in` - Maximum amount of base token to purchase (slippage protection)
    /// * `share_fee_rate` - Fee rate for the share
    ///
    pub fn proxy_sell_exact_out<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
        amount_out: u64,
        maximum_amount_in: u64,
        share_fee_rate: u64,
    ) -> Result<()> {
        instructions::proxy_sell_exact_out(ctx, amount_out, maximum_amount_in, share_fee_rate)
    }

    /// Create vesting account
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    /// * `share` - The share amount of base token to be vested
    ///
    pub fn proxy_create_vesting_account(
        ctx: Context<ProxyCreateVestingAccount>,
        share_amount: u64,
    ) -> Result<()> {
        instructions::proxy_create_vesting_account(ctx, share_amount)
    }

    /// Claim vested token
    /// # Arguments
    pub fn proxy_claim_vested_token(ctx: Context<ProxyClaimVestedToken>) -> Result<()> {
        instructions::proxy_claim_vested_token(ctx)
    }

    /// Create platform config account
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    /// # Fields
    /// * `fee_rate` - Fee rate of the platform
    /// * `name` - Name of the platform
    /// * `web` - Website of the platform
    /// * `img` - Image link of the platform
    ///
    pub fn proxy_create_platform_config(
        ctx: Context<ProxyCreatePlatformConfig>,
        platform_params: PlatformParams,
    ) -> Result<()> {
        instructions::proxy_create_platform_config(ctx, platform_params)
    }

    /// Claim platform fee
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    ///
    pub fn proxy_claim_platform_fee(ctx: Context<ProxyClaimPlatformFee>) -> Result<()> {
        instructions::proxy_claim_platform_fee(ctx)
    }

    /// Update platform config
    /// # Arguments
    ///
    /// * `ctx` - The context of accounts
    /// * `param` - Parameter to update
    ///
    pub fn proxy_update_platform_confign<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxyUpdatePlatformConfig<'info>>,
        param: PlatformConfigParam,
    ) -> Result<()> {
        instructions::proxy_update_platform_config(ctx, param)
    }
}
