const { expect } = require("chai");

describe("DataDex", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;

    DataDex = await ethers.getContractFactory("DataDex");
    dataDex = await DataDex.deploy(itheumTokenAddress);
    dataDexAddress = (await dataDex.deployed()).address;
  });

  it("should be initialized correctly", async function () {
    expect(await dataDex.itheumToken()).to.be.equal(itheumTokenAddress);
  });
});