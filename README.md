# Raydium-cpi-example

Example of CPI call, relying on Raydium's CLMM/CPMM/AMM main contracts

## Environmental requirements

```
solana-cli 1.17.0
anchor-cli 0.29.0
```

<font color="red"> If you are using a newer version of the anchor, please refer to examples and development environment requirements from other branches.</font>

## Accounts

Some accounts are convenient for testing purposes.

### CPMM

| network     | devnet                                       | mainnet                                      |
| ----------- | -------------------------------------------- | -------------------------------------------- |
| Program     | DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb | CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C |
| AmmConfig   | 5MxLgy9oPdTC3YgkiePHqr3EoCRD9uLVYRQS2ANAs7wy | D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2 |
| FeeReceiver | 3oE58BKVt8KuYkGxx8zBojugnymWmBiyafWgMrnb6eYy | DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8 |

### CLMM

| network   | devnet                                       | mainnet                                      |
| --------- | -------------------------------------------- | -------------------------------------------- |
| Program   | DRayAUgENGQBKVaX8owNhgzkEDyoHTGVEGHVJT1E9pfH  | CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK |
| AmmConfig | CD4aJtX11cqTCAc83nxSPkkh5JW2yjD6uwHeovjqQ1qu | 4BLNHtVe942GSs4teSZqGX24xwKNkqU7bGgNn3iUiUpw |

## Devnet Test

If your contract is completed and you want to deploy it on devnet, please pay attention to the `devnet` feature in the [example](https://github.com/raydium-io/raydium-cpi-example/blob/master/cpmm-cpi/programs/cpmm-cpi/Cargo.toml#L17). Use the following command when compiling: 
```
anchor build -- --features devnet
```