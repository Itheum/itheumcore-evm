//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Claims is Ownable, Pausable, ReentrancyGuard {

    struct Deposit {
        uint amount;
        uint lastDeposited;
    }

    uint public totalDeposits;
    mapping(address => mapping(uint16 => Deposit)) public deposits;
    ERC20 itheumTokenMYDA;

    constructor (address _itheumTokenMydaAddress) {
        itheumTokenMYDA = ERC20(_itheumTokenMydaAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    modifier noAddressZero(address _address) {
        require(_address != address(0x0), 'No deposits for 0x0 possible');
        _;
    }

    function increaseDeposit(
        address _address,
        uint16 _type,
        uint _amount
    ) external onlyOwner whenNotPaused noAddressZero(_address) returns(bool success) {
        totalDeposits += _amount;

        require(itheumTokenMYDA.allowance(owner(), address(this)) >= totalDeposits, 'Allowance must be set first');

        deposits[_address][_type].amount += _amount;
        deposits[_address][_type].lastDeposited = block.timestamp; // note that this can be influenced slightly by miners

        return true;
    }

    function decreaseDeposit(
        address _address,
        uint16 _type,
        uint _amount
    ) external onlyOwner whenNotPaused noAddressZero(_address) returns(bool success) {
        totalDeposits -= _amount;

        deposits[_address][_type].amount -= _amount;
        deposits[_address][_type].lastDeposited = block.timestamp; // note that this can be influenced slightly by miners

        return true;
    }

    function claimDeposit(uint16 _type) external whenNotPaused nonReentrant returns(bool success) {
        require(deposits[msg.sender][_type].amount > 0, 'Nothing to claim');

        uint amount = deposits[msg.sender][_type].amount;

        deposits[msg.sender][_type].amount = 0;

        totalDeposits -= amount;

        itheumTokenMYDA.transferFrom(owner(), msg.sender, amount);

        return true;
    }
}