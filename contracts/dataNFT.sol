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
        uint256 priceInItheum;
        address creator;
        uint8 royaltyInPercent;
        bool transferable;
        bool secondaryTradeable;
        string uri;
    }
    
    mapping (uint256 => DataNFT) private _dataNFTs;

    function dataNFTs(uint256 _tokenId) public view returns (DataNFT memory) {
        require(_exists(_tokenId), "DataNFT doesn't exist");
        return _dataNFTs[_tokenId];
    }
    
    function createDataNFT(
        string memory _uri,
        uint256 _priceInItheum,
        uint8 _royaltyInPercent,
        bool _secondaryTradeable)
    public returns (bool) {
        require(_priceInItheum > 0, "Price must be > 0");
        require(_royaltyInPercent <= 100, "Royalty must be <= 100");

        _tokenIds.increment();
        uint256 newNFTId = _tokenIds.current();

        _safeMint(msg.sender, newNFTId);
        
        _dataNFTs[newNFTId] = DataNFT({
            priceInItheum: _priceInItheum,
            creator: msg.sender,
            royaltyInPercent: _royaltyInPercent,
            transferable: true,
            secondaryTradeable: _secondaryTradeable,
            uri: _uri
        });

        approve(address(this), newNFTId);
        
        return true;
    }

    function setDataNFTPrice(uint256 _tokenId, uint256 _priceInItheum) public returns (bool) {
        require(_priceInItheum > 0, "Price must be > 0");
        require(ownerOf(_tokenId) == msg.sender, "Only owner can set the price");

        _dataNFTs[_tokenId].priceInItheum = _priceInItheum;

        return true;
    }

    function setDataNFTTransferable(uint256 _tokenId, bool _transferable) public returns (bool) {
        require(ownerOf(_tokenId) == msg.sender, "Only owner can set transferable");

        _dataNFTs[_tokenId].transferable = _transferable;

        // in case transferable is false, reset approval by setting to address zero
        address addressToApprove = _transferable ? address(this) : address(0);
        approve(addressToApprove, _tokenId);

        return true;
    }

    function setDataNFTSecondaryTradeable(uint256 _tokenId, bool _secondaryTradeable) public returns (bool) {
        require(_dataNFTs[_tokenId].creator == msg.sender, "Only creator can set secondary tradeable");

        _dataNFTs[_tokenId].secondaryTradeable = _secondaryTradeable;

        return true;
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public virtual override {
        safeTransferFrom(_from, _to, _tokenId, "");
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public virtual override {
        require(_dataNFTs[_tokenId].secondaryTradeable, "DataNFT is not set to secondary tradeable");
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "ERC721: transfer caller is not owner nor approved");
        _safeTransfer(_from, _to, _tokenId, _data);
    }

    function buyDataNFT(address _from, address _to, uint256 _tokenId, bytes memory _data) public returns(bool) {
        require(_exists(_tokenId), "DataNFT doesn't exist");
        require(ownerOf(_tokenId) == _from, "'from' and 'ownerOf(tokenId)' doesn't match");

        require(_dataNFTs[_tokenId].transferable, "DataNFT is currently not transferable");
        require(getApproved(_tokenId) == address(this), "DataNFT contract must be approved to transfer the NFT");

        uint256 priceInItheum = _dataNFTs[_tokenId].priceInItheum;
        uint256 royaltyInItheum = priceInItheum * _dataNFTs[_tokenId].royaltyInPercent / 100;

        // get and check the allowance of $ITHEUM
        uint256 allowance = itheumToken.allowance(_to, address(this));
        require(allowance >= priceInItheum + royaltyInItheum, "Allowance in ITHEUM contract is too low");

        // transfer $ITHEUM to owner and creator
        itheumToken.transferFrom(_to, _from, priceInItheum);
        itheumToken.transferFrom(_to, _dataNFTs[_tokenId].creator, royaltyInItheum);

        // transfer ownership of NFT
        _safeTransfer(_from, _to, _tokenId, _data);

        // reset transferable
        setDataNFTTransferable(_tokenId, false);

        return true;
    }
    
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "ERC721URIStorage: URI query for nonexistent token");

        return _dataNFTs[_tokenId].uri;
    }
}