//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DataCoalitionsDAO {
    
    // staking is via the myda token, so we need a ref
    ERC20 public mydaToken;
    
    /**
     * The main struct for a DataCoalition (DC)
     * id: auto incremented unique id
     * chair: address of the user who created it
     * members: all the members of this coalition
     * uri: the uri of the metadata file for details about this DC
     * minimumStakeInMyda: minimum needed to stake
     * mydaPool: stake/bonds etc go into the myda pool (@TODO, but how has controlling access to this? - will need to be DAO)
     */
    struct DataCoalition {
        uint256 id;
        address chair;
        address[] board;
        address[] members;
        string uri;
        uint256 minimumStakeInMyda;
        address mydaPool;
    }

    mapping (uint256 => DataCoalition) private dataCoalitions;
    mapping (address => uint256) private DCOwners;

    event JoinDCStakeEvent(uint256 DCId, address member, uint256 stakeInMyda);

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
     * id: a new member wants to join by paying the minimum amount of MYDA
     * DCId: the DC they want to join
     * stakeInMyda: their stake
     * returns -> true (joined), false (failed)
     */
    function memberJoinViaStake(uint256 DCId, uint256 stakeInMyda) public returns (bool) {
        require(dataCoalitions[DCId].id != 0, "Data Coalition does not exist");

        // get the DC details
        DataCoalition storage tojoinDC = dataCoalitions[DCId];

        if (tojoinDC.minimumStakeInMyda >= stakeInMyda) { // fee is sufficient, lets proceed
            // add to the pool mydaPool
            uint256 myMyda = mydaToken.balanceOf(msg.sender);
        
            require(myMyda > 0, "You need MYDA to perform this function");
            require(myMyda > stakeInMyda, "You dont have sufficient MYDA to proceed");

            mydaToken.transferFrom(msg.sender, tojoinDC.mydaPool, stakeInMyda);

            // add a member (what happens if he exists? @TODO)
            tojoinDC.members.push(msg.sender);

            emit JoinDCStakeEvent(tojoinDC.id, msg.sender, stakeInMyda);

            return true;
        } else {
            return false;
        }        
    }

}
