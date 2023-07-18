const { expect } = require("chai");

describe('ItheumTokenMultiChainGeneric', async () => {
  beforeEach(async() => {
    [owner, addr1, addr2, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumTokenMultiChainGeneric");
    itheumToken = await ItheumToken.deploy("Itheum Protocol Polygon Token", "mITHEUM");
    itheumTokenAddress = (await itheumToken.deployed()).address;
  });

  it("owner should be able to set the dataNFT treasury address", async function () {
    expect(await itheumToken.dataNFTFeeTreasury()).to.be.equal('0x0000000000000000000000000000000000000000');

    const setDataNFTFeeTreasuryAddressTx = await itheumToken.setDataNFTFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataNFTFeeTreasuryAddressTx.wait();

    expect(await itheumToken.dataNFTFeeTreasury()).to.be.equal('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
  });

  it("should revert when not owner tries to set the dataNFT treasury address", async function () {
    await expect(itheumToken.connect(addr1).setDataNFTFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.revertedWith('Ownable: caller is not the owner');
  });
});