# Itheum Core
The core itheum technology repo. Holds smart contracts, chain dev kits etc.

![Itheum Core](https://raw.githubusercontent.com/Itheum/itheumcore/main/itheum-core-hero.png)

## Tech Tooling:
The following tech tools are used to dev/build/compile/run/deploy.

### Using lerna
The repo uses lerna for better management of sub/mono repos. Here is how you use it.

### Using hardhat
Contracts dev is via hardhat. Some useful commands:

- `npx hardhat accounts`: Gives you your accounts
- `npx hardhat compile`: Compiles all contracts in folder
- `npx hardhat test`: runs unit tests or use `npx hardhat watch test` to run in test watch mode
- `npx hardhat watch tdd` to run in TDD watch mode (updating contracts and saving will compile all and run tests)

#### Adding hardhat local chain to metamask
- basically after running the `npx hardhat node` you need to do this (https://www.youtube.com/watch?v=FTDEX3S1eqU) to add it to metamask and add local chain addresses to metamask
- the chainID will be `31337` and the datadex already has this enabled to work with hardhat

#### Deploying contract dev environment
- first run the local chain; in a seperate terminal run `npx hardhat node` (this loads chain into localhost:8545)
- Compile all contracts in folde via `npx hardhat compile`
- deploy via `npx hardhat run scripts/itheumcore-script.js --network localhost`

### Deploying into testnet
- Compile all contracts in folde via `npx hardhat compile`
- deploy via `npx hardhat run scripts/itheumcore-script.js --network {testnet_code}`
- The following `{testnet_code}`s are supported: `bsc_testnet` `harmony_testnet` `platon_testnet`

### Local environemnt dev requirements
- If you are `Deploying into testnet` , it needs some ENV vars. You need to create a `.env` file and add the ENV vars are used in the `hardhat.config.js` file.
- Each chain's private key will be in `[XXX]_TESTNET_KEY`, it's best practice to use a single dev usage wallet aross chains. So create a `dedicated wallet` then use it across all chains.
- Before you deploy your contracts into a chain, you need to make sure that the wallet used has funds in it for gas costs. In testnets, you can use the chain faucets to feed that wallet.

### using watcher (plugin for live builds)
- as above, but instead of `npx hardhat compile` run `npx hardhat watch compilation` - great for finding issues
- can we auto deploy? read more here `https://hardhat.org/plugins/hardhat-watcher.html`

### Dev env
- requires > node 12x

### Notes
[internal] All contracts deployed using the ItheumCoreContracts account (0xf..2266)

## Known Cross-Chain Errors
- **Parachain deployment error**

When deploying to parachain (which is a substrate based EVM chain), the address used to deploy did not have any STATE tokens - so it failed. After putting in STATE tokens and then trying again, we got the following error:

```
{code: 1012, message: "Transaction is temporarily banned"}
```

[This issue](https://stackoverflow.com/a/57313346) menions something about a temp ban based enfored on a previous tx issue. Not sure if it was related to the failed no-gas tx.

Only way to fix this was to move to another fresh account with STATE ans try and worked fine.
