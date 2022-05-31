//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./dataDex.sol";
import "./SharedStructs.sol";

contract ItheumDataNFT is Initializable, ERC721Upgradeable {
    
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIds;

    event DataNFTCreated(uint256 indexed _tokenId, address indexed _creator, uint8 indexed _royaltyInPercent);
    event DataNFTTraded(uint256 indexed _tokenId, address indexed _from, address indexed _to, uint256 _priceInItheum, address _creator, uint256 _royaltyInItheum);

    DataDex public dataDex;

    modifier onlyDataDex() {
        require(msg.sender == address(dataDex), 'Trades are only possible via DataDex');
        _;
    }

    function initialize(DataDex _dataDex) public initializer {
        __ERC721_init("Itheum Data NFT", "DAFT");

        dataDex = _dataDex;
    }

    // tokenId -> dataNFT
    mapping (uint256 => SharedStructs.DataNFT) private _dataNFTs;

    function dataNFTs(uint256 _tokenId) public view returns (SharedStructs.DataNFT memory) {
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
        
        _dataNFTs[newNFTId] = SharedStructs.DataNFT({
            priceInItheum: _priceInItheum,
            creator: msg.sender,
            royaltyInPercent: _royaltyInPercent,
            transferable: true,
            secondaryTradeable: _secondaryTradeable,
            uri: _uri
        });

        // when a mint takes place, this contract must be allowed
        // to transfer the dataNFT on the owners behalf
        approve(address(dataDex), newNFTId);

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
        require(ownerOf(_tokenId) == tx.origin, "Only owner can set transferable");

        _dataNFTs[_tokenId].transferable = _transferable;

        // in case transferable is true, this contract must be allowed to transfer the dataNFT
        // on the owners behalf; in other case reset approval by setting to address zero
        address addressToApprove = _transferable ? address(dataDex) : address(0);
        _approve(addressToApprove, _tokenId);

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

    function buyDataNFT(uint256 _tokenId, address _buyer, uint256 _priceInItheum, uint256 _royaltyInItheum, bytes memory _data) public onlyDataDex returns(bool) {
        address from = ownerOf(_tokenId);

        SharedStructs.DataNFT memory dataNFT = _dataNFTs[_tokenId];

        // transfer ownership of NFT
        _safeTransfer(from, _buyer, _tokenId, _data);

        // reset transferable for new owner, otherwise another
        // use would be able to buy immediately
        setDataNFTTransferable(_tokenId, false);

        emit DataNFTTraded(_tokenId, from, _buyer, _priceInItheum, dataNFT.creator, _royaltyInItheum);

        return true;
    }

    // function is overwritten in order to pride the URI to the dataset
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "ERC721URIStorage: URI query for nonexistent token");

        return _dataNFTs[_tokenId].uri;
    }
}