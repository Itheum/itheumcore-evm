//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract DataCoalitionsDAO {

    // get auto incremented IDs
    using Counters for Counters.Counter;
    Counters.Counter private _DCIds;
    
    // staking is via the itheum token, so we need a ref
    ERC20 public itheumToken;
    
    /**
     * The main struct for a DataCoalition (DC)
     * id: auto incremented unique id
     * owner: this is the address that owns it and will have the pool funds (stake / bond / purchase payments 
     ... @TODO: this needs to be a DAO controlled address)
     * chair: address of the user who created it
     * members: all the members of this coalition
     * status: the enum status (e.g. seizedOperation/0, inBoardRecruitment/1, inRecruitment/2, inOperation/3, pausedOperation/4 etc)
     * uri: the uri of the metadata file for details about this DC
     * minBoardMembers: minimum board members for DC to become "inRecruitment"
     * maxBoardMembers: maximum board members allowed
     * minMembers: minimum numbers for DC to become "inOperation"
     * maxMembers: maximum members allowed
     * minStakeInItheum: minimum needed to stake
     * itheumPool: stake/bonds etc go into the itheum pool (@TODO, but how has controlling access to this? - will need to be DAO)
     */
    struct DataCoalition {
        uint256 id;
        address owner;
        address chair;
        address[] board;
        address[] members;
        uint8 status;
        string uri;
        uint8 minBoardMembers;
        uint8 maxBoardMembers;
        uint8 minMembers;
        uint8 maxMembers;
        uint256 minStakeInItheum;
        uint256 minStakeBoardInItheum;
    }

    mapping (uint256 => DataCoalition) private dataCoalitions;
    mapping (address => uint256) private DCOwners;

    event JoinDCBoardStakeEvent(uint256 DCId, address member, uint256 stakeInItheum);
    event JoinDCMemberStakeEvent(uint256 DCId, address member, uint256 stakeInItheum);

    constructor(ERC20 _itheumToken) {
        itheumToken = _itheumToken;
    }

    /*
     * @TODO: a caller can create a data coaltion
     * uri: uri of extra data file (like web2 application form and web2 id)
     * minBoardMembers/maxBoardMembers: min and max board members
     * minMembers/maxMembers : min and max  members
     * minStakeInItheum: min stake in itheum for member
     * minStakeBoardInItheum: max stake in itheum for board member
     */
    function createDC(
        string calldata uri,
        uint8 minBoardMembers,
        uint8 maxBoardMembers,
        uint8 minMembers,
        uint8 maxMembers,
        uint256 minStakeInItheum,
        uint256 minStakeBoardInItheum
        ) public returns (uint256) {
        
        _DCIds.increment();
        uint256 newDCId = _DCIds.current();

        dataCoalitions[newDCId].id = newDCId;
        dataCoalitions[newDCId].owner = msg.sender;
        dataCoalitions[newDCId].chair = msg.sender;
        // owner, also becomes a member
        dataCoalitions[newDCId].board.push(msg.sender);
        dataCoalitions[newDCId].status = 1;
        dataCoalitions[newDCId].uri = uri;
        dataCoalitions[newDCId].minBoardMembers = minBoardMembers;
        dataCoalitions[newDCId].maxBoardMembers = maxBoardMembers;
        dataCoalitions[newDCId].minMembers = minMembers;
        dataCoalitions[newDCId].maxMembers = maxMembers;
        dataCoalitions[newDCId].minStakeInItheum = minStakeInItheum;
        dataCoalitions[newDCId].minStakeBoardInItheum = minStakeBoardInItheum;

        return newDCId;
    }

    /*
     * return the DC based on the ID
     * DCId: DC Id
     * returns -> DC object (@TODO - test output format, object? or something else)
     */
    function getDCDetails(uint256 DCId) public view returns (DataCoalition memory) {
        return dataCoalitions[DCId];
    }

    /*
     * id: board member joins by paying the minimum amount of Itheum
     * DCId: the DC they want to join
     * stakeInItheum: their stake
     * returns -> true (joined), false (failed)
     */
    function boardMemberJoin(uint256 DCId, uint256 stakeInItheum) public returns (bool) {
        // console.log("boardMemberJoin: DCId %s stakeInItheum %s", DCId, stakeInItheum);

        require(dataCoalitions[DCId].id != 0, "Data Coalition does not exist");

        // get the DC details
        DataCoalition storage tojoinDC = dataCoalitions[DCId];

        // can only proceed if DC is in inBoardRecruitment/1, inRecruitment/2, inOperation/3 statuses
        require((tojoinDC.status == 1 || tojoinDC.status == 2 || tojoinDC.status == 3), "This DC is not accepting board members");

        if (stakeInItheum >= tojoinDC.minStakeBoardInItheum) { // fee is sufficient, lets proceed
            // add to the itheum pool controlled by the owner
            uint256 myItheum = itheumToken.balanceOf(msg.sender);
        
            require(myItheum > 0, "You need Itheum to perform this function");
            require(myItheum > stakeInItheum, "You dont have sufficient Itheum to proceed");
            require(tojoinDC.board.length < tojoinDC.maxBoardMembers, "This DCs board membership is already at max");
            // @TODO - check if the board member is not already present            

            itheumToken.transferFrom(msg.sender, tojoinDC.owner, stakeInItheum);

            // add a board member
            tojoinDC.board.push(msg.sender);

            // update the status if it's in inBoardRecruitment and we filled the quota
            if (tojoinDC.board.length == tojoinDC.minBoardMembers) {
                tojoinDC.status = 2;
            }

            emit JoinDCBoardStakeEvent(tojoinDC.id, msg.sender, stakeInItheum);

            return true;
        } else {            
            return false;
        }        
    }

    /*
     * id: a new member wants to join by paying the minimum amount of Itheum
     * DCId: the DC they want to join
     * stakeInItheum: their stake
     * returns -> true (joined), false (failed)
     */
    function memberJoinViaStake(uint256 DCId, uint256 stakeInItheum) public returns (bool) {    
        require(dataCoalitions[DCId].id != 0, "Data Coalition does not exist");

        // get the DC details
        DataCoalition storage tojoinDC = dataCoalitions[DCId];

        // can only proceed if DC is in inRecruitment/2, inOperation/3 statuses
        require((tojoinDC.status == 2 || tojoinDC.status == 3), "This DC is not accepting members");

        if (stakeInItheum >= tojoinDC.minStakeInItheum) { // fee is sufficient, lets proceed
            // add to the itheum pool controlled by the owner
            uint256 myItheum = itheumToken.balanceOf(msg.sender);
        
            require(myItheum > 0, "You need Itheum to perform this function");
            require(myItheum > stakeInItheum, "You dont have sufficient Itheum to proceed");
            require(tojoinDC.board.length < tojoinDC.maxMembers, "This DCs membership is already at max");
            // @TODO - check if the member is not already present  

            itheumToken.transferFrom(msg.sender, tojoinDC.owner, stakeInItheum);

            // add a member
            tojoinDC.members.push(msg.sender);

            emit JoinDCMemberStakeEvent(tojoinDC.id, msg.sender, stakeInItheum);

            return true;
        } else {
            return false;
        }        
    }

}
