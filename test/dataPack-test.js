const { expect } = require("chai");

describe("DataPack", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;

    DataPack = await ethers.getContractFactory("ItheumDataPack");
    dataPack = await DataPack.deploy(itheumTokenAddress);
    dataPackAddress = (await dataPack.deployed()).address;
  });

  it("user should be able to advertise data pack for sale", async function () {
    expect((await dataPack.dataPacks('123abc')).seller).to.be.equal('0x0000000000000000000000000000000000000000');
    expect((await dataPack.personalDataProofs(owner.address, '123abc'))).to.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');

    expect(await dataPack.accessAllocationCount('123abc')).to.be.equal(0);

    const advertiseForSaleTx = await dataPack.advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect((await dataPack.dataPacks('123abc')).seller).to.be.equal(owner.address);
    expect((await dataPack.personalDataProofs(owner.address, '123abc'))).to.be.equal('0x64656d6f48617368537472000000000000000000000000000000000000000000');

    expect(await dataPack.accessAllocationCount('123abc')).to.be.equal(0);
  });

  it("user (addr1) should be able to buy an advertised data pack from another user (addr2)", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataPack.connect(addr2).advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect(await dataPack.accessAllocationCount('123abc')).to.be.equal(0);

    // no addr has $ITHEUM
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);

    // addr1 claims $ITHEUM
    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1020);
    faucetTx.wait();

    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(1020);

    // addr1 approves dataPack contract to transfer funds on his behalf
    const approveTx = await itheumToken.connect(addr1).approve(dataPackAddress, 1020);
    await approveTx.wait();

    expect(await dataPack.connect(addr1).checkAccess('123abc')).to.be.false;

    const buyDataPackTx = await dataPack.connect(addr1).buyDataPack('123abc');
    await buyDataPackTx.wait();

    expect(await dataPack.connect(addr1).checkAccess('123abc')).to.be.true;

    expect(await dataPack.accessAllocationCount('123abc')).to.be.equal(1);

    // addr2 has now $ITHEUM, addr1 not anymore
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(980);
    expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(40);
  });

  it("user (addr1) should not be able to buy an advertised data pack from another user (addr2) when he has too less ITHEUM", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataPack.connect(addr2).advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    // no addr has $ITHEUM
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);

    // addr1 claims $ITHEUM
    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1000);
    faucetTx.wait();

    await expect(dataPack.connect(addr1).buyDataPack('123abc')).to.be.be.revertedWith("You dont have sufficient ITHEUM to proceed");
  });

  it("user (addr2) should be able remove personal data proof", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataPack.connect(addr2).advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect(await dataPack.personalDataProofs(addr2.address, '123abc')).to.be.equal('0x64656d6f48617368537472000000000000000000000000000000000000000000');

    const removePersonalDataProofTx = await dataPack.connect(addr2).removePersonalDataProof('123abc');
    await removePersonalDataProofTx.wait();

    expect(await dataPack.personalDataProofs(addr2.address, '123abc')).to.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
  });

  it("user (addr1) should not be able remove personal data proof", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataPack.connect(addr2).advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect(await dataPack.personalDataProofs(addr2.address, '123abc')).to.be.equal('0x64656d6f48617368537472000000000000000000000000000000000000000000');

    const removePersonalDataProofTx = await dataPack.connect(addr1).removePersonalDataProof('123abc');
    await removePersonalDataProofTx.wait();

    expect(await dataPack.personalDataProofs(addr2.address, '123abc')).to.be.equal('0x64656d6f48617368537472000000000000000000000000000000000000000000');
  });

  it("user (addr1) should not be able to buy an advertised data pack from another user (addr2) when to less approved for dataPack contract", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataPack.connect(addr2).advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    // addr1 claims $ITHEUM
    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1020);
    faucetTx.wait();

    // addr1 approves dataPack contract to transfer funds on his behalf
    const approveTx = await itheumToken.connect(addr1).approve(dataPackAddress, 1000);
    await approveTx.wait();

    await expect(dataPack.connect(addr1).buyDataPack('123abc')).to.be.revertedWith("Check the token allowance");
  });

  it("should verify data hash correctly", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataPack.connect(addr2).advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect(await dataPack.verifyData('123abc', 'demoHashStr')).to.be.true;
    expect(await dataPack.verifyData('123abc', 'otherHashStr')).to.be.false;
  });

  it("should revert when data pack id already exists", async function () {
    const advertiseForSaleTx = await dataPack.advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    await expect(dataPack.advertiseForSale('123abc', 'demoHashStr', 1000)).to.be.revertedWith('Data pack with this id already exists');
  });

  it("should revert when data hash string is empty", async function () {
    await expect(dataPack.advertiseForSale('123abc', '', 1000)).to.be.revertedWith('Data hash string must exist');
  });

  it("should revert when price of zero ITHEUM token is set", async function () {
    await expect(dataPack.advertiseForSale('123abc', 'demoHashStr', 0)).to.be.revertedWith('Price in ITHEUM must be greater than zero');
  });

  it("should revert when Itheum treasury isn't set", async function () {
    await expect(dataPack.buyDataPack('123abc')).to.be.revertedWith('Itheum treasury address isn\'t set');
  });

  it("should revert when user tries to buy a non-existing data pack", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    await expect(dataPack.buyDataPack('123abc')).to.be.revertedWith('You can\'t buy a non-existing data pack');
  });

  it("user should be able to delete data pack", async function () {
    const advertiseForSaleTx = await dataPack.advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect((await dataPack.dataPacks('123abc')).seller).to.be.equal(owner.address);

    const deleteDataPackTx = await dataPack.deleteDataPack('123abc');
    await deleteDataPackTx.wait();

    expect((await dataPack.dataPacks('123abc')).seller).to.be.equal('0x0000000000000000000000000000000000000000');
  });

  it("user (addr1) should not be able to delete data pack", async function () {
    const advertiseForSaleTx = await dataPack.advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    expect((await dataPack.dataPacks('123abc')).seller).to.be.equal(owner.address);

    await expect(dataPack.connect(addr1).deleteDataPack('123abc')).to.be.revertedWith('Only seller can delete dataPack');
  });

  it("user should be able to delete data pack once it is sold", async function () {
    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    const advertiseForSaleTx = await dataPack.advertiseForSale('123abc', 'demoHashStr', 1000);
    await advertiseForSaleTx.wait();

    // addr1 claims $ITHEUM
    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1020);
    faucetTx.wait();

    // addr1 approves dataPack contract to transfer funds on his behalf
    const approveTx = await itheumToken.connect(addr1).approve(dataPackAddress, 1020);
    await approveTx.wait();

    const buyDataPackTx = await dataPack.connect(addr1).buyDataPack('123abc');
    await buyDataPackTx.wait();

    await expect(dataPack.deleteDataPack('123abc')).to.be.revertedWith('You only can delete dataPacks with zero access');
  });
});