import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CpSwapCpi } from "../target/types/cp_swap_cpi";
import { deposit, setupDepositTest } from "./utils";

describe("deposit test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;

  const program = anchor.workspace.CpSwapCpi as Program<CpSwapCpi>;

  const confirmOptions = {
    skipPreflight: true,
  };

  it("deposit test", async () => {
    const cpSwapPoolState = await setupDepositTest(
      program,
      anchor.getProvider().connection,
      owner,
      { transferFeeBasisPoints: 0, MaxFee: 0 }
    );

    const liquidity = new BN(10000000000);
    const depositTx = await deposit(
      program,
      owner,
      cpSwapPoolState.ammConfig,
      cpSwapPoolState.token0Mint,
      cpSwapPoolState.token0Program,
      cpSwapPoolState.token1Mint,
      cpSwapPoolState.token1Program,
      liquidity,
      new BN(10000000000),
      new BN(20000000000),
      confirmOptions
    );
    console.log("depositTx:", depositTx);
  });
});
