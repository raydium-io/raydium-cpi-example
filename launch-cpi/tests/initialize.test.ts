import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { LaunchCpiExample } from "../target/types/launch_cpi_example";
import {
  setupInitializeTest,
  initialize,
  defaultCurveParam,
  defaultMintParam,
  defaultVestingParam,
  getConfigAddress,
} from "./utils";
import { assert } from "chai";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

describe("initialize test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  console.log("owner: ", owner.publicKey.toString());

  const program = anchor.workspace
    .LaunchCpiExample as Program<LaunchCpiExample>;
  const confirmOptions = {
    skipPreflight: true,
  };

  it("initialize", async () => {
    const as = await getConfigAddress(
      NATIVE_MINT,
      new PublicKey("LanD8FpTBBvzZFXjTxsAoipkFsxPUCDB4qAqKxYDiNP"),
      0,
      0
    );
    console.log("as:", as.toString());

    const {
      configAddress,
      baseTokenMint,
      baseTokenProgram,
      quoteTokenMint,
      quoteTokenProgram,
      platformConfigAddress,
    } = await setupInitializeTest(
      program,
      anchor.getProvider().connection,
      owner,
      owner.publicKey,
      new BN(0),
      new BN(0),
      confirmOptions
    );

    const { tx, poolAddress } = await initialize(
      program,
      owner,
      configAddress,
      baseTokenMint,
      quoteTokenMint,
      baseTokenProgram,
      quoteTokenProgram,
      platformConfigAddress,
      defaultMintParam,
      defaultCurveParam,
      defaultVestingParam,
      confirmOptions
    );
    console.log("initialize tx: ", tx);
  });
});
