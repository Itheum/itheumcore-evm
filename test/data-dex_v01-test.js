const { expect } = require("chai");

describe("DataDexV01", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, addr3, _remaining] = await ethers.getSigners();
    
    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;

    DataDEX = await ethers.getContractFactory("DataDexV01");
    dataDEX = await DataDEX.deploy(itheumTokenAddress);
    dataDEXAddress = (await dataDEX.deployed()).address;
  });

  it("should be able to advertise data for sale", async function () {
    const advertiseTx = await dataDEX.advertiseForSale('101', 'asdasdasdhash');
    await advertiseTx.wait();

    const advertisedPack = await dataDEX.dataPacks('101');

    expect(advertisedPack.seller).to.be.equal(owner.address);
  });  
});