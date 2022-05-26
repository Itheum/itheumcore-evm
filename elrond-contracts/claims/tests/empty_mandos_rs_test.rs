use elrond_wasm_debug::*;

fn world() -> BlockchainMock {
    let mut blockchain = BlockchainMock::new();

    blockchain.register_contract_builder("file:output/claims.wasm", claims::ContractBuilder);
    blockchain
}

#[test]
fn claims_rs() {
    elrond_wasm_debug::mandos_rs("mandos/claims.scen.json", world());
}
