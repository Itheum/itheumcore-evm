# Itheum Core
The core itheum technology repo. Holds smart contracts, chain dev kits etc. More info coming soon...

## using lerna
The repo uses lerna for better management of sub/mono repos. Here is how you use it.

## using hardhat
Contracts dev is via hardhat. Here is how you use it.

- npx hardhat accounts
Gives you your accounts

- npx hardhat compile
Compiles all contracts in folder


### DEPLOYING
- Working on local chain, in a seperate terminal run `npx hardhat node`
- deploy via `npx hardhat run scripts/itheumcore-script.js --network localhost`




## env
- requires > node 10x