//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./ItheumToken.sol";
import "./dataPack.sol";
import "./dataNFT.sol";
import "./SharedStructs.sol";


contract DataDex is Ownable, Pausable {

    uint8 public BUYER_FEE_IN_PERCENT = 2;
    uint8 public SELLER_FEE_IN_PERCENT = 2;

    ItheumToken public itheumToken;
    ItheumDataPack public itheumDataPack;
    ItheumDataNFT public itheumDataNFT;

    constructor(ItheumToken _itheumToken) {
        itheumToken = _itheumToken;
    }

    function setItheumDataNFT(ItheumDataNFT _itheumDataNFT) external onlyOwner returns(bool) {
        itheumDataNFT = _itheumDataNFT;
        return true;
    }

    function setItheumDataPack(ItheumDataPack _itheumDataPack) external onlyOwner returns(bool) {
        itheumDataPack = _itheumDataPack;
        return true;
    }

    function buyDataPack(address _from, address _to, string calldata _dataPackId) external {
        require(!itheumDataPack.checkAccess(_dataPackId), "You already have bought this dataPack");

        address dataPackFeeTreasury = itheumToken.dataPackFeeTreasury();

        require(dataPackFeeTreasury != address(0x0), 'DataPack fee treasury isn\'t set in ITHEUM token contract');

        (address seller, , uint256 priceInItheum) = itheumDataPack.dataPacks(_dataPackId);

        require(_from == seller, "'from' is not 'seller'");

        require(seller != address(0), "You can't buy a non-existing data pack");

        (uint256 sellerFee, uint256 buyerFee) = getSellerAndBuyerFee(priceInItheum);

        // check the balance of $ITHEUM for buyer
        uint256 itheumOfBuyer = itheumToken.balanceOf(msg.sender);
        require(itheumOfBuyer >= priceInItheum + buyerFee, "You don't have sufficient ITHEUM to proceed");

        // check the allowance of $ITHEUM for this contract to spend from buyer
        uint256 allowance = itheumToken.allowance(msg.sender, address(this));
        require(allowance >= priceInItheum + buyerFee, "Allowance in ITHEUM contract is too low");

        // transfer $ITHEUM to data pack fee treasury and to seller
        itheumToken.transferFrom(msg.sender, seller, priceInItheum - sellerFee);
        itheumToken.transferFrom(msg.sender, dataPackFeeTreasury, sellerFee + buyerFee);

        itheumDataPack.buyDataPack(_dataPackId, _to, priceInItheum + buyerFee);
    }

    function buyDataNFT(address _from, address _to, uint256 _tokenId, bytes memory _data) external {
        require(itheumDataNFT.ownerOf(_tokenId) == _from, "'from' and 'ownerOf(tokenId)' doesn't match");

        address dataNFTFeeTreasury = itheumToken.dataNFTFeeTreasury();

        require(dataNFTFeeTreasury != address(0x0), 'DataNFT fee treasury isn\'t set in ITHEUM token contract');

        SharedStructs.DataNFT memory dataNFT = itheumDataNFT.dataNFTs(_tokenId);

        require(dataNFT.transferable, "DataNFT is currently not transferable");
        require(itheumDataNFT.getApproved(_tokenId) == address(this), "DataDex contract must be approved to transfer the NFT");

        uint256 priceInItheum = dataNFT.priceInItheum;
        uint256 royaltyInItheum = priceInItheum * dataNFT.royaltyInPercent / 100;

        (uint256 sellerFee, uint256 buyerFee) = getSellerAndBuyerFee(priceInItheum);

        // check the balance of $ITHEUM for buyer
        uint256 balance = itheumToken.balanceOf(msg.sender);
        require(balance >= priceInItheum + royaltyInItheum + buyerFee, "You don't have sufficient ITHEUM to proceed");

        // check the allowance of $ITHEUM for this contract to spend from buyer
        uint256 allowance = itheumToken.allowance(msg.sender, address(this));
        require(allowance >= priceInItheum + royaltyInItheum + buyerFee, "Allowance in ITHEUM contract is too low");

        // transfer $ITHEUM to data nft fee treasury, owner and to creator
        itheumToken.transferFrom(msg.sender, dataNFTFeeTreasury, sellerFee + buyerFee);
        itheumToken.transferFrom(msg.sender, _from, priceInItheum - sellerFee);
        itheumToken.transferFrom(msg.sender, dataNFT.creator, royaltyInItheum);

        itheumDataNFT.buyDataNFT(_tokenId, _to, priceInItheum, royaltyInItheum, _data);
    }

    function getSellerAndBuyerFee(uint256 _priceInItheum) view internal returns(uint256 sellerFee, uint256 buyerFee) {
        sellerFee = _priceInItheum * SELLER_FEE_IN_PERCENT / 100;
        buyerFee = _priceInItheum * BUYER_FEE_IN_PERCENT / 100;
    }
}