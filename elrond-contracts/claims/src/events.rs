elrond_wasm::imports!();
elrond_wasm::derive_imports!();

use crate::storage::ClaimType;

#[elrond_wasm::module]
pub trait EventsModule {
    #[event("claimAdded")]
    fn claim_added_event(
        &self,
        #[indexed] address: &ManagedAddress,
        #[indexed] claim_type: &ClaimType,
        amount: BigUint,
    );

    #[event("claimRemoved")]
    fn claim_removed_event(
        &self,
        #[indexed] address: &ManagedAddress,
        #[indexed] claim_type: &ClaimType,
        amount: BigUint,
    );

    #[event("claimCollected")]
    fn claim_collected_event(
        &self,
        #[indexed] address: &ManagedAddress,
        #[indexed] claim_type: &ClaimType,
        amount: BigUint,
    );

    #[event("allClaimsCollected")]
    fn all_claims_collected_event(&self, #[indexed] address: &ManagedAddress, amount: BigUint);
}
