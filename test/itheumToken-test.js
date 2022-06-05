const { expect } = require("chai");

describe('ItheumToken', async () => {
  beforeEach(async() => {
    [owner, addr1, addr2, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;
  });

  it("owner should be able to set the dataPack treasury address", async function () {
    expect(await itheumToken.dataPackFeeTreasury()).to.be.equal('0x0000000000000000000000000000000000000000');

    const setDataPackFeeTreasuryAddressTx = await itheumToken.setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataPackFeeTreasuryAddressTx.wait();

    expect(await itheumToken.dataPackFeeTreasury()).to.be.equal('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
  });

  it("should revert when not owner tries to set the dataPack treasury address", async function () {
    await expect(itheumToken.connect(addr1).setDataPackFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.revertedWith('Ownable: caller is not the owner');
  });
});