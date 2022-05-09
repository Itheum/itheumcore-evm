const { expect } = require("chai");

describe("Claims", async function () {
  beforeEach(async() => {
    [owner, addr1, addr2, _remaining] = await ethers.getSigners();

    ItheumTokenMYDA = await ethers.getContractFactory("ItheumTokenMYDA");
    tokenMYDA = await ItheumTokenMYDA.deploy();
    tokenMYDAAddress = (await tokenMYDA.deployed()).address;

    Claims = await ethers.getContractFactory("Claims");
    claims = await Claims.deploy(tokenMYDAAddress);
    claimsAddress = (await claims.deployed()).address;
  });

  it("owner should be able to increase deposit", async function () {
      const approveTx = await tokenMYDA.approve(claimsAddress, 600);
      await approveTx.wait();

      expect((await claims.deposits(addr1.address, 1)).amount).to.be.equal(0);

      const increaseDepositTx = await claims.increaseDeposit(addr1.address, 1, 500);
      await increaseDepositTx.wait();

      expect((await claims.deposits(addr1.address, 1)).amount).to.be.equal(500);
  });

  it("owner should be able to decrease deposit", async function () {
      const approveTx = await tokenMYDA.approve(claimsAddress, 600);
      await approveTx.wait();

      expect((await claims.deposits(addr1.address, 1)).amount).to.be.equal(0);

      const increaseDepositTx = await claims.increaseDeposit(addr1.address, 1, 500);
      await increaseDepositTx.wait();

      expect((await claims.deposits(addr1.address, 1)).amount).to.be.equal(500);

      const decreaseDepositTx = await claims.decreaseDeposit(addr1.address, 1, 200);
      await decreaseDepositTx.wait();

      expect((await claims.deposits(addr1.address, 1)).amount).to.be.equal(300);
  });

  it("user shouldn't be able to increase deposit", async function () {
    const approveTx = await tokenMYDA.approve(claimsAddress, 600);
    await approveTx.wait();

    await expect(claims.connect(addr1).increaseDeposit(addr1.address, 1, 500)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("owner shouldn't be able to increase deposit when paused", async function () {
    const pauseTx = await claims.pause();
    await pauseTx.wait();

    const approveTx = await tokenMYDA.approve(claimsAddress, 600);
    await approveTx.wait();

    await expect(claims.increaseDeposit(addr1.address, 1, 500)).to.be.revertedWith('Pausable: paused');
  });

  it("owner shouldn't be able to increase deposit when too less allowance is set", async function () {
    const approveTx = await tokenMYDA.approve(claimsAddress, 400);
    await approveTx.wait();

    await expect(claims.increaseDeposit(addr1.address, 1, 500)).to.be.revertedWith("'Allowance must be set first");
  });

  it("user should be able to claim deposit", async function () {
    const approveTx = await tokenMYDA.approve(claimsAddress, 600);
    await approveTx.wait();

    const increaseDepositTx = await claims.increaseDeposit(addr1.address, 1, 500);
    await increaseDepositTx.wait();

    expect(await tokenMYDA.balanceOf(addr1.address)).to.equal(0);

    const claimDepositTx = await claims.connect(addr1).claimDeposit(1);
    await claimDepositTx.wait();

    expect(await tokenMYDA.balanceOf(addr1.address)).to.equal(500);
    expect((await claims.deposits(addr1.address, 1)).amount).to.equal(0);
  });

  it("user shouldn't be able to claim deposit when paused", async function () {
    const approveTx = await tokenMYDA.approve(claimsAddress, 600);
    await approveTx.wait();

    const increaseDepositTx = await claims.increaseDeposit(addr1.address, 1, 500);
    await increaseDepositTx.wait();

    expect(await tokenMYDA.balanceOf(addr1.address)).to.equal(0);

    const pauseTx = await claims.pause();
    await pauseTx.wait();

    await expect(claims.connect(addr1).claimDeposit(1)).to.be.revertedWith('Pausable: paused');
  });

  it("user shouldn't be able to claim deposit when nothing to claim", async function () {
    await expect(claims.connect(addr1).claimDeposit(1)).to.be.revertedWith('Nothing to claim');
  });

  it("owner should not be able to deposit for address zero", async function () {
    await expect(claims.increaseDeposit('0x0000000000000000000000000000000000000000', 1, 500))
      .to.be.revertedWith('No deposits for 0x0 possible');
  });

  it("owner should not be able to decrease deposit too much", async function () {
    const approveTx = await tokenMYDA.approve(claimsAddress, 600);
    await approveTx.wait();

    const increaseDepositTx = await claims.increaseDeposit(addr1.address, 1, 500);
    await increaseDepositTx.wait();

    expect((await claims.deposits(addr1.address, 1)).amount).to.be.equal(500);

    await expect(claims.decreaseDeposit(addr1.address, 1, 550)).to.be.reverted;

    expect((await claims.deposits(addr1.address, 1)).amount).to.be.equal(500);
  });
});