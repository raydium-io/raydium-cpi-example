use anchor_lang::prelude::*;

pub mod instructions;
use instructions::*;

declare_id!("A5DqDJBweQTieKjx3RXrnFHU1oQCD69edaDe5ztyn7KK");

#[program]
pub mod cp_swap_cpi {
    use super::*;

    pub fn proxy_initialize(
        ctx: Context<ProxyInitialize>,
        init_amount_0: u64,
        init_amount_1: u64,
        open_time: u64,
    ) -> Result<()> {
        instructions::proxy_initialize(ctx, init_amount_0, init_amount_1, open_time)
    }

    pub fn proxy_deposit(
        ctx: Context<ProxyDeposit>,
        lp_token_amount: u64,
        maximum_token_0_amount: u64,
        maximum_token_1_amount: u64,
    ) -> Result<()> {
        instructions::proxy_deposit(
            ctx,
            lp_token_amount,
            maximum_token_0_amount,
            maximum_token_1_amount,
        )
    }

    pub fn proxy_withdraw(
        ctx: Context<ProxyWithdraw>,
        lp_token_amount: u64,
        minimum_token_0_amount: u64,
        minimum_token_1_amount: u64,
    ) -> Result<()> {
        instructions::proxy_withdraw(
            ctx,
            lp_token_amount,
            minimum_token_0_amount,
            minimum_token_1_amount,
        )
    }

    pub fn proxy_swap_base_input(
        ctx: Context<ProxySwapBaseInput>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::proxy_swap_base_input(ctx, amount_in, minimum_amount_out)
    }

    pub fn proxy_swap_base_output(
        ctx: Context<ProxySwapBaseOutput>,
        max_amount_in: u64,
        amount_out: u64,
    ) -> Result<()> {
        instructions::proxy_swap_base_output(ctx, max_amount_in, amount_out)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
