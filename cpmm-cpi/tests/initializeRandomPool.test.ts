import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CpmmCpiExample } from "../target/types/cpmm_cpi_example";
import { setupInitializeTest, initialize, initializeRandomPool } from "./utils";
import { Keypair } from "@solana/web3.js";

describe("initialize with random pool test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  console.log("owner: ", owner.publicKey.toString());

  const program = anchor.workspace.CpmmCpiExample as Program<CpmmCpiExample>;

  const confirmOptions = {
    skipPreflight: true,
  };

  it("create random pool", async () => {
    const { configAddress, token0, token0Program, token1, token1Program } =
      await setupInitializeTest(
        anchor.getProvider().connection,
        owner,
        { transferFeeBasisPoints: 0, MaxFee: 0 },
        confirmOptions
      );
   
    const initAmount0 = new BN(10000000000);
    const initAmount1 = new BN(10000000000);
    const { poolAddress, cpSwapPoolState, tx } = await initializeRandomPool(
      program,
      owner,
      configAddress,
      token0,
      token0Program,
      token1,
      token1Program,
      confirmOptions,
      { initAmount0, initAmount1 },
    );

    console.log("pool address: ", poolAddress.toString(), " tx:", tx);
  });
});
