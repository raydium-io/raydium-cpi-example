use anchor_lang::prelude::*;
pub mod instructions;
pub use instructions::*;

declare_id!("8wGnAiSXYK31kdas6qNgfr8N3pzHoBEAaDK824qgYE81");

#[program]
pub mod clmm_cpi {
    use super::*;

    pub fn proxy_initialize(
        ctx: Context<ProxyInitialize>,
        sqrt_price_x64: u128,
        open_time: u64,
    ) -> Result<()> {
        instructions::proxy_initialize(ctx, sqrt_price_x64, open_time)
    }

    pub fn proxy_open_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxyOpenPosition<'info>>,
        tick_lower_index: i32,
        tick_upper_index: i32,
        tick_array_lower_start_index: i32,
        tick_array_upper_start_index: i32,
        liquidity: u128,
        amount_0_max: u64,
        amount_1_max: u64,
        with_matedata: bool,
        base_flag: Option<bool>,
    ) -> Result<()> {
        instructions::proxy_open_position(
            ctx,
            tick_lower_index,
            tick_upper_index,
            tick_array_lower_start_index,
            tick_array_upper_start_index,
            liquidity,
            amount_0_max,
            amount_1_max,
            with_matedata,
            base_flag,
        )
    }
    pub fn proxy_close_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxyClosePosition<'info>>,
    ) -> Result<()> {
        instructions::proxy_close_position(ctx)
    }

    pub fn proxy_increase_liquidity<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxyIncreaseLiquidity<'info>>,
        liquidity: u128,
        amount_0_max: u64,
        amount_1_max: u64,
        base_flag: Option<bool>,
    ) -> Result<()> {
        instructions::proxy_increase_liquidity(
            ctx,
            liquidity,
            amount_0_max,
            amount_1_max,
            base_flag,
        )
    }
    pub fn proxy_decrease_liquidity<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxyDecreaseLiquidity<'info>>,
        liquidity: u128,
        amount_0_min: u64,
        amount_1_min: u64,
    ) -> Result<()> {
        instructions::proxy_decrease_liquidity(ctx, liquidity, amount_0_min, amount_1_min)
    }
    pub fn proxy_swap<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
        amount: u64,
        other_amount_threshold: u64,
        sqrt_price_limit_x64: u128,
        is_base_input: bool,
    ) -> Result<()> {
        instructions::proxy_swap(
            ctx,
            amount,
            other_amount_threshold,
            sqrt_price_limit_x64,
            is_base_input,
        )
    }
}
