//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ItheumDataCoalitionsDAO {
    
    // staking is via the myda token, so we need a ref
    ERC20 public mydaToken;
    
    /**
     * The main struct for a DataCoalition (DC)
     * id: auto incremented unique id
     * owner: this is the address that owns it and will have the pool funds (stake / bond / purchase payments 
     ... @TODO: this needs to be a DAO controlled address)
     * chair: address of the user who created it
     * members: all the members of this coalition
     * status: the enum status (e.g. recruitmentOfBoard, inOperation, seizedOperation, pausedOperation etc)
     * uri: the uri of the metadata file for details about this DC
     * minStakeInMyda: minimum needed to stake
     * mydaPool: stake/bonds etc go into the myda pool (@TODO, but how has controlling access to this? - will need to be DAO)
     */
    struct DataCoalition {
        uint256 id;
        address owner;
        address chair;
        address[] board;
        address[] members;
        uint8 status;
        string uri;
        uint256 minStakeInMyda;
        uint256 minStakeBoardInMyda;
    }

    mapping (uint256 => DataCoalition) private dataCoalitions;
    mapping (address => uint256) private DCOwners;

    event JoinDCBoardStakeEvent(uint256 DCId, address member, uint256 stakeInMyda);
    event JoinDCMemberStakeEvent(uint256 DCId, address member, uint256 stakeInMyda);

    constructor(ERC20 _mydaToken) {
        mydaToken = _mydaToken;
    }

    /*
     * @TODO: a caller can create a data coaltion
     * id: auto incremented unique id
     * creator: address of the user who created it
     * members: all the members of this coalition
     * uri: the uri of the metadata file for details about this DC
     */
    function createDC(string memory uri) public returns (uint256) {}

    /*
     * return the DC based on the ID
     * DCId: DC Id
     * returns -> DC object (@TODO - test output format, object? or something else)
     */
    function getDCDetails(uint256 DCId) public view returns (DataCoalition memory) {
        return dataCoalitions[DCId];
    }

    /*
     * id: board member joins by paying the minimum amount of MYDA
     * DCId: the DC they want to join
     * stakeInMyda: their stake
     * returns -> true (joined), false (failed)
     */
    function boardMemberJoin(uint256 DCId, uint256 stakeInMyda) public returns (bool) {
        require(dataCoalitions[DCId].id != 0, "Data Coalition does not exist");

        // get the DC details
        DataCoalition storage tojoinDC = dataCoalitions[DCId];

        if (tojoinDC.minStakeBoardInMyda >= stakeInMyda) { // fee is sufficient, lets proceed
            // add to the myda pool controlled by the owner
            uint256 myMyda = mydaToken.balanceOf(msg.sender);
        
            require(myMyda > 0, "You need MYDA to perform this function");
            require(myMyda > stakeInMyda, "You dont have sufficient MYDA to proceed");

            mydaToken.transferFrom(msg.sender, tojoinDC.owner, stakeInMyda);

            // add a board member (@TODO what happens if he exists? and also we need to enfore max board member limit )
            tojoinDC.board.push(msg.sender);

            emit JoinDCBoardStakeEvent(tojoinDC.id, msg.sender, stakeInMyda);

            return true;
        } else {
            return false;
        }        
    }

    /*
     * id: a new member wants to join by paying the minimum amount of MYDA
     * DCId: the DC they want to join
     * stakeInMyda: their stake
     * returns -> true (joined), false (failed)
     */
    function memberJoinViaStake(uint256 DCId, uint256 stakeInMyda) public returns (bool) {
        require(dataCoalitions[DCId].id != 0, "Data Coalition does not exist");

        // get the DC details
        DataCoalition storage tojoinDC = dataCoalitions[DCId];

        if (tojoinDC.minStakeInMyda >= stakeInMyda) { // fee is sufficient, lets proceed
            // add to the myda pool controlled by the owner
            uint256 myMyda = mydaToken.balanceOf(msg.sender);
        
            require(myMyda > 0, "You need MYDA to perform this function");
            require(myMyda > stakeInMyda, "You dont have sufficient MYDA to proceed");

            mydaToken.transferFrom(msg.sender, tojoinDC.owner, stakeInMyda);

            // add a member (what happens if he exists? @TODO)
            tojoinDC.members.push(msg.sender);

            emit JoinDCMemberStakeEvent(tojoinDC.id, msg.sender, stakeInMyda);

            return true;
        } else {
            return false;
        }        
    }

}
