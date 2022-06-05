//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ItheumDataNFT is ERC721 {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    ERC20 public itheumToken;

    event DataNFTCreated(uint256 indexed _tokenId, address indexed _creator, uint8 indexed _royaltyInPercent);
    event DataNFTTraded(uint256 indexed _tokenId, address indexed _from, address indexed _to, uint256 _priceInItheum, address _creator, uint256 _royaltyInItheum);

    constructor(ERC20 _itheumToken) ERC721("Itheum Data NFT", "DAFT") {
        itheumToken = _itheumToken;
    }
    
    struct DataNFT {
        uint256 priceInItheum;
        address creator;
        uint8 royaltyInPercent; // 0-100
        bool transferable; // specifies if dataNFT is tradeable at all
        bool secondaryTradeable; // specifies if dataNFT is tradeable via 'safeTransferFrom' (no $ITHEUM token transfers then)
        string uri;
    }

    // tokenId -> dataNFT
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

        // when a mint takes place, this contract must be allowed
        // to transfer the dataNFT on the owners behalf
        approve(address(this), newNFTId);

        emit DataNFTCreated(newNFTId, msg.sender, _royaltyInPercent);

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

        // in case transferable is true, this contract must be allowed to transfer the dataNFT
        // on the owners behalf; in other case reset approval by setting to address zero
        address addressToApprove = _transferable ? address(this) : address(0);
        approve(addressToApprove, _tokenId);

        return true;
    }

    function setDataNFTSecondaryTradeable(uint256 _tokenId, bool _secondaryTradeable) public returns (bool) {
        require(_dataNFTs[_tokenId].creator == msg.sender, "Only creator can set secondary tradeable");

        _dataNFTs[_tokenId].secondaryTradeable = _secondaryTradeable;

        return true;
    }

    // function is overwritten in order to check for the secondary tradeable flag
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public override {
        safeTransferFrom(_from, _to, _tokenId, "");
    }

    // function is overwritten in order to check for the secondary tradeable flag
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public override {
        require(_dataNFTs[_tokenId].secondaryTradeable, "DataNFT is not set to secondary tradeable");
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "ERC721: transfer caller is not owner nor approved");
        _safeTransfer(_from, _to, _tokenId, _data);
    }

    function buyDataNFT(address _from, address _to, uint256 _tokenId, bytes memory _data) public returns(bool) {
        require(_exists(_tokenId), "DataNFT doesn't exist");
        require(ownerOf(_tokenId) == _from, "'from' and 'ownerOf(tokenId)' doesn't match");

        DataNFT memory dataNFT = _dataNFTs[_tokenId];

        require(dataNFT.transferable, "DataNFT is currently not transferable");
        require(getApproved(_tokenId) == address(this), "DataNFT contract must be approved to transfer the NFT");

        uint256 priceInItheum = dataNFT.priceInItheum;
        uint256 royaltyInItheum = priceInItheum * dataNFT.royaltyInPercent / 100;

        // check the balance of $ITHEUM for buyer
        uint256 balance = itheumToken.balanceOf(_to);
        require(balance >= priceInItheum + royaltyInItheum, "You don't have sufficient ITHEUM to proceed");

        // check the allowance of $ITHEUM for this contract to spend from buyer
        uint256 allowance = itheumToken.allowance(_to, address(this));
        require(allowance >= priceInItheum + royaltyInItheum, "Allowance in ITHEUM contract is too low");

        // transfer $ITHEUM to owner and creator
        itheumToken.transferFrom(_to, _from, priceInItheum);
        itheumToken.transferFrom(_to, dataNFT.creator, royaltyInItheum);

        // transfer ownership of NFT
        _safeTransfer(_from, _to, _tokenId, _data);

        // reset transferable for new owner, otherwise another
        // use would be able to buy immediately
        setDataNFTTransferable(_tokenId, false);

        emit DataNFTTraded(_tokenId, _from, _to, priceInItheum, dataNFT.creator, royaltyInItheum);

        return true;
    }

    // function is overwritten in order to pride the URI to the dataset
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "ERC721URIStorage: URI query for nonexistent token");

        return _dataNFTs[_tokenId].uri;
    }
}