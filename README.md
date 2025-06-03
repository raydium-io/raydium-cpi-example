# Raydium-cpi-example

Example of CPI call, relying on raydium-cpi [repo](https://github.com/raydium-io/raydium-cpi).

## Environmental requirements

```
solana-cli 2.1.0
anchor-cli 0.31.0
```

## Accounts

Some accounts are convenient for testing purposes.

### CPMM

| network     | devnet                                       | mainnet                                      |
| ----------- | -------------------------------------------- | -------------------------------------------- |
| Program     | CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW | CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C |
| AmmConfig   | 9zSzfkYy6awexsHvmggeH36pfVUdDGyCcwmjT3AQPBj6 | D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2 |
| FeeReceiver | G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2 | DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8 |

### CLMM

| network   | devnet                                       | mainnet                                      |
| --------- | -------------------------------------------- | -------------------------------------------- |
| Program   | devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH  | CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK |
| AmmConfig | CQYbhr6amxUER4p5SC44C63R4qw4NFc9Z4Db9vF4tZwG | 4BLNHtVe942GSs4teSZqGX24xwKNkqU7bGgNn3iUiUpw |

### Locking

| network   | devnet                                       | mainnet                                      |
| --------- | -------------------------------------------- | -------------------------------------------- |
| Program   | DLockwT7X7sxtLmGH9g5kmfcjaBtncdbUmi738m5bvQC  | LockrWmn6K5twhz3y9w1dQERbmgSaRkfnTeTKbpofwE |

### Launch

| network   | devnet                                       | mainnet                                      |
| --------- | -------------------------------------------- | -------------------------------------------- |
| Program   | LanD8FpTBBvzZFXjTxsAoipkFsxPUCDB4qAqKxYDiNP  | LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj |
| GlobalConfig | A8uLQd7fLHJw8aGfHZB7CA3p9kmdUCCWd4QyLFvxNSid | 6s1xP3hpbAfFoNtUNF8mfHsjr2Bd97JxFJRWLbL6aHuX |


## Devnet Test

If you want to test on devnet, please pay attention to the `devnet` feature in the [example](https://github.com/raydium-io/raydium-cpi-example/blob/master/cpmm-cpi/programs/cpmm-cpi/Cargo.toml#L17). Use the following command when compiling:
```
anchor build -- --features devnet
```
