//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ItheumFoundationDAO {
    
    // DAO staking is via the itheum token, so we need a ref
    ERC20 public itheumToken;
    
    /**
     * The main struct for a DataCoalition (DC) application
     * uri: the uri of the application form
     * status: to store the result of the DAO vote on this application
     * ... 1 = new, 2 = rejected, 3 = approved
     * feeInItheum: fee the caller has paid (will be held in escrow until vote is done)
     */
    struct DataCoalitionApplication {
        string uri;
        uint8 status;
        uint256 feeInItheum;
    }

    constructor(ERC20 _itheumToken) {
        itheumToken = _itheumToken;
    }
}