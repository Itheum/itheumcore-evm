require("@nomiclabs/hardhat-waffle");
require("hardhat-watcher");

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
      }, { 
        command: "test", 
        params: { noCompile: true, files: ["./test"] } } ],
    }
  },
  solidity: "0.8.4"
};
