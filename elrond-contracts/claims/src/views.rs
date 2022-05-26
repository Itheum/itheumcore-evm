elrond_wasm::imports!();
elrond_wasm::derive_imports!();

use crate::storage::ClaimType;

#[elrond_wasm::module]
pub trait ViewsModule: crate::storage::StorageModule {
    #[view(viewClaims)]
    fn view_claims(&self, address: &ManagedAddress) -> BigUint {
        let mut claim = BigUint::zero();
        claim += self.claim(address, &ClaimType::Reward).get();
        claim += self.claim(address, &ClaimType::Airdrop).get();
        claim += self.claim(address, &ClaimType::Allocation).get();
        claim
    }
}
