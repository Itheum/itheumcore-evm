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

  //// DEPLOYED for Astar + Matic
  // console.log('process.env.ASTAR_SHIBUYA_TESTNET_URL');
  // console.log(process.env.ASTAR_SHIBUYA_TESTNET_URL);

  // const ItheumToken = await hre.ethers.getContractFactory("ItheumTokenMultiChainGeneric");
  // const itheumToken = await ItheumToken.deploy("Itheum Protocol Astar Network Token", "aITHEUM");

  // await itheumToken.deployed();

  // console.log("ItheumToken deployed to:", itheumToken.address);



  // const DataDexReleaseV2 = await hre.ethers.getContractFactory("DataDexReleaseV2");
  // const dataDEX = await DataDexReleaseV2.deploy(itheumToken.address);

  // await dataDEX.deployed();
  

  const DataDexReleaseV2 = await hre.ethers.getContractFactory("DataDexReleaseV2");
  const dataDEX = await hre.upgrades.deployProxy(DataDexReleaseV2, ['0x91ff16CDfeF176b1576E640422C5BA281A242400'], {
    initializer: "initialize",
  });
  dataDexAddress = (await dataDEX.deployed()).address;

  console.log("DataDEX deployed to:", dataDexAddress);




  // const DataNFTReleaseV2 = await hre.ethers.getContractFactory("DataNFTReleaseV2");
  // const dataNFTToken = await DataNFTReleaseV2.deploy();

  // await dataNFTToken.deployed();

  // console.log("DataNFT Token deployed to:", dataNFTToken.address);


  const DataNFTReleaseV2 = await hre.ethers.getContractFactory("DataNFTReleaseV2");
  const dataNFTToken = await hre.upgrades.deployProxy(DataNFTReleaseV2, [dataDexAddress, "Itheum Data NFT-FT V1", "DATANFTFT1"], {
    initializer: "initialize",
  });
  dataNFTAddress = (await dataNFTToken.deployed()).address;

  console.log("DataNFT token deployed to:", dataNFTAddress);



  //// NOT NEEDED for Astar + Matic
  // const Claims = await hre.ethers.getContractFactory("Claims");
  // const claims = await hre.upgrades.deployProxy(Claims, [itheumToken.address], {
  //   initializer: 'initialize',
  // });

  // await claims.deployed();

  // console.log("Claims deployed to:", claims.address);

  // console.log(`
  // export const itheumTokenContractAddress = '${itheumToken.address}';
  // export const ddexContractAddress = '${dataDEX.address}';
  // export const dNFTContractAddress = '${dataNFTToken.address}';
  // export const claimsContractAddress = '${claims.address}';
  // `)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
