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

  it("user (addr1) should be able to buy an advertised data pack from another user (addr2)", async function () {
    const setItheumTreasuryAddressTx = await dataDex.setItheumTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setItheumTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataDex.connect(addr2).advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    // no addr has $ITHEUM
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);

    // addr1 claims $ITHEUM
    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1020);
    faucetTx.wait();

    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(1020);

    // addr1 approves dataDex contract to transfer funds on his behalf
    const approveTx = await itheumToken.connect(addr1).approve(dataDexAddress, 1020);
    await approveTx.wait();

    expect(await dataDex.connect(addr1).checkAccess('123abc')).to.be.false;

    const buyDataPackTx = await dataDex.connect(addr1).buyDataPack('123abc');
    await buyDataPackTx.wait();

    expect(await dataDex.connect(addr1).checkAccess('123abc')).to.be.true;

    // addr2 has now $ITHEUM, addr1 not anymore
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(980);
    expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(40);
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

  it("should revert when Itheum treasury isn't set", async function () {
    await expect(dataDex.buyDataPack('123abc')).to.revertedWith('Itheum treasury address isn\'t set');
  });

  it("should revert when user tries to buy a non-existing data pack", async function () {
    const setItheumTreasuryAddressTx = await dataDex.setItheumTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setItheumTreasuryAddressTx.wait();

    await expect(dataDex.buyDataPack('123abc')).to.revertedWith('You can\'t buy a non-existing data pack');
  });
});