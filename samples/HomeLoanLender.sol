pragma solidity >=0.7.0 <0.9.0;

import "@itheumcore/contracts/src/v0.1/interfaces/DataProofsV1Interface.sol";

contract HomeloanLender {

    DataProofsV1Interface internal personalDataProof;
    
    /**
     * the itheum core program that collects the "personal data proof"
     * e.g. think of it as a "loan application form" for personal data required to make a loan approval decision
     */
    bytes32 internal proofSource;
    

    /**
     * Network: Ropsten
     * Data Proof Type: Personal Data Proofs
     * Address: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
     */
    constructor() public {
        personalDataProof = DataProofsV1Interface(0x5FC8d32690cc91D4c39d9d3abcBD16989F875707);
    }
    
    /**
     * the Homeloan Lender uses the "Itheum Data Collection and analytics tools" to create the "loan application form" 
     * and sets the proofSource here - which is a pointer to the data collected direct from an applicant
     */
    function setProofSource(bytes32 memory proofSourceId) public returns (boolean) {
        proofSource = proofSourceId;
        
        return true;
    }

    /**
     * The fontend lending DAPP, asks the applicant to complete the itheum "proofSource program" as part of their loan application
     * the results are shared via the user and "attested" to be true - after which the proof is put on-chain and linked to an applicant's address
     * this method is the final step to verify the attested proof before a DAO decision to approve / reject loan
     */
    function verifyProofBeforeDecision(address applicant, bytes32 memory dappEntryProof) public view returns (boolean) {
        (
            boolean isVerified
        ) = personalDataProof.verifyProof(proofSource, applicant, dappEntryProof);
        
        /**
         * if isVerified = 
         * true: result is by applicant and untampered 
         * false: result tampered or user has not yet completed the application form (proofSource program) - so application not ready to proceed to next step
         */
        return isVerified;
    }
}