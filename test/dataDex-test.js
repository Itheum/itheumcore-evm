const { expect } = require("chai");

describe("DataDex", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;

    DataDex = await ethers.getContractFactory("ItheumDataDex");
    dataDex = await DataDex.deploy(itheumTokenAddress);
    dataDexAddress = (await dataDex.deployed()).address;
  });

  it("owner should be able to set the ITHEUM treasury address", async function () {
    expect(await dataDex.itheumTreasury()).to.be.equal('0x0000000000000000000000000000000000000000');

    const setItheumTreasuryAddressTx = await dataDex.setItheumTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setItheumTreasuryAddressTx.wait();

    expect(await dataDex.itheumTreasury()).to.be.equal('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
  });

  it("user should be able to advertise data pack for sale", async function () {
    expect((await dataDex.dataPacks('123abc')).seller).to.be.equal('0x0000000000000000000000000000000000000000');
    expect((await dataDex.personalDataProofs(owner.address, '123abc'))).to.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');

    const advertiseForSaleTx = await dataDex.advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect((await dataDex.dataPacks('123abc')).seller).to.be.equal(owner.address);
    expect((await dataDex.personalDataProofs(owner.address, '123abc'))).to.be.equal('0x64656d6f48617368537472000000000000000000000000000000000000000000');

  });

  it("should revert when not owner tries to set the ITHEUM treasury address", async function () {
    await expect(dataDex.connect(addr1).setItheumTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.revertedWith('Ownable: caller is not the owner');
  });

  it("should revert when data pack id already exists", async function () {
    const advertiseForSaleTx = await dataDex.advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    await expect(dataDex.advertiseForSale('123abc', 'demoHashStr', 1000)).to.revertedWith('Data pack with this id already exists');
  });

  it("should revert when data hash string is empty", async function () {
    await expect(dataDex.advertiseForSale('123abc', '', 1000)).to.revertedWith('Data hash string must exist');
  });

  it("should revert when price of zero ITHEUM token is set", async function () {
    await expect(dataDex.advertiseForSale('123abc', 'demoHashStr', 0)).to.revertedWith('Price in ITHEUM must be greater than zero');
  });
});