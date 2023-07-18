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

  // 1) Token deployment
  const ItheumToken = await hre.ethers.getContractFactory(
    "ItheumTokenMultiChainGeneric"
  );
  const itheumToken = await ItheumToken.deploy(
    "Itheum Protocol Astar Network Token",
    "aITHEUM"
  );

  await itheumToken.deployed();

  console.log("ItheumToken deployed to:", itheumToken.address);

  /*
  // 2) Data Dex deployment (legacy for reference)
  const DataDexReleaseV2 = await hre.ethers.getContractFactory("DataDexReleaseV2");
  const dataDEX = await DataDexReleaseV2.deploy(itheumToken.address);

  await dataDEX.deployed();
  */

  // 2) Data Dex deployment
  const DataDexReleaseV2 = await hre.ethers.getContractFactory(
    "DataDexReleaseV2"
  );
  const dataDEX = await hre.upgrades.deployProxy(
    DataDexReleaseV2,
    [itheumToken.address],
    {
      initializer: "initialize",
    }
  );
  // const dataDEX = await hre.upgrades.deployProxy(DataDexReleaseV2, ['0x91ff16CDfeF176b1576E640422C5BA281A242400'], {
  //   initializer: "initialize",
  // });
  dataDexAddress = (await dataDEX.deployed()).address;

  console.log("DataDEX deployed to:", dataDexAddress);

  /*
  // 3) Data NFT deployment (legacy for reference)
  const DataNFTReleaseV2 = await hre.ethers.getContractFactory("DataNFTReleaseV2");
  const dataNFTToken = await DataNFTReleaseV2.deploy();

  await dataNFTToken.deployed();

  console.log("DataNFT Token deployed to:", dataNFTToken.address);
  */

  // 3) Data NFT deployment
  const DataNFTReleaseV2 = await hre.ethers.getContractFactory(
    "DataNFTReleaseV2"
  );
  const dataNFTToken = await hre.upgrades.deployProxy(
    DataNFTReleaseV2,
    [dataDexAddress, "Itheum Data NFT-FT V1", "DATANFTFT1"],
    {
      initializer: "initialize",
    }
  );
  dataNFTAddress = (await dataNFTToken.deployed()).address;

  console.log("DataNFT token deployed to:", dataNFTAddress);

  // 4) Claims Portal: DID NOT TEST THIS FOR ASTAR NETWORK (if it fails, then comment it out and fix any issues with ClaimsReleaseV2)
  const ClaimsReleaseV2 = await hre.ethers.getContractFactory(
    "ClaimsReleaseV2"
  );
  const claims = await hre.upgrades.deployProxy(
    ClaimsReleaseV2,
    [itheumToken.address],
    {
      initializer: "initialize",
    }
  );

  await claims.deployed();

  console.log("Claims deployed to:", claims.address);

  console.log(`
  export const itheumTokenContractAddress = '${itheumToken.address}';
  export const ddexContractAddress = '${dataDEX.address}';
  export const dNFTContractAddress = '${dataNFTToken.address}';
  export const claimsContractAddress = '${claims.address}';
  `);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
