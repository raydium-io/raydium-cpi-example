import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CpSwapCpi } from "../target/types/cp_swap_cpi";
import { setupInitializeTest, initialize } from "./utils";

describe("initialize test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  console.log("owner: ", owner.publicKey.toString());

  const program = anchor.workspace.CpSwapCpi as Program<CpSwapCpi>;

  const confirmOptions = {
    skipPreflight: true,
  };

  it("create pool", async () => {
    const { configAddress, token0, token0Program, token1, token1Program } =
      await setupInitializeTest(
        anchor.getProvider().connection,
        owner,
        { transferFeeBasisPoints: 0, MaxFee: 0 },
        confirmOptions
      );

    const initAmount0 = new BN(10000000000);
    const initAmount1 = new BN(10000000000);
    const { poolAddress, cpSwapPoolState, tx } = await initialize(
      program,
      owner,
      configAddress,
      token0,
      token0Program,
      token1,
      token1Program,
      confirmOptions,
      { initAmount0, initAmount1 }
    );

    console.log("pool address: ", poolAddress.toString(), " tx:", tx);
  });
});
