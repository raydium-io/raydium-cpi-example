import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { LaunchCpiExample } from "../target/types/launch_cpi_example";
import {
  buyExactIn,
  buyExactOut,
  sellExactIn,
  sellExactOut,
  setupSwapTest,
} from "./utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("swap test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;

  const program = anchor.workspace
    .LaunchCpiExample as Program<LaunchCpiExample>;

  const confirmOptions = {
    skipPreflight: true,
  };

  it("buy/sell exact in test", async () => {
    const {
      configAddress,
      baseTokenMintKeyPair,
      quoteTokenMint,
      platformConfigAddress,
    } = await setupSwapTest(
      program,
      anchor.getProvider().connection,
      owner,
      owner.publicKey,
      new BN(0),
      new BN(0)
    );
    await sleep(1000);
    let amount_in = new BN(100000000);
    let tx = await buyExactIn(
      program,
      owner,
      configAddress,
      baseTokenMintKeyPair.publicKey,
      quoteTokenMint,
      TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      platformConfigAddress,
      amount_in,
      new BN(0)
    );
    console.log("buyExactIn tx: ", tx);
    await sleep(1000);
    tx = await sellExactIn(
      program,
      owner,
      configAddress,
      baseTokenMintKeyPair.publicKey,
      quoteTokenMint,
      TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      platformConfigAddress,
      new BN(100000000),
      new BN(0),
      confirmOptions
    );
    console.log("sellExactIn tx: ", tx);
  });

  it("buy/sell exact out test", async () => {
    const {
      configAddress,
      baseTokenMintKeyPair,
      quoteTokenMint,
      platformConfigAddress,
    } = await setupSwapTest(
      program,
      anchor.getProvider().connection,
      owner,
      owner.publicKey,
      new BN(0),
      new BN(0)
    );
    await sleep(1000);
    let buyAmountOut = new BN(100000000);
    let tx = await buyExactOut(
      program,
      owner,
      configAddress,
      baseTokenMintKeyPair.publicKey,
      quoteTokenMint,
      TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      platformConfigAddress,
      buyAmountOut, // 100000000
      new BN(1000000000000000) // 1000000000000000
    );
    console.log("buyExactOut tx: ", tx);
    await sleep(1000);

    const sellAmountOut = new BN(100);
    tx = await sellExactOut(
      program,
      owner,
      configAddress,
      baseTokenMintKeyPair.publicKey,
      quoteTokenMint,
      TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      platformConfigAddress,
      sellAmountOut,
      new BN(1000000000000000),
      confirmOptions
    );
    console.log("sellExactOut tx: ", tx);
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
