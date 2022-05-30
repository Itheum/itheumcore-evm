const { expect } = require("chai");

describe("ItheumDataNFT", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, addr3, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;

    DataDex = await ethers.getContractFactory("DataDex");
    dataDex = await DataDex.deploy(itheumTokenAddress);
    dataDexAddress = (await dataDex.deployed()).address;

    DataNFT = await ethers.getContractFactory("ItheumDataNFT");
    dataNFT = await DataNFT.deploy(dataDexAddress);
    dataNFTAddress = (await dataNFT.deployed()).address;
  });

  it("user (owner) should be able to mint", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    const mintedDataNFT = await dataNFT.dataNFTs(1);

    expect(mintedDataNFT.uri).to.be.equal('https://127.0.0.1');
    expect(mintedDataNFT.priceInItheum).to.be.equal(1000);
    expect(mintedDataNFT.royaltyInPercent).to.be.equal(10);
    expect(mintedDataNFT.creator).to.be.equal(owner.address);
    expect(mintedDataNFT.transferable).to.be.true;
    expect(mintedDataNFT.secondaryTradeable).to.be.false;

    expect(await dataNFT.getApproved(1)).to.be.equal(dataDexAddress);
  });

  it("user (owner) should be able to set transferable", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    expect(await dataNFT.getApproved(1)).to.be.equal(dataDexAddress);
    expect((await dataNFT.dataNFTs(1)).transferable).to.be.true;

    const setTransferableTx = await dataNFT.setDataNFTTransferable(1, false);
    await setTransferableTx.wait();

    expect(await dataNFT.getApproved(1)).to.be.equal('0x0000000000000000000000000000000000000000');
    expect((await dataNFT.dataNFTs(1)).transferable).to.be.false;

    const setTransferableTx1 = await dataNFT.setDataNFTTransferable(1, true);
    await setTransferableTx1.wait();

    expect(await dataNFT.getApproved(1)).to.be.equal(dataDexAddress);
    expect((await dataNFT.dataNFTs(1)).transferable).to.be.true;
  });

  it("user (owner) should be able to set secondary tradeable", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, true);
    await createDataNftTx.wait();

    expect((await dataNFT.dataNFTs(1)).secondaryTradeable).to.be.true;

    const setSecondaryTradeableTx = await dataNFT.setDataNFTSecondaryTradeable(1, false);
    await setSecondaryTradeableTx.wait();

    expect((await dataNFT.dataNFTs(1)).secondaryTradeable).to.be.false;

    const setSecondaryTradeableTx1 = await dataNFT.setDataNFTSecondaryTradeable(1, true);
    await setSecondaryTradeableTx1.wait();

    expect((await dataNFT.dataNFTs(1)).secondaryTradeable).to.be.true;
  });

  it("user (owner) should be able transfer to user (addr1)", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, true);
    await createDataNftTx.wait();

    expect(await dataNFT.ownerOf(1)).to.be.equal(owner.address);

    const transferFromTx = await dataNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1);
    await transferFromTx.wait();

    expect(await dataNFT.ownerOf(1)).to.be.equal(addr1.address);
  });

  it("should revert when dataNFT is not set to secondary tradeable", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    expect(await dataNFT.ownerOf(1)).to.be.equal(owner.address);

    await expect(dataNFT["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 1)).to.be.revertedWith("DataNFT is not set to secondary tradeable");
  });

  it("should revert when querying a non-existing dataNFT", async function () {
    await expect(dataNFT.dataNFTs(1)).to.be.revertedWith("DataNFT doesn't exist");
  });

  it("should revert when minting with a zero price", async function () {
    await expect(dataNFT.createDataNFT('https://127.0.0.1', 0, 10, false)).to.be.revertedWith("Price must be > 0");
  });

  it("should revert when more than 100 percent royalties are set", async function () {
    await expect(dataNFT.createDataNFT('https://127.0.0.1', 1000, 101, false)).to.be.revertedWith("Royalty must be <= 100");
  });

  it("should revert when setting a zero price", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    await expect(dataNFT.setDataNFTPrice(1, 0)).to.be.revertedWith("Price must be > 0");
  });

  it("should revert when not owner tries to set a price", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    await expect(dataNFT.connect(addr1).setDataNFTPrice(1, 1000)).to.be.revertedWith("Only owner can set the price");
  });

  it("should revert when not owner tries to set transferable", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    await expect(dataNFT.connect(addr1).setDataNFTTransferable(1, false)).to.be.revertedWith("Only owner can set transferable");
  });

  it("should revert when not creator tries to set secondary tradeable", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    await expect(dataNFT.connect(addr1).setDataNFTSecondaryTradeable(1, true)).to.be.revertedWith("Only creator can set secondary tradeable");
  });

  it("should revert when trying to load token uri of a non existing dataNFT", async function () {
    await expect(dataNFT.tokenURI(1)).to.be.revertedWith("ERC721URIStorage: URI query for nonexistent token");
  });
});