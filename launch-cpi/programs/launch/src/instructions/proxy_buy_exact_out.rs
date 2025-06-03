use crate::instructions::proxy_buy_exact_in::ProxySwap;
use anchor_lang::prelude::*;
use raydium_launch_cpi::cpi;

/// Use quote tokens to purchase the given amount of base tokens.
pub fn proxy_buy_exact_out<'a, 'b, 'c: 'info, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
    amount_out: u64,
    maximum_amount_in: u64,
    share_fee_rate: u64,
) -> Result<()> {
    let cpi_accounts = cpi::accounts::Swap {
        payer: ctx.accounts.payer.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
        global_config: ctx.accounts.global_config.to_account_info(),
        platform_config: ctx.accounts.platform_config.to_account_info(),
        pool_state: ctx.accounts.pool_state.to_account_info(),
        user_base_token: ctx.accounts.user_base_token.to_account_info(),
        user_quote_token: ctx.accounts.user_quote_token.to_account_info(),
        base_vault: ctx.accounts.base_vault.to_account_info(),
        quote_vault: ctx.accounts.quote_vault.to_account_info(),
        base_token_mint: ctx.accounts.base_token_mint.to_account_info(),
        quote_token_mint: ctx.accounts.quote_token_mint.to_account_info(),
        base_token_program: ctx.accounts.base_token_program.to_account_info(),
        quote_token_program: ctx.accounts.quote_token_program.to_account_info(),
        event_authority: ctx.accounts.event_authority.to_account_info(),
        program: ctx.accounts.launchpad_program.to_account_info(),
    };

    cpi::buy_exact_out(
        CpiContext::new(
            ctx.accounts.launchpad_program.to_account_info(),
            cpi_accounts,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        amount_out,
        maximum_amount_in,
        share_fee_rate,
    )
}
