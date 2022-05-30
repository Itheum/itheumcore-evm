#![no_std]

elrond_wasm::imports!();

use crate::storage::ClaimType;

pub mod events;
pub mod storage;
pub mod views;

#[elrond_wasm::contract]
pub trait ClaimsContract:
    storage::StorageModule + events::EventsModule + views::ViewsModule
{
    #[init]
    fn init(&self, token: TokenIdentifier) {
        self.is_paused().set(true);
        self.reward_token().set(&token);
    }

    #[only_owner]
    #[payable("*")]
    #[endpoint(addClaim)]
    fn add_claim(&self, address: &ManagedAddress, claim_type: ClaimType) {
        let (payment_amount, payment_token) = self.call_value().payment_token_pair();
        let current_claim = self.claim(address, &claim_type).get();
        let reward_token = self.reward_token().get();
        require!(
            payment_token == reward_token,
            "Can only add designated token"
        );
        require!(
            payment_amount > BigUint::zero(),
            "Must add more than 0 tokens"
        );
        self.claim(address, &claim_type)
            .set(current_claim + &payment_amount);
        self.claim_added_event(address, &claim_type, payment_amount);
    }

    #[only_owner]
    #[endpoint(removeClaim)]
    fn remove_claim(&self, address: &ManagedAddress, claim_type: ClaimType, amount: BigUint) {
        let current_claim = self.claim(address, &claim_type).get();
        let owner = self.blockchain().get_owner_address();
        let reward_token = self.reward_token().get();
        require!(
            current_claim >= amount,
            "Cannot remove more than current claim"
        );
        self.claim(address, &claim_type)
            .set(current_claim - &amount);
        self.send().direct(&owner, &reward_token, 0, &amount, &[]);
        self.claim_removed_event(address, &claim_type, amount);
    }

    #[endpoint(claim)]
    fn harvest_claim(&self, claim_type: OptionalValue<ClaimType>) {
        let reward_token = self.reward_token().get();
        let caller = self.blockchain().get_caller();
        if let OptionalValue::Some(what_type_to_claim) = claim_type {
            let claim = self.claim(&caller, &what_type_to_claim).get();
            require!(claim > BigUint::zero(), "Cannot claim 0 tokens");
            self.send().direct(&caller, &reward_token, 0, &claim, &[]);
            self.claim(&caller, &what_type_to_claim)
                .set(BigUint::zero());
            self.claim_collected_event(&caller, &what_type_to_claim, claim);
        } else {
            let claim = self.view_claims(&caller);
            require!(claim > BigUint::zero(), "Cannot claim 0 tokens");
            self.send().direct(&caller, &reward_token, 0, &claim, &[]);
            self.claim(&caller, &ClaimType::Reward).set(BigUint::zero());
            self.claim(&caller, &ClaimType::Airdrop)
                .set(BigUint::zero());
            self.claim(&caller, &ClaimType::Allocation)
                .set(BigUint::zero());
            self.all_claims_collected_event(&caller, claim);
        }
    }
}
