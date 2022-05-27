//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ItheumToken.sol";

contract ItheumDataPack {

    event AdvertiseEvent(string indexed dataPackId, address indexed seller, uint256 priceInItheum);
    event PurchaseEvent(string indexed dataPackId, address indexed buyer, address indexed seller, uint256 feeInItheum);
    
    struct DataPack {
        address seller;
        bytes32 dataHash;
        uint256 priceInItheum;
    }

    uint8 public BUYER_FEE_IN_PERCENT = 2;
    uint8 public SELLER_FEE_IN_PERCENT = 2;

    ItheumToken public itheumToken;

    mapping(string => DataPack) public dataPacks;
    
    // dataPackId => address => access
    mapping(string => mapping(address => bool)) private accessAllocations;
    mapping(string => uint) public accessAllocationCount;

    // address[dataPackId] will give you the dataHash (i.e. the proof for the progId reponse)
    // in web2, the dataPackId can link to a web2 storage of related meta (programId + program onbaording link etc)
    // ... this is not an issue, as if web2 was compromised in the end we will compare the result to the dataHash for integrity of the proof
    mapping(address => mapping(string => bytes32)) public personalDataProofs;
    
    constructor(ItheumToken _itheumToken) {
        itheumToken = _itheumToken;
    }
    
    // Data Owner advertising a data pack for sale
    function advertiseForSale(string calldata _dataPackId, string calldata _dataHashStr, uint256 _priceInItheum) external {
        require(dataPacks[_dataPackId].seller == address(0), "Data pack with this id already exists");
        require(bytes(_dataHashStr).length > 0, "Data hash string must exist");
        require(_priceInItheum > 0, "Price in ITHEUM must be greater than zero");

        bytes32 dataHash = stringToBytes32(_dataHashStr);
        
        dataPacks[_dataPackId] = DataPack({
            seller: msg.sender,
            dataHash: dataHash,
            priceInItheum: _priceInItheum
        });

        // add the personal data proof for quick lookup as well
        personalDataProofs[msg.sender][_dataPackId] = dataHash;

        emit AdvertiseEvent(_dataPackId, msg.sender, _priceInItheum);
    }
    
    // A buyer, buying access to a advertised data pack
    function buyDataPack(string calldata _dataPackId) external {
        require(!checkAccess(_dataPackId), "You already have bought this dataPack");

        address dataPackFeeTreasury = itheumToken.dataPackFeeTreasury();

        require(dataPackFeeTreasury != address(0), "Itheum treasury address isn't set");

        DataPack memory dataPack = dataPacks[_dataPackId];

        require(dataPack.seller != address(0), "You can't buy a non-existing data pack");

        uint256 itheumOfBuyer = itheumToken.balanceOf(msg.sender);

        uint256 sellerFee = dataPack.priceInItheum * SELLER_FEE_IN_PERCENT / 100;
        uint256 buyerFee = dataPack.priceInItheum * BUYER_FEE_IN_PERCENT / 100;

        require(itheumOfBuyer >= dataPack.priceInItheum + buyerFee, "You dont have sufficient ITHEUM to proceed");
        
        uint256 allowance = itheumToken.allowance(msg.sender, address(this));
        require(allowance >= dataPack.priceInItheum + buyerFee, "Check the token allowance");
        
        DataPack memory targetPack = dataPacks[_dataPackId];
        
        itheumToken.transferFrom(msg.sender, targetPack.seller, dataPack.priceInItheum - sellerFee);
        itheumToken.transferFrom(msg.sender, dataPackFeeTreasury, sellerFee + buyerFee);

        accessAllocations[_dataPackId][msg.sender] = true;
        accessAllocationCount[_dataPackId]++;

        emit PurchaseEvent(_dataPackId, msg.sender, dataPack.seller, buyerFee + sellerFee);
    }
    
    // Verifies on-chain hash with off-chain hash as part of datapack purchase or to verify PDP
    function verifyData(string calldata _dataPackId, string calldata _dataHashStr) external view returns(bool) {
        bytes32 dataHash = stringToBytes32(_dataHashStr);
         
        return dataPacks[_dataPackId].dataHash == dataHash;
    }
    
    // is an address as owner of a datapack?
    function checkAccess(string calldata dataPackId) public view returns(bool) {
        return accessAllocations[dataPackId][msg.sender];
    }

    // remove a personal data proof (PDP)
    function removePersonalDataProof(string calldata _dataPackId) external returns(bool) {
        delete personalDataProofs[msg.sender][_dataPackId];

        return true;
    }

    function deleteDataPack(string calldata _dataPackId) external returns(bool) {
        require(msg.sender == dataPacks[_dataPackId].seller, "Only seller can delete dataPack");
        require(accessAllocationCount[_dataPackId] == 0, "You only can delete dataPacks with zero access");

        delete dataPacks[_dataPackId];

        return true;
    }
    
    function stringToBytes32(string memory _source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(_source);

        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
    
        assembly {
            result := mload(add(_source, 32))
        }
    }
}