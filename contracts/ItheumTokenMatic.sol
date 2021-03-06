//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ItheumTokenMatic is ERC20, ERC20Burnable, Ownable {
    
    mapping(address => uint256) public faucetLastUsed;
    
    constructor() ERC20("Itheum Token", "mITHEUM") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
     function faucet(address recipient, uint256 amount) external returns(bool) {
         require(block.timestamp - faucetLastUsed[recipient] > 10, "You need to wait 10 seconds to use again");
         
        faucetLastUsed[recipient] = block.timestamp;
        
        _mint(recipient, amount);
        
        return true;
    }
}
