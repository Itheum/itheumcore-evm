const { expect } = require("chai");

describe("ItheumDataNFT", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, addr3, _remaining] = await ethers.getSigners();

    ItheumToken = await ethers.getContractFactory("ItheumToken");
    itheumToken = await ItheumToken.deploy();
    itheumTokenAddress = (await itheumToken.deployed()).address;

    DataNFT = await ethers.getContractFactory("ItheumDataNFT");
    dataNFT = await DataNFT.deploy(itheumTokenAddress);
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

    expect(await dataNFT.getApproved(1)).to.be.equal(dataNFTAddress);
  });

  it("user (owner) should be able to set transferable", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    expect(await dataNFT.getApproved(1)).to.be.equal(dataNFTAddress);
    expect((await dataNFT.dataNFTs(1)).transferable).to.be.true;

    const setTransferableTx = await dataNFT.setDataNFTTransferable(1, false);
    await setTransferableTx.wait();

    expect(await dataNFT.getApproved(1)).to.be.equal('0x0000000000000000000000000000000000000000');
    expect((await dataNFT.dataNFTs(1)).transferable).to.be.false;

    const setTransferableTx1 = await dataNFT.setDataNFTTransferable(1, true);
    await setTransferableTx1.wait();

    expect(await dataNFT.getApproved(1)).to.be.equal(dataNFTAddress);
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

  it("user (addr1) should be able to buy from other user (addr2)", async function () {
    // addr2 mints and is therefore owner
    const createDataNftTx = await dataNFT.connect(addr2).createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    expect(await dataNFT.ownerOf(1)).to.be.equal(addr2.address);

    // no addr has $ITHEUM
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);

    // addr1 claims $ITHEUM
    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1100);
    faucetTx.wait();

    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(1100);

    // addr1 approves dataNFT contract to transfer funds on his behalf
    const approveTx = await itheumToken.connect(addr1).approve(dataNFTAddress, 1100);
    await approveTx.wait();

    // addr1 buys from addr2
    const buyTx = await dataNFT.connect(addr1).buyDataNFT(addr2.address, addr1.address, 1, 0);
    await buyTx.wait();

    // addr2 has now $ITHEUM, addr1 not anymore
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(1100);

    // addr1 is now owner
    expect(await dataNFT.ownerOf(1)).to.be.equal(addr1.address);

    // details in dataNFT hasn't changed, except transferable is now false
    const mintedDataNFT = await dataNFT.dataNFTs(1);

    expect(mintedDataNFT.uri).to.be.equal('https://127.0.0.1');
    expect(mintedDataNFT.priceInItheum).to.be.equal(1000);
    expect(mintedDataNFT.royaltyInPercent).to.be.equal(10);
    expect(mintedDataNFT.creator).to.be.equal(addr2.address);
    expect(mintedDataNFT.transferable).to.be.false;
    expect(mintedDataNFT.secondaryTradeable).to.be.false;

    expect(await dataNFT.getApproved(1)).to.be.equal('0x0000000000000000000000000000000000000000');
  });

  it("user (addr3) should be able to buy from other user (addr1), after this user has bought from other user (addr2)", async function () {
    // addr2 mints and is therefore owner
    const createDataNftTx = await dataNFT.connect(addr2).createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    expect(await dataNFT.ownerOf(1)).to.be.equal(addr2.address);

    // no addr has $ITHEUM
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(0);

    // addr1 claims $ITHEUM
    const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1100);
    faucetTx.wait();

    // addr1 approves dataNFT contract to transfer funds on his behalf
    const approveTx = await itheumToken.connect(addr1).approve(dataNFTAddress, 1100);
    await approveTx.wait();

    // addr1 buys from addr2
    const buyTx = await dataNFT.connect(addr1).buyDataNFT(addr2.address, addr1.address, 1, 0);
    await buyTx.wait();

    // addr2 has now $ITHEUM, addr1 not anymore
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(1100);
    expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(0);

    // addr1 is now owner
    expect(await dataNFT.ownerOf(1)).to.be.equal(addr1.address);

    // addr1 sets new price and transferable
    const setPriceTx = await dataNFT.connect(addr1).setDataNFTPrice(1, 2000);
    await setPriceTx.wait();

    const setTransferableTx = await dataNFT.connect(addr1).setDataNFTTransferable(1, true);
    await setTransferableTx.wait();

    // addr3 claims $ITHEUM
    const faucetTx2 = await itheumToken.connect(addr3).faucet(addr3.address, 2200);
    faucetTx2.wait();

    expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(2200);

    // addr1 approves dataNFT contract to transfer funds on his behalf
    const approveTx2 = await itheumToken.connect(addr3).approve(dataNFTAddress, 2200);
    await approveTx2.wait();

    // addr3 buys from addr1
    const buyTx1 = await dataNFT.connect(addr3).buyDataNFT(addr1.address, addr3.address, 1, 0);
    await buyTx1.wait();

    // addr2 has now $ITHEUM, addr1 not anymore
    expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(2000);
    expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(1300);
    expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(0);

    // addr3 is now owner
    expect(await dataNFT.ownerOf(1)).to.be.equal(addr3.address);

    // details in dataNFT hasn't changed, except transferable and price
    const mintedDataNFT = await dataNFT.dataNFTs(1);

    expect(mintedDataNFT.uri).to.be.equal('https://127.0.0.1');
    expect(mintedDataNFT.priceInItheum).to.be.equal(2000);
    expect(mintedDataNFT.royaltyInPercent).to.be.equal(10);
    expect(mintedDataNFT.creator).to.be.equal(addr2.address);
    expect(mintedDataNFT.transferable).to.be.false;
    expect(mintedDataNFT.secondaryTradeable).to.be.false;
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

  it("should revert when minting with a zero price", async function () {
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

  it("should revert when trying to buy a non existing dataNFT", async function () {
    await expect(dataNFT.buyDataNFT(addr1.address, addr2.address, 1, 0)).to.be.revertedWith("DataNFT doesn't exist");
  });

  it("should revert when trying to buy dataNFT which is not transferable", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    const setTransferableTx = await dataNFT.setDataNFTTransferable(1, false);
    await setTransferableTx.wait();

    await expect(dataNFT.connect(addr1).buyDataNFT(owner.address, addr1.address, 1, 0)).to.be.revertedWith("DataNFT is currently not transferable");
  });

  it("should revert when allowance is set", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    await expect(dataNFT.connect(addr1).buyDataNFT(owner.address, addr1.address, 1, 0)).to.be.revertedWith("Allowance in ITHEUM contract is too low");
  });

  it("should revert when trying to load token uri of a non existing dataNFT", async function () {
    await expect(dataNFT.tokenURI(1)).to.be.revertedWith("ERC721URIStorage: URI query for nonexistent token");
  });

  it("should revert when from address is not the owner of the provided token id", async function () {
    const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
    await createDataNftTx.wait();

    await expect(dataNFT.connect(addr1).buyDataNFT(addr2.address, addr1.address, 1, 0)).to.be.revertedWith("'from' and 'ownerOf(tokenId)' doesn't match");
  });
});