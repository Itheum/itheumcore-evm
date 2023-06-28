//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ItheumTokenMultiChainGeneric is ERC20, ERC20Burnable, Ownable {
    
    mapping(address => uint256) public faucetLastUsed;

    address public dataPackFeeTreasury;
    address public dataNFTFeeTreasury;

    modifier noAddressZero(address _address) {
        require(_address != address(0x0), 'Address zero not allowed');
        _;
    }

    constructor(string memory tokenName, string memory tokenID) ERC20(tokenName, tokenID) {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function setDataNFTFeeTreasury(address _address) external onlyOwner noAddressZero(_address) returns(bool) {
        dataNFTFeeTreasury = _address;
        return true;
    }
    
    function faucet(address recipient, uint256 amount) external returns(bool) {
        require(block.timestamp - faucetLastUsed[recipient] > 60, "You need to wait 60 seconds to use again");

        faucetLastUsed[recipient] = block.timestamp;

        _mint(recipient, amount);

        return true;
    }
}
