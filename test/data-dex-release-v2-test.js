const { expect } = require("chai");

describe("DataDexReleaseV2", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, addr3, _remaining] = await ethers.getSigners();

    ItheumTokenMultiChainGeneric = await ethers.getContractFactory("ItheumTokenMultiChainGeneric");
    itheumToken = await ItheumTokenMultiChainGeneric.deploy("Itheum Protocol Polygon Token", "mITHEUM");
    itheumTokenAddress = (await itheumToken.deployed()).address;

    const setDataNFTFeeTreasuryAddressTx = await itheumToken.setDataNFTFeeTreasury('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    await setDataNFTFeeTreasuryAddressTx.wait();

    DataDexReleaseV2 = await ethers.getContractFactory("DataDexReleaseV2");
    dataDex = await upgrades.deployProxy(DataDexReleaseV2, [itheumTokenAddress], {
      initializer: "initialize",
    });
    dataDexAddress = (await dataDex.deployed()).address;

    DataNFTReleaseV2 = await ethers.getContractFactory("DataNFTReleaseV2");
    dataNFT = await upgrades.deployProxy(DataNFTReleaseV2, [dataDexAddress, "Itheum Data NFT-FT V1", "DATANFTFT1"], {
      initializer: "initialize",
    });
    dataNFTAddress = (await dataNFT.deployed()).address;
  });

  describe("general", async () => {
    it("should be initialized correctly", async function () {
      expect(await dataDex.itheumToken()).to.be.equal(itheumTokenAddress);
    });

    it("owner should be able to set Itheum DataNFT contract", async function () {
      expect(await dataDex.itheumDataNFT()).to.be.equal('0x0000000000000000000000000000000000000000');

      const setItheumDataNFTTx = await dataDex.setItheumDataNFT('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
      await setItheumDataNFTTx.wait();

      expect(await dataDex.itheumDataNFT()).to.be.equal('0xE54FfbD968f803a704e74b983bF448F2C76902a6');
    });

    it("not-owner should not be able to set DataNFT contracts", async function () {
      await expect(dataDex.connect(addr1).setItheumDataNFT('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("owner should be able to set buyer fee", async function () {
      expect(await dataDex.buyerFeeInPercent()).to.be.equal(2);

      const setBuyerFeeInPercentTx = await dataDex.setBuyerFeeInPercent(5);
      await setBuyerFeeInPercentTx.wait();

      expect(await dataDex.buyerFeeInPercent()).to.be.equal(5);
    });

    it("owner should be able to set seller fee", async function () {
      expect(await dataDex.sellerFeeInPercent()).to.be.equal(2);

      const setSellerFeeInPercentTx = await dataDex.setSellerFeeInPercent(5);
      await setSellerFeeInPercentTx.wait();

      expect(await dataDex.sellerFeeInPercent()).to.be.equal(5);
    });

    it("owner should be able to set buyer and seller fee", async function () {
      expect(await dataDex.sellerFeeInPercent()).to.be.equal(2);
      expect(await dataDex.buyerFeeInPercent()).to.be.equal(2);

      const setBuyerAndSellerFeeInPercentTx = await dataDex.setBuyerAndSellerFeeInPercent(5, 5);
      await setBuyerAndSellerFeeInPercentTx.wait();

      expect(await dataDex.sellerFeeInPercent()).to.be.equal(5);
      expect(await dataDex.buyerFeeInPercent()).to.be.equal(5);
    });

    it("not-owner should not be able to set buyer or seller fees", async function () {
      await expect(dataDex.connect(addr1).setSellerFeeInPercent(5)).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(dataDex.connect(addr1).setBuyerFeeInPercent(5)).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(dataDex.connect(addr1).setBuyerAndSellerFeeInPercent(5, 5)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("buyer and seller fees must not be above 10%", async function () {
      await expect(dataDex.setSellerFeeInPercent(11)).to.be.revertedWith("Maximum seller fee is 10%");
      await expect(dataDex.setBuyerFeeInPercent(11)).to.be.revertedWith("Maximum buyer fee is 10%");
      await expect(dataDex.setBuyerAndSellerFeeInPercent(11, 5)).to.be.revertedWith("Maximum buyer fee is 10%");
      await expect(dataDex.setBuyerAndSellerFeeInPercent(5, 11)).to.be.revertedWith("Maximum seller fee is 10%");
    });
  });

  describe("dataNFT", async () => {
    it("user (addr1) should be able to buy from other user (addr2)", async function () {
      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      // addr2 mints and is therefore owner
      const createDataNftTx = await dataNFT.connect(addr2).createDataNFT('https://127.0.0.1', 1000, 10, false);
      await createDataNftTx.wait();

      expect(await dataNFT.ownerOf(1)).to.be.equal(addr2.address);

      // no addr has $ITHEUM
      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(0);

      // addr1 claims $ITHEUM
      const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1120);
      faucetTx.wait();

      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(1120);

      // addr1 approves dataNFT contract to transfer funds on his behalf
      const approveTx = await itheumToken.connect(addr1).approve(dataDexAddress, 1120);
      await approveTx.wait();

      // addr1 buys from addr2
      const buyTx = await dataDex.connect(addr1).buyDataNFT(addr2.address, addr1.address, 1, 0);
      await buyTx.wait();

      // addr2 has now $ITHEUM, addr1 not anymore
      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(1080);
      expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(40);

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
      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      // addr2 mints and is therefore owner
      const createDataNftTx = await dataNFT.connect(addr2).createDataNFT('https://127.0.0.1', 1000, 10, false);
      await createDataNftTx.wait();

      expect(await dataNFT.ownerOf(1)).to.be.equal(addr2.address);

      // no addr has $ITHEUM
      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(00);

      // addr1 claims $ITHEUM
      const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1120);
      faucetTx.wait();

      // addr1 approves dataNFT contract to transfer funds on his behalf
      const approveTx = await itheumToken.connect(addr1).approve(dataDexAddress, 1120);
      await approveTx.wait();

      // addr1 buys from addr2
      const buyTx = await dataDex.connect(addr1).buyDataNFT(addr2.address, addr1.address, 1, 0);
      await buyTx.wait();

      // addr2 has now $ITHEUM, addr1 not anymore
      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(1080);
      expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(40);

      // addr1 is now owner
      expect(await dataNFT.ownerOf(1)).to.be.equal(addr1.address);

      // addr1 sets new price and transferable
      const setPriceTx = await dataNFT.connect(addr1).setDataNFTPrice(1, 2000);
      await setPriceTx.wait();

      const setTransferableTx = await dataNFT.connect(addr1).setDataNFTTransferable(1, true);
      await setTransferableTx.wait();

      // addr3 claims $ITHEUM
      const faucetTx2 = await itheumToken.connect(addr3).faucet(addr3.address, 2240);
      faucetTx2.wait();

      expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(2240);

      // addr1 approves dataNFT contract to transfer funds on his behalf
      const approveTx2 = await itheumToken.connect(addr3).approve(dataDexAddress, 2240);
      await approveTx2.wait();

      // addr3 buys from addr1
      const buyTx1 = await dataDex.connect(addr3).buyDataNFT(addr1.address, addr3.address, 1, 0);
      await buyTx1.wait();

      // addr2 has now $ITHEUM, addr1 not anymore
      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(1960);
      expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(1280);
      expect(await itheumToken.balanceOf(addr3.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(120);

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

    it("should revert when trying to buy a non existing dataNFT", async function () {
      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      await expect(dataDex.buyDataNFT(addr1.address, addr2.address, 1, 0)).to.be.revertedWith("ERC721: owner query for nonexistent token");
    });

    it("should revert when trying to buy dataNFT which is not transferable", async function () {
      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
      await createDataNftTx.wait();

      const setTransferableTx = await dataNFT.setDataNFTTransferable(1, false);
      await setTransferableTx.wait();

      await expect(dataDex.connect(addr1).buyDataNFT(owner.address, addr1.address, 1, 0)).to.be.revertedWith("DataNFT is currently not transferable");
    });

    it("should revert when too few tokens are owned", async function () {
      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
      await createDataNftTx.wait();

      // addr1 claims $ITHEUM
      const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1000);
      faucetTx.wait();

      // addr1 approves dataNFT contract to transfer funds and NFT on his behalf
      const approveTx = await itheumToken.connect(addr1).approve(dataDexAddress, 1100);
      await approveTx.wait();

      await expect(dataDex.connect(addr1).buyDataNFT(owner.address, addr1.address, 1, 0)).to.be.revertedWith("Either you have insufficient ITHEUM to proceed or allowance in ITHEUM contract is too low");
    });

    it("should revert when enough tokens are owned but to less allowance is set", async function () {
      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
      await createDataNftTx.wait();

      // addr1 claims $ITHEUM
      const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1120);
      faucetTx.wait();

      // addr1 approves dataNFT contract to transfer funds on his behalf
      const approveTx = await itheumToken.connect(addr1).approve(dataDexAddress, 1000);
      await approveTx.wait();

      await expect(dataDex.connect(addr1).buyDataNFT(owner.address, addr1.address, 1, 0)).to.be.revertedWith("Either you have insufficient ITHEUM to proceed or allowance in ITHEUM contract is too low");
    });

    it("should revert when from address is not the owner of the provided token id", async function () {
      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      const createDataNftTx = await dataNFT.createDataNFT('https://127.0.0.1', 1000, 10, false);
      await createDataNftTx.wait();

      await expect(dataDex.connect(addr1).buyDataNFT(addr2.address, addr1.address, 1, 0)).to.be.revertedWith("'from' and 'ownerOf(tokenId)' doesn't match");
    });

    it("user should not be able to buy dataNFT when dataDex is paused", async function () {
      const pauseDexTx = await dataDex.pause();
      await pauseDexTx.wait();

      const setItheumDataNFTTx = await dataDex.setItheumDataNFT(dataNFTAddress);
      await setItheumDataNFTTx.wait();

      // addr2 mints and is therefore owner
      const createDataNftTx = await dataNFT.connect(addr2).createDataNFT('https://127.0.0.1', 1000, 10, false);
      await createDataNftTx.wait();

      expect(await dataNFT.ownerOf(1)).to.be.equal(addr2.address);

      // no addr has $ITHEUM
      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf(addr2.address)).to.be.equal(0);
      expect(await itheumToken.balanceOf('0xE54FfbD968f803a704e74b983bF448F2C76902a6')).to.be.equal(0);

      // addr1 claims $ITHEUM
      const faucetTx = await itheumToken.connect(addr1).faucet(addr1.address, 1120);
      faucetTx.wait();

      expect(await itheumToken.balanceOf(addr1.address)).to.be.equal(1120);

      // addr1 approves dataNFT contract to transfer funds on his behalf
      const approveTx = await itheumToken.connect(addr1).approve(dataDexAddress, 1120);
      await approveTx.wait();

      await expect(dataDex.connect(addr1).buyDataNFT(addr2.address, addr1.address, 1, 0)).to.be.revertedWith("Pausable: paused");
    });
  });
});