//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./dataDex.sol";
import "./SharedStructs.sol";

contract ItheumDataPack is Initializable {

    event AdvertiseEvent(string indexed dataPackId, address indexed seller, uint256 priceInItheum);
    event PurchaseEvent(string indexed dataPackId, address indexed buyer, address indexed seller, uint256 priceInItheum);

    DataDex public dataDex;

    mapping(string => SharedStructs.DataPack) public dataPacks;
    
    // dataPackId => address => access
    mapping(string => mapping(address => bool)) private accessAllocations;
    mapping(string => uint) public accessAllocationCount;

    // address[dataPackId] will give you the dataHash (i.e. the proof for the progId reponse)
    // in web2, the dataPackId can link to a web2 storage of related meta (programId + program onbaording link etc)
    // ... this is not an issue, as if web2 was compromised in the end we will compare the result to the dataHash for integrity of the proof
    mapping(address => mapping(string => bytes32)) public personalDataProofs;

    modifier onlyDataDex() {
        require(msg.sender == address(dataDex), 'Trades are only possible via DataDex');
        _;
    }

    function initialize(DataDex _dataDex) public initializer {
        dataDex = _dataDex;
    }
    
    // Data Owner advertising a data pack for sale
    function advertiseForSale(string calldata _dataPackId, string calldata _dataHashStr, uint256 _priceInItheum) external {
        require(dataPacks[_dataPackId].seller == address(0), "Data pack with this id already exists");
        require(bytes(_dataHashStr).length > 0, "Data hash string must exist");
        require(_priceInItheum > 0, "Price in ITHEUM must be greater than zero");

        bytes32 dataHash = stringToBytes32(_dataHashStr);
        
        dataPacks[_dataPackId] = SharedStructs.DataPack({
            seller: msg.sender,
            dataHash: dataHash,
            priceInItheum: _priceInItheum
        });

        // add the personal data proof for quick lookup as well
        personalDataProofs[msg.sender][_dataPackId] = dataHash;

        emit AdvertiseEvent(_dataPackId, msg.sender, _priceInItheum);
    }
    
    // A buyer, buying access to a advertised data pack
    function buyDataPack(string calldata _dataPackId, address _buyer, uint256 _priceInItheum) external onlyDataDex {
        accessAllocations[_dataPackId][_buyer] = true;
        accessAllocationCount[_dataPackId]++;

        emit PurchaseEvent(_dataPackId, _buyer, dataPacks[_dataPackId].seller, _priceInItheum);
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