//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "./ItheumTokenMultiChainGeneric.sol";
import "./DataNFTReleaseV2.sol";
import "./SharedStructs.sol";


contract DataDexReleaseV2 is Initializable, OwnableUpgradeable, PausableUpgradeable {

    uint8 public buyerFeeInPercent;
    uint8 public sellerFeeInPercent;

    ItheumTokenMultiChainGeneric public itheumToken;
    DataNFTReleaseV2 public itheumDataNFT;

    modifier whenItheumDataNFTIsSet() {
        require(address(itheumDataNFT) != address(0), 'DataNFTReleaseV2 contract must be set first');
        _;
    }

    function initialize(ItheumTokenMultiChainGeneric _itheumToken) public initializer {
        __Ownable_init();
        __Pausable_init();

        itheumToken = _itheumToken;

        buyerFeeInPercent = 2;
        sellerFeeInPercent = 2;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setItheumDataNFT(DataNFTReleaseV2 _itheumDataNFT) external onlyOwner returns(bool) {
        itheumDataNFT = _itheumDataNFT;

        return true;
    }

    function setBuyerFeeInPercent(uint8 _buyerFee) external onlyOwner returns(bool) {
        require(_buyerFee < 11, "Maximum buyer fee is 10%");

        buyerFeeInPercent = _buyerFee;

        return true;
    }

    function setSellerFeeInPercent(uint8 _sellerFee) external onlyOwner returns(bool) {
        require(_sellerFee < 11, "Maximum seller fee is 10%");

        sellerFeeInPercent = _sellerFee;

        return true;
    }

    function setBuyerAndSellerFeeInPercent(uint8 _buyerFee, uint8 _sellerFee) external onlyOwner returns(bool) {
        require(_buyerFee < 11, "Maximum buyer fee is 10%");
        require(_sellerFee < 11, "Maximum seller fee is 10%");

        buyerFeeInPercent = _buyerFee;
        sellerFeeInPercent = _sellerFee;

        return true;
    }

    function buyDataNFT(address _from, address _to, uint256 _tokenId, bytes memory _data) external whenItheumDataNFTIsSet whenNotPaused {
        require(itheumDataNFT.ownerOf(_tokenId) == _from, "'from' and 'ownerOf(tokenId)' doesn't match");

        address dataNFTFeeTreasury = itheumToken.dataNFTFeeTreasury();

        require(dataNFTFeeTreasury != address(0x0), 'DataNFT fee treasury isn\'t set in ITHEUM token contract');

        SharedStructs.DataNFT memory dataNFT = itheumDataNFT.dataNFTs(_tokenId);

        require(dataNFT.transferable, "DataNFT is currently not transferable");
        require(itheumDataNFT.getApproved(_tokenId) == address(this), "DataDex contract must be approved to transfer the NFT");

        uint256 priceInItheum = dataNFT.priceInItheum;
        uint256 royaltyInItheum = priceInItheum * dataNFT.royaltyInPercent / 100;

        (uint256 sellerFee, uint256 buyerFee) = getSellerAndBuyerFee(priceInItheum);

        require(balanceAndAllowanceCheck(msg.sender, priceInItheum + royaltyInItheum + buyerFee),
            "Either you have insufficient ITHEUM to proceed or allowance in ITHEUM contract is too low");

        // transfer $ITHEUM to data nft fee treasury, to owner and to creator
        itheumToken.transferFrom(msg.sender, dataNFTFeeTreasury, sellerFee + buyerFee);
        itheumToken.transferFrom(msg.sender, _from, priceInItheum - sellerFee);
        itheumToken.transferFrom(msg.sender, dataNFT.creator, royaltyInItheum);

        itheumDataNFT.buyDataNFT(_tokenId, _to, priceInItheum, royaltyInItheum, _data);
    }

    function getSellerAndBuyerFee(uint256 _priceInItheum) view internal returns(uint256 sellerFee, uint256 buyerFee) {
        sellerFee = _priceInItheum * sellerFeeInPercent / 100;
        buyerFee = _priceInItheum * buyerFeeInPercent / 100;
    }

    function balanceAndAllowanceCheck(address buyer, uint256 amount) view internal returns(bool) {
        // check the balance of $ITHEUM for buyer
        if (itheumToken.balanceOf(buyer) < amount) {
            return false;
        }

        // check the allowance of $ITHEUM for this contract to spend from buyer
        if (itheumToken.allowance(msg.sender, address(this)) < amount) {
            return false;
        }

        return true;
    }
}