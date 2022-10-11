require('dotenv').config();

require("@nomiclabs/hardhat-waffle");
require("hardhat-watcher");
require('@openzeppelin/hardhat-upgrades');


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  watcher: {
    compilation: {
      tasks: ["compile"],
    },
    test: {
      tasks: ["test"],
      files: ["./test"],
      verbose: true,
    },
    tdd: {
      tasks: ["clean", { 
        command: "compile", 
        params: { quiet: true } 
      }, "test" ],
    }
  },
  solidity: "0.8.4",
  networks: {
    eth_goerli_testnet: {
      url: process.env.ETH_GOERLI_TESTNET_URL ?? "",
      chainId: 5,
      gasPrice: 05000000000,
      accounts: process.env.ETH_GOERLI_TESTNET_KEY ? [`0x${process.env.ETH_GOERLI_TESTNET_KEY}`] : [],
    },
    eth_rop_testnet: {
      url: process.env.ETH_ROP_TESTNET_URL ?? "",
      chainId: 3,
      gasPrice: 20000000000,
      accounts: process.env.ETH_ROP_TESTNET_KEY ? [`0x${process.env.ETH_ROP_TESTNET_KEY}`] : [],
    },
    eth_rin_testnet: {
      url: process.env.ETH_RIN_TESTNET_URL ?? "",
      chainId: 4,
      gasPrice: 20000000000,
      accounts: process.env.ETH_RIN_TESTNET_KEY ? [`0x${process.env.ETH_RIN_TESTNET_KEY}`] : [],
    },
    pol_mum_testnet: {
      url: process.env.POLYGON_MUM_TESTNET_URL ?? "",
      chainId: 80001,
      gasPrice: 20000000000,
      accounts: process.env.POLYGON_MUM_TESTNET_KEY ? [`0x${process.env.POLYGON_MUM_TESTNET_KEY}`] : [],
    },
    bsc_testnet: {
      url: process.env.BSC_TESTNET_URL ?? "",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: process.env.BSC_TESTNET_KEY ? [`0x${process.env.BSC_TESTNET_KEY}`] : [],
    },
    harmony_testnet: {
      url: process.env.HARMONY_TESTNET_URL ?? "",
      chainId: 1666700000,
      gasPrice: 20000000000,
      accounts: process.env.HARMONY_TESTNET_KEY ? [`0x${process.env.HARMONY_TESTNET_KEY}`] : [],
    },
    platon_testnet: {
      url: process.env.PLATON_TESTNET_URL ?? "",
      chainId: 210309,
      gasPrice: 20000000000,
      accounts: process.env.PLATON_TESTNET_KEY ? [`0x${process.env.PLATON_TESTNET_KEY}`] : [],
    },
    parastate_testnet: {
      url: process.env.PARASTATE_TESTNET_URL ?? "",
      chainId: 123,
      gasPrice: 20000000000,
      accounts: process.env.PARASTATE_TESTNET_KEY ? [`0x${process.env.PARASTATE_TESTNET_KEY}`] : [],
    },
    avalanche_testnet: {
      url: process.env.AVALANCHE_TESTNET_URL ?? "",
      chainId: 43113,
      gasPrice: 25000000000,
      accounts: process.env.AVALANCHE_TESTNET_KEY ? [`0x${process.env.AVALANCHE_TESTNET_KEY}`] : [],
    },
  }
};
