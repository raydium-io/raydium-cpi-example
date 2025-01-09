use anchor_lang::prelude::*;
pub mod instructions;
use instructions::*;

declare_id!("GetjZcKAaw6HCwF4exEaD8vRwrXR1W7f1HRL9SudYRbJ");

#[program]
pub mod locking_cpi_example {
    use super::*;

    /// Lock an existing clmm's position
    ///
    /// # Arguments
    ///
    /// * `ctx` -  The context of accounts
    /// * `with_metadata` -  Create NFT with metadata or not
    ///
    pub fn lock_clmm_position<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, LockClmmPosition<'info>>,
        with_metadata: bool,
    ) -> Result<()> {
        instructions::lock_clmm_position(ctx, with_metadata)
    }

    /// collect clmm locked postion fees and rewards
    /// # Arguments
    ///
    /// * `ctx` -  The context of accounts
    ///
    pub fn collect_clmm_fees_and_rewards<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, CollectClmmFeeAndReward<'info>>,
    ) -> Result<()> {
        instructions::collect_clmm_fees_and_rewards(ctx)
    }

    /// Lock cpSwap liquidity and mint a nft to collect locked liquidity's fee.
    ///
    /// # Arguments
    ///
    /// * `ctx` -  The context of accounts
    /// * `lp_amount` -  The lp amount to lock
    /// * `with_metadata` -  Create NFT with metadata or not
    ///
    pub fn lock_cp_liquidity<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, LockCpLiquidity<'info>>,
        lp_amount: u64,
        with_metadata: bool,
    ) -> Result<()> {
        instructions::lock_cp_liquidity(ctx, lp_amount, with_metadata)
    }

    /// collect cpSwap locked liquidity's fees
    /// # Arguments
    ///
    /// * `ctx` -  The context of accounts
    ///
    pub fn collect_cp_fees<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, CollectCpFee<'info>>,
    ) -> Result<()> {
        instructions::collect_cp_fees(ctx)
    }
}
