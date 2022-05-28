//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./ItheumToken.sol";


contract DataDex is Ownable, Pausable {

    ItheumToken public itheumToken;

    constructor(ItheumToken _itheumToken) {
        itheumToken = _itheumToken;
    }
}