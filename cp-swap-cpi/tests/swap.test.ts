import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CpSwapCpi } from "../target/types/cp_swap_cpi";
import { setupSwapTest, swap_base_input, swap_base_output } from "./utils";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { configAddress } from "./config";

describe("swap test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;

  const program = anchor.workspace.CpSwapCpi as Program<CpSwapCpi>;

  const confirmOptions = {
    skipPreflight: true,
  };

  it("swap base input", async () => {
    const cpSwapPoolState = await setupSwapTest(
      program,
      anchor.getProvider().connection,
      owner,
      { transferFeeBasisPoints: 0, MaxFee: 0 }
    );
    const inputToken = cpSwapPoolState.token0Mint;
    const inputTokenProgram = cpSwapPoolState.token0Program;
    let amount_in = new BN(100000000);
    const baseInTx = await swap_base_input(
      program,
      owner,
      configAddress,
      inputToken,
      inputTokenProgram,
      cpSwapPoolState.token1Mint,
      cpSwapPoolState.token1Program,
      amount_in,
      new BN(0)
    );
    console.log("baseInputTx:", baseInTx);
  });

  it("swap base output ", async () => {
    const cpSwapPoolState = await setupSwapTest(
      program,
      anchor.getProvider().connection,
      owner,
      { transferFeeBasisPoints: 0, MaxFee: 0 }
    );
    const inputToken = cpSwapPoolState.token0Mint;
    const inputTokenProgram = cpSwapPoolState.token0Program;
    let amount_out = new BN(100000000);
    const baseOutTx = await swap_base_output(
      program,
      owner,
      configAddress,
      inputToken,
      inputTokenProgram,
      cpSwapPoolState.token1Mint,
      cpSwapPoolState.token1Program,
      amount_out,
      new BN(10000000000000),
      confirmOptions
    );
    console.log("baseOutputTx:", baseOutTx);
  });
});
