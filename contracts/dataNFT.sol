//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ItheumDataNFT is ERC721 {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    ERC20 public itheumToken;

    constructor(ERC20 _itheumToken) ERC721("Itheum Data NFT", "DAFT") {
        itheumToken = _itheumToken;
    }
    
    struct DataNFT {
        uint256 id; // todo I think it's unnecessary to store the NFT id here as well
        uint256 priceInItheum;
        address creator;
        uint8 royaltyInPercent;
        bool transferable;
        string uri;
    }
    
    mapping (uint256 => DataNFT) public dataNFTs;
    
    function createDataNFT(string memory uri, uint256 priceInItheum, uint8 royaltyInPercent) public returns (uint256) {
        require(priceInItheum > 0, "Price must be > 0");
        require(royaltyInPercent <= 100, "Royalty must be <= 100");

        _tokenIds.increment();
        uint256 newNFTId = _tokenIds.current();

        _safeMint(msg.sender, newNFTId);
        
        dataNFTs[newNFTId] = DataNFT(newNFTId, priceInItheum, msg.sender, royaltyInPercent, true, uri);
        
        return newNFTId;
    }

    function setDataNFTPrice(uint256 tokenId, uint256 priceInItheum) public returns (bool) {
        require(priceInItheum > 0, "Price must be > 0");
        require(ownerOf(tokenId) == msg.sender, "Only owner can set the price");

        dataNFTs[tokenId].priceInItheum = priceInItheum;

        return true;
    }

    function setDataNFTTransferable(uint256 tokenId, bool transferable) public returns (bool) {
        require(ownerOf(tokenId) == msg.sender, "Only owner can set transferable");

        dataNFTs[tokenId].transferable = transferable;

        // in case transferable is false, reset approval by setting to address zero
        address addressToApprove = transferable ? address(this) : address(0);
        approve(addressToApprove, tokenId);

        return true;
    }

    function buyDataNFT(uint tokenId) public returns (bool) {
        require(_exists(tokenId), "DataNFT doesn't exist");

        require(dataNFTs[tokenId].transferable, "DataNFT is currently not transferable");
        require(getApproved(tokenId) == address(this), "DataNFT contract must be approved to transfer the NFT");

        uint256 priceInItheum = dataNFTs[tokenId].priceInItheum;
        uint256 royaltyInItheum = priceInItheum * dataNFTs[tokenId].royaltyInPercent / 100;

        // get and check the allowance of $ITHEUM
        uint256 allowance = itheumToken.allowance(msg.sender, address(this));
        require(allowance >= priceInItheum + royaltyInItheum, "Allowance in ITHEUM contract is too low");

        // transfer $ITHEUM to owner and creator
        itheumToken.transferFrom(msg.sender, ownerOf(tokenId), priceInItheum);
        itheumToken.transferFrom(msg.sender, dataNFTs[tokenId].creator, royaltyInItheum);

        // transfer ownership of NFT
        transferFrom(address(this), msg.sender, tokenId);

        // reset transferable
        setDataNFTTransferable(tokenId, false);

        return true;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

        return dataNFTs[tokenId].uri;
    }
}