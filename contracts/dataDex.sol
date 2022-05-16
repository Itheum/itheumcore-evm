//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ItheumDataDex {
    
    ERC20 public itheumToken;
    
    struct DataPack {
        address seller;
        bytes32 dataHash;
    }
    
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

    event AdvertiseEvent(string dataPackId, address seller);
    event PurchaseEvent(string dataPackId, address buyer, address seller, uint256 feeInItheum);
    
    // Data Owner advertising a data pack for sale
    function advertiseForSale(string calldata dataPackId, string calldata dataHashStr) external {
        bytes32 dataHash = stringToBytes32(dataHashStr);
        
        dataPacks[dataPackId] = DataPack({
            seller: msg.sender,
            dataHash: dataHash
        });

        // add the personal data proof for quick lookup as well
        personalDataProofs[msg.sender][dataPackId] = dataHash;

        emit AdvertiseEvent(dataPackId, msg.sender);
    }
    
    // A buyer, buying access to a advertised data pack
    function buyDataPack(string calldata dataPackId, uint256 feeInItheum) external payable {
        // require(msg.value == 1 ether, "Amount should be equal to 1 Ether");
        
        uint256 myItheum = itheumToken.balanceOf(msg.sender);
        
        require(myItheum > 0, "You need MYDA to perform this function");
        require(myItheum > feeInItheum, "You dont have sufficient MYDA to proceed");
        
        uint256 allowance = itheumToken.allowance(msg.sender, address(this));
        require(allowance >= feeInItheum, "Check the token allowance");
        
        DataPack memory targetPack = dataPacks[dataPackId];
        
        itheumToken.transferFrom(msg.sender, targetPack.seller, feeInItheum);
        
        accessAllocations[dataPackId].push(msg.sender);

        emit PurchaseEvent(dataPackId, msg.sender, targetPack.seller, feeInItheum);
        
        // payable(targetPack.seller).transfer(1 ether);
    }
    
    // Verifies on-chain hash with off-chain hash as part of datapack purchase or to verify PDP
    function verifyData(string calldata dataPackId, string calldata dataHashStr) external view returns(bool) {
        bytes32 dataHash = stringToBytes32(dataHashStr);
         
        if (dataPacks[dataPackId].dataHash == dataHash) {
            return true; 
        } else {
            return false;
        }
    }
    
    // is an address as owner of a datapack?
    function checkAccess(string calldata dataPackId) public view returns(bool) {
        address[] memory matchedAllocation = accessAllocations[dataPackId];
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
    function getPersonalDataProof(address proofOwner, string calldata dataPackId) external view returns (bytes32) {
        return personalDataProofs[proofOwner][dataPackId];
    }

    // remove a personal data proof (PDP)
    function removePersonalDataProof(string calldata dataPackId) external returns (bool) {
        bytes32 callerOwnedProof = personalDataProofs[msg.sender][dataPackId];

        require(callerOwnedProof.length > 0, "You do not own that personal data proof");

        delete personalDataProofs[msg.sender][dataPackId];

        return true;
    }
    
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
    
        assembly {
            result := mload(add(source, 32))
        }
    }
}