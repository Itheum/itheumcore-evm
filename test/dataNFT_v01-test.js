const { expect } = require("chai");

describe("DataNFTV01", async function () {
  beforeEach(async() => {
    DataNFT = await ethers.getContractFactory("DataNFTV01");
    dataNFT = await DataNFT.deploy();
    dataNFTAddress = (await dataNFT.deployed()).address;
  });

  it("contract should be deployable and owner should be able to mint", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1/metadata');
    await createDataNftTx.wait();

    const mintedDataNFT = await dataNFT.dataNFTs(1);

    expect(mintedDataNFT.uri).to.be.equal('https://127.0.0.1/metadata');
  });  
});