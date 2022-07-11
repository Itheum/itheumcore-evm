# Itheum Core EVM
The core Itheum multi-chain EVM technology repository; it has smart contracts, chain dev kits, unit tests etc.

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
- Compile all contracts in folder via `npx hardhat compile`
- deploy via `npx hardhat run scripts/itheumcore-script.js --network localhost`

### Deploying into testnet
- Compile all contracts in folder via `npx hardhat compile`
- deploy via `npx hardhat run scripts/itheumcore-script.js --network {testnet_code}`
- The following `{testnet_code}`s are supported: `eth_rop_testnet`, `eth_rin_testnet` (not used yet) `pol_mum_testnet` `avalanche_testnet` `bsc_testnet` `harmony_testnet` `platon_testnet`, `parastate_testnet`

### Local environemnt dev requirements
- If you are `Deploying into testnet` , it needs some ENV vars. You need to create a `.env` file and add the ENV vars are used in the `hardhat.config.js` file.
- Each chain's private key will be in `[XXX]_TESTNET_KEY`, it's best practice to use a single dev usage wallet across chains. So create a `dedicated wallet` then use it across all chains (ask the core devs if there us a shared testnet wallet you can use).
- Before you deploy your contracts into a chain, you need to make sure that the wallet used has funds in it for gas costs. In testnets, you can use the chain faucets to feed that wallet.

### using watcher (plugin for live builds)
- as above, but instead of `npx hardhat compile` run `npx hardhat watch compilation` - great for finding issues
- can we auto deploy? read more here `https://hardhat.org/plugins/hardhat-watcher.html`

### Dev env
- requires > node 16.x
- Prior to running the local dev commands like `npx hardhat watch test` you need local env vars. Copy the `.env-template` file and rename to `.env` and update with your keys that will be used for deploying the contracts.

### EVM Cross-Chain Deployments
Contract | ETH TESTNET ROPSTEN | ETH TESTNET RINKY | POLYGON TESTNET MUNBAI | AVALANCHE TESTNET | BSC TESTNET | HARMONY TESTNET | PLATON TESTNET | PARASTATE TESTNET |
--- | --- | --- | --- |--- |--- |--- |--- |---
TOKEN | 0xBDdb6B94d9B60Ac1D788676a287e8c474D68D44A | 0xb38731CEC66340ff1c9F58B8ceCDEdb9B4Cb8f38 (v0.1.0) | 0x91ff16CDfeF176b1576E640422C5BA281A242400 | 0x2982563dAf8Eeb43Cec78bf4E1A8614BD56CD1e3 (v0.1.0) | 0x91ff16CDfeF176b1576E640422C5BA281A242400 | 0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc (v0.1.0) | 0x5FbDB2315678afecb367f032d93F642f64180aa3 (v0.1.0) | 0xD77E137B6483bC8d392b73D02E733e3DE13Dd72d (v0.1.0)
DATA DEX | 0xD01A4bCeD9324034db6cb03E50b76F58496F5FB8 | 0xaC0Dee3dd39e27470A8992aC9C94B09385C2f2A5 (v0.1.0) | 0xBDdb6B94d9B60Ac1D788676a287e8c474D68D44A | 0x56c88e7ed9Aa4792119c66D71815A6bD9DE0A5E0 (v0.1.0) | 0xBDdb6B94d9B60Ac1D788676a287e8c474D68D44A | 0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f (v0.1.0) | 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 (v0.1.0) | 0x1bd7fa41A509d016053eb6C67165d632321a20A9 (v0.1.0)
DATA NFT | 0xBDdb6B94d9B60Ac1D788676a287e8c474D68D44A | 0xD77E137B6483bC8d392b73D02E733e3DE13Dd72d (v0.1.0) | 0xD01A4bCeD9324034db6cb03E50b76F58496F5FB8 | 0xCb0254502D84242f8ad477eb41723e99fdC6e847 (v0.1.0) | 0xD01A4bCeD9324034db6cb03E50b76F58496F5FB8 | 0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07 (v0.1.0) | 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 (v0.1.0) | 0x360570F7D60Df8BC670C2899002C44a2C382270E (v0.1.0)
CLAIM PORTAL | 0x159ea49EbF5DCd06efFce53b1fe851e9c2CCFd91 | X | 0x985A5c96663C9c44d46Ea061f4b7E50118180F8d | 0xb38731CEC66340ff1c9F58B8ceCDEdb9B4Cb8f38 | 0x985A5c96663C9c44d46Ea061f4b7E50118180F8d | X | X | X


## Known Cross-Chain Errors
- **Parachain deployment error**

When deploying to Parastate (which is a substrate based EVM chain), the address used to deploy did not have any STATE tokens - so it failed. After putting in STATE tokens and then trying again, we got the following error:

```
{code: 1012, message: "Transaction is temporarily banned"}
```

[This issue](https://stackoverflow.com/a/57313346) menions something about a temp ban based enfored on a previous tx issue. Not sure if it was related to the failed no-gas tx.

Only way to fix this was to move to another fresh account with STATE ans try and worked fine.

- **Avalanche deployment error**

We got an error trying to deply to the Avalanche C-Chain and this was because it had a min gas price requirement of 25000000000. This setting was updated in the hardhat config and after this it was good.
