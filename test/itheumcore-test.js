const { expect } = require("chai");

describe("ItheumDataCoalitionsDAO", function () {
  beforeEach(async() => {
    ItheumTokenMYDA = await ethers.getContractFactory("ItheumTokenMYDA");
    tokenMYDA = await ItheumTokenMYDA.deploy();
    [owner, addr1, addr2, _] = await ethers.getSigners();

    await tokenMYDA.deployed();

    ItheumDataCoalitionsDAO = await ethers.getContractFactory("ItheumDataCoalitionsDAO");
    dataCoalitionsDAO = await ItheumDataCoalitionsDAO.deploy(tokenMYDA.address);

    await dataCoalitionsDAO.deployed();
  })

  it("Should seed the MYDA ERC20 contract with correct addresses", async function () {
    // check if owner has all the myda
    const balOwner = await tokenMYDA.balanceOf(owner.address);

    expect(balOwner.toString()).to.equal('1000000000000000000000000000');
    
    // move some myda to addr1 and check if it reflected in owner and addr1 balances
    await tokenMYDA.transfer(addr1.address, 10000000000000);

    const balAddr1 = await tokenMYDA.balanceOf(addr1.address);
    expect(balAddr1.toString()).to.equal('10000000000000');

    // confirm the balances have adjusted
    const balOwnerFinal = await tokenMYDA.balanceOf(owner.address);
    const expected_balOwnerFinal = '999999999999990000000000000';

    expect(balOwnerFinal.toString()).to.equal(expected_balOwnerFinal); // did the owner get his tokens deducted?
  });

  it("Should have no DCs to begin with", async function () {
    const DC = await dataCoalitionsDAO.getDCDetails(1);
    expect(DC.id.toString()).to.equal('0');
  });

  it("Should create some new DCs and confirm they were created", async function () {
    /*
    string calldata uri,
    uint8 minBoardMembers,
    uint8 maxBoardMembers,
    uint8 minMembers,
    uint8 maxMembers,
    uint256 minStakeInMyda,
    uint256 minStakeBoardInMyda
    */

    let newDC = await dataCoalitionsDAO.createDC('https://foo.bar/dcmeta1', 3, 5, 5, 8, 100, 500);
    await newDC.wait(); // wait until the transaction is mined

    let DC = await dataCoalitionsDAO.getDCDetails(1);
    expect(DC.id.toString()).to.equal('1');
    expect(DC.uri).to.equal('https://foo.bar/dcmeta1');

    // lets add another one to check if auto increment id is working
    newDC = await dataCoalitionsDAO.createDC('https://foo.bar/dcmeta2', 3, 5, 5, 8, 100, 500);
    await newDC.wait();

    DC = await dataCoalitionsDAO.getDCDetails(2);
    expect(DC.id.toString()).to.equal('2');
    expect(DC.uri).to.equal('https://foo.bar/dcmeta2');
  });

  it("Should create a new DC an stake to join as a board member", async function () {
    /*
      scenario:
      'owner address' creates a DC (id 1) - they will able be the 1st board member [TS1]
      'addr1 address' then stakes and becomes a member in DC1 - they are the 2nd member [TS2]
        by doing this, minStakeBoardInMyda is moved from 'addr1 address' and send to 'owner address'
          as 'owner address' is the 'owner' in DC1 (as he was the creator)

    */
    const minStakeBoardInMyda = 500;
    const newDC = await dataCoalitionsDAO.createDC('https://foo.bar/dcmeta1', 3, 5, 5, 8, 100, getMydaInPrecision(minStakeBoardInMyda));
    await newDC.wait();

    // check length to make sure it 1 (as the founder is the 1st member) - [TS1]
    let DC = await dataCoalitionsDAO.getDCDetails(1);
    expect(DC.board.length).to.equal(1);

    // to do rest of the scenarios, we need to make sure addr1 address has some MYDA (send some)
    await tokenMYDA.transfer(addr1.address, getMydaInPrecision(1000));

    // let balOwner = await tokenMYDA.balanceOf(owner.address);
    // console.log('🚀 ~ balOwner 1 ', balOwner.toString());
    // let balAddr1 = await tokenMYDA.balanceOf(addr1.address);
    // console.log('🚀 ~ balAddr1 1 ', balAddr1.toString());

    // // check current allowance for addr1
    // const checkA = await tokenMYDA.allowance(addr1.address, dataCoalitionsDAO.address);
    // console.log('🚀 ~ checkA', checkA.toString());

    // need to approve first the contract to spend 1st
    const approveSpend = await tokenMYDA.connect(addr1).approve(dataCoalitionsDAO.address, getMydaInPrecision(minStakeBoardInMyda));
    await approveSpend.wait();

    // const checkB = await tokenMYDA.allowance(addr1.address, dataCoalitionsDAO.address);
    // console.log('🚀 ~ checkB', checkB.toString());

    // addr1 will join as new board member with stake payment
    let joinDCAsMember = await dataCoalitionsDAO.connect(addr1).boardMemberJoin(1, getMydaInPrecision(minStakeBoardInMyda));
    await joinDCAsMember.wait();

    // balOwner = await tokenMYDA.balanceOf(owner.address);
    // console.log('🚀 ~ balOwner 2 ', balOwner.toString());
    // balAddr1 = await tokenMYDA.balanceOf(addr1.address);
    // console.log('🚀 ~ balAddr1 2 ', balAddr1.toString());

    // now DC1 board members should be 2 in total
    DC = await dataCoalitionsDAO.getDCDetails(1);
    expect(DC.board.length).to.equal(2);

    /* @TODO write following test cases
    - after the above is a success (i.e. addr1 joined board, owner addr got the myda and addr1 lost the myda)
    - addr1 does not enough myda to stake (has 0 or around 100 - as min is 500 for DC1)
    - addr1 has myda but the board members is at max
    */
  });
});

/*
  this util will take a readable number and conver to the decimals as per MYDA ERC20
  ... it's needed to ensure approvals and transfers happen with correct precision
*/
function getMydaInPrecision(readableMyda) {
  const decimals = 18;
  const mydaInPrecision = ethers.BigNumber.from("0x"+(readableMyda*10**decimals).toString(16));

  return mydaInPrecision;
}


// good testing tutorial and how to deploy to testnets
// https://www.youtube.com/watch?v=9Qpi80dQsGU


    // const ItheumTokenMYDA = await ethers.getContractFactory("ItheumTokenMYDA");
    // const tokenMYDA = await ItheumTokenMYDA.deploy();
    // const [owner, addr1, addr2, _] = await ethers.getSigners();

    // await tokenMYDA.deployed();

    // const bal = await tokenMYDA.balanceOf(owner.address);
    // console.log('bal');
    // console.log(bal.toString());

    // console.log('owner');
    // console.log(owner.address);

    // console.log('tokenMYDA');
    // console.log(tokenMYDA.address);

    // expect(true).to.equal(true);

    // const ItheumDataCoalitionsDAO = await ethers.getContractFactory("ItheumDataCoalitionsDAO");
    // const dataCoalitionsDAO = await ItheumDataCoalitionsDAO.deploy(tokenMYDA.address);

    // console.log('ownerDCDao');
    // console.log(dataCoalitionsDAO.address);