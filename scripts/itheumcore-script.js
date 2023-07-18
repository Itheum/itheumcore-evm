// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const ItheumToken = await hre.ethers.getContractFactory("ItheumToken");
  const itheumToken = await ItheumToken.deploy();

  await itheumToken.deployed();

  console.log("ItheumToken deployed to:", itheumToken.address);

  const DataDEX = await hre.ethers.getContractFactory("DataDexV01"); // change to DataDexV01 for older version 
  const dataDEX = await DataDEX.deploy(itheumToken.address);

  await dataDEX.deployed();

  console.log("DataDEX deployed to:", dataDEX.address);

  const DataNFTToken = await hre.ethers.getContractFactory("DATANFTFT1"); // change to DATANFTFT1 for older version 
  const dataNFTToken = await DataNFTToken.deploy();

  await dataNFTToken.deployed();

  console.log("DataNFT Token deployed to:", dataNFTToken.address);

  const Claims = await hre.ethers.getContractFactory("Claims");
  const claims = await hre.upgrades.deployProxy(Claims, [itheumToken.address], {
    initializer: 'initialize',
  });

  await claims.deployed();

  console.log("Claims deployed to:", claims.address);

  console.log(`
  export const itheumTokenContractAddress = '${itheumToken.address}';
  export const ddexContractAddress = '${dataDEX.address}';
  export const dNFTContractAddress = '${dataNFTToken.address}';
  export const claimsContractAddress = '${claims.address}';
  `)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
