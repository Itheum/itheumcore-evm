const { expect } = require("chai");

describe("ItheumDataNFT", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;

    DataNFT = await ethers.getContractFactory("ItheumDataNFT");
    dataNFT = await DataNFT.deploy(itheumTokenAddress);
    dataNFTAddress = (await dataNFT.deployed()).address;
  });

  it("user (address owner) should be able to mint", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10);
    await createDataNftTx.wait();

    const mintedDataNFT = await dataNFT.dataNFTs(1);

    expect(mintedDataNFT.uri).to.be.equal('https://127.0.0.1');
    expect(mintedDataNFT.priceInItheum).to.be.equal(1000);
    expect(mintedDataNFT.royaltyInPercent).to.be.equal(10);
    expect(mintedDataNFT.creator).to.be.equal(owner.address);
    expect(mintedDataNFT.transferable).to.be.true;

    expect(await dataNFT.getApproved(1)).to.be.equal(dataNFTAddress);
  });

  it("user (addr1) should be able to buy from other user (addr2)", async function () {
    const createDataNftTx = await dataNFT.connect(addr2).createDataNFT('https://127.0.0.1', 1000, 10);
    await createDataNftTx.wait();

    expect(await dataNFT.ownerOf(1)).to.be.equal(addr2.address);

    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);

    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1100);
    faucetTx.wait();

    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(1100);

    const approveTx = await itheumToken.connect(addr1).approve(dataNFTAddress, 1100);
    await approveTx.wait();

    const buyTx = await dataNFT.connect(addr1).buyDataNFT(1);
    await buyTx.wait();

    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(1100);

    expect(await dataNFT.ownerOf(1)).to.be.equal(addr1.address);

    const mintedDataNFT = await dataNFT.dataNFTs(1);

    expect(mintedDataNFT.uri).to.be.equal('https://127.0.0.1');
    expect(mintedDataNFT.priceInItheum).to.be.equal(1000);
    expect(mintedDataNFT.royaltyInPercent).to.be.equal(10);
    expect(mintedDataNFT.creator).to.be.equal(addr2.address);
    expect(mintedDataNFT.transferable).to.be.false;
  });
});