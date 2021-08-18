//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ItheumDataNFTMatic is ERC721 {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    constructor() ERC721("Itheum Data NFT", "mDAFT") {}
    
    struct DataNFT {
        uint256 id;
        address creator;
        string uri;
    }
    
    mapping (uint256 => DataNFT) public dataNFTs;
    
    function createDataNFT(string memory uri) public returns (uint256) {
        _tokenIds.increment();
        uint256 newNFTId = _tokenIds.current();
        _safeMint(msg.sender, newNFTId);
        
        dataNFTs[newNFTId] = DataNFT(newNFTId, msg.sender, uri);
        
        return newNFTId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

        return dataNFTs[tokenId].uri;
    }
}