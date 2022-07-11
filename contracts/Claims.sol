//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Claims is Initializable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    event DepositIncreased(address indexed _address , uint8 indexed _type, uint _amount);
    event DepositDecreased(address indexed _address , uint8 indexed _type, uint _amount);
    event DepositClaimed(address indexed _address , uint8 indexed _type, uint _amount);

    struct Deposit {
        uint amount;
        uint lastDeposited;
    }

    uint public totalDeposits;
    mapping(address => mapping(uint8 => Deposit)) public deposits;
    address public itheumTokenAddress;

    function initialize(address _itheumTokenAddress) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        itheumTokenAddress = _itheumTokenAddress;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    modifier noAddressZero(address _address) {
        require(_address != address(0x0), 'Address zero not allowed');
        _;
    }

    function increaseDeposit(
        address _address,
        uint8 _type,
        uint _amount
    ) external onlyOwner whenNotPaused noAddressZero(_address) returns(bool success) {
        totalDeposits += _amount;

        address itheumTokenOwner = Ownable(itheumTokenAddress).owner();
        require(ERC20(itheumTokenAddress).allowance(itheumTokenOwner, address(this)) >= totalDeposits, 'Allowance must be set first');

        deposits[_address][_type].amount += _amount;
        deposits[_address][_type].lastDeposited = block.timestamp; // note that this can be influenced slightly by miners

        emit DepositIncreased(_address, _type, _amount);

        return true;
    }

    function decreaseDeposit(
        address _address,
        uint8 _type,
        uint _amount
    ) external onlyOwner whenNotPaused noAddressZero(_address) returns(bool success) {
        totalDeposits -= _amount;

        deposits[_address][_type].amount -= _amount;
        deposits[_address][_type].lastDeposited = block.timestamp; // note that this can be influenced slightly by miners

        emit DepositDecreased(_address, _type, _amount);

        return true;
    }

    function claimDeposit(uint8 _type) external whenNotPaused nonReentrant returns(bool success) {
        require(deposits[msg.sender][_type].amount > 0, 'Nothing to claim');

        uint amount = deposits[msg.sender][_type].amount;

        deposits[msg.sender][_type].amount = 0;

        totalDeposits -= amount;

        address itheumTokenOwner = Ownable(itheumTokenAddress).owner();
        ERC20(itheumTokenAddress).transferFrom(itheumTokenOwner, msg.sender, amount);

        emit DepositClaimed(msg.sender, _type, amount);

        return true;
    }
}