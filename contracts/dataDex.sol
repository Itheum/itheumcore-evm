//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ItheumDataDex is Ownable {

    event AdvertiseEvent(string indexed dataPackId, address indexed seller, uint256 priceInItheum);
    event PurchaseEvent(string indexed dataPackId, address indexed buyer, address indexed seller, uint256 feeInItheum);
    
    struct DataPack {
        address seller;
        bytes32 dataHash;
        uint256 priceInItheum;
    }

    uint8 public BUYER_FEE_IN_PERCENT = 2;
    uint8 public SELLER_FEE_IN_PERCENT = 2;

    ERC20 public itheumToken;

    address public itheumTreasury;

    mapping(string => DataPack) public dataPacks;
    
    // list of addresses that has access to a dataPackId
    mapping(string => address[]) private accessAllocations;

    // address[dataPackId] will give you the dataHash (i.e. the proof for the progId reponse)
    // in web2, the dataPackId can link to a web2 storage of related meta (programId + program onbaording link etc)
    // ... this is not an issue, as if web2 was compromised in the end we will compare the result to the dataHash for integrity of the proof
    mapping(address => mapping(string => bytes32)) private personalDataProofs;
    
    constructor(ERC20 _itheumToken) {
        itheumToken = _itheumToken;
    }

    function setItheumTreasury(address _address) external onlyOwner returns(bool) {
        itheumTreasury = _address;

        return true;
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
        DataPack memory dataPack = dataPacks[_dataPackId];

        require(dataPack.seller != address(0), "You can't buy a non-existing data pack");

        uint256 itheumOfBuyer = itheumToken.balanceOf(msg.sender);

        uint256 sellerFee = dataPack.priceInItheum * SELLER_FEE_IN_PERCENT / 100;
        uint256 buyerFee = dataPack.priceInItheum * BUYER_FEE_IN_PERCENT / 100;

        require(itheumOfBuyer >= dataPack.priceInItheum + buyerFee, "You dont have sufficient ITHEUM to proceed");
        
        uint256 allowance = itheumToken.allowance(msg.sender, address(this));
        require(allowance >= buyerFee, "Check the token allowance");

        itheumToken.transferFrom(msg.sender, itheumTreasury, buyerFee + sellerFee);
        itheumToken.transferFrom(msg.sender, dataPack.seller, dataPack.priceInItheum - sellerFee);

        accessAllocations[_dataPackId].push(msg.sender);

        emit PurchaseEvent(_dataPackId, msg.sender, dataPack.seller, buyerFee + sellerFee);
    }
    
    // Verifies on-chain hash with off-chain hash as part of datapack purchase or to verify PDP
    function verifyData(string calldata _dataPackId, string calldata _dataHashStr) external view returns(bool) {
        bytes32 dataHash = stringToBytes32(_dataHashStr);
         
        if (dataPacks[_dataPackId].dataHash == dataHash) {
            return true; 
        } else {
            return false;
        }
    }
    
    // is an address as owner of a datapack?
    function checkAccess(string calldata _dataPackId) public view returns(bool) {
        address[] memory matchedAllocation = accessAllocations[_dataPackId];
        bool hasAccess = false;
        
        for (uint i=0; i < matchedAllocation.length; i++) {
            if (msg.sender == matchedAllocation[i]) {
                hasAccess = true;
                break;
            }
            
        }
        
        return hasAccess;
    }

    // get a personal data proof (PDP)
    function getPersonalDataProof(address _proofOwner, string calldata _dataPackId) external view returns (bytes32) {
        return personalDataProofs[_proofOwner][_dataPackId];
    }

    // remove a personal data proof (PDP)
    function removePersonalDataProof(string calldata _dataPackId) external returns (bool) {
        bytes32 callerOwnedProof = personalDataProofs[msg.sender][_dataPackId];

        require(callerOwnedProof.length > 0, "You do not own that personal data proof");

        delete personalDataProofs[msg.sender][_dataPackId];

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