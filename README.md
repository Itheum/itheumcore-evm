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
- The following `{testnet_code}`s are supported: `bsc_testnet` `harmony_testnet`

### using watcher (plugin for live builds)
- as above, but instead of `npx hardhat compile` run `npx hardhat watch compilation` - great for finding issues
- can we auto deploy? read more here `https://hardhat.org/plugins/hardhat-watcher.html`

### Dev env
- requires > node 10x

### Notes
