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
    #[payable("*")]
    #[endpoint(addClaims)]
    fn add_claims(
        &self,
        claims: MultiValueEncoded<MultiValue3<ManagedAddress, ClaimType, BigUint>>,
    ) {
        let (payment_amount, payment_token) = self.call_value().payment_token_pair();
        let reward_token = self.reward_token().get();
        require!(
            payment_token == reward_token,
            "Can only add designated token"
        );
        require!(
            payment_amount > BigUint::zero(),
            "Must add more than 0 tokens"
        );
        let mut sum_of_claims = BigUint::zero();
        for item in claims.into_iter() {
            let tuple = item.into_tuple();
            let current_claim = self.claim(&tuple.0, &tuple.1).get();
            self.claim(&tuple.0, &tuple.1).set(current_claim + &tuple.2);
            sum_of_claims += &tuple.2;
            self.claim_added_event(&tuple.0, &tuple.1, tuple.2);
        }
        require!(
            sum_of_claims == payment_amount,
            "Claims added must equal payment amount"
        );
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

    #[only_owner]
    #[endpoint(removeClaims)]
    fn remove_claims(
        &self,
        claims: MultiValueEncoded<MultiValue3<ManagedAddress, ClaimType, BigUint>>,
    ) {
        let mut sum_of_claims = BigUint::zero();
        for item in claims.into_iter() {
            let tuple = item.into_tuple();
            let current_claim = self.claim(&tuple.0, &tuple.1).get();
            require!(
                current_claim >= tuple.2,
                "Cannot remove more than current claim"
            );
            sum_of_claims += &tuple.2;
            self.claim(&tuple.0, &tuple.1).set(current_claim - &tuple.2);
            self.claim_removed_event(&tuple.0, &tuple.1, tuple.2);
        }
        require!(
            sum_of_claims > BigUint::zero(),
            "Claims removed must be greater than 0"
        );
        let owner = self.blockchain().get_owner_address();
        let reward_token = self.reward_token().get();
        self.send()
            .direct(&owner, &reward_token, 0, &sum_of_claims, &[]);
    }

    #[endpoint(claim)]
    fn harvest_claim(&self, claim_type: OptionalValue<ClaimType>) {
        let reward_token = self.reward_token().get();
        let caller = self.blockchain().get_caller();
        require!(!self.is_paused().get(), "Contract is paused");
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
