// MedVault Eligibility ZK Circuit - Semaphore V4 Compatible
//
// Proves two things in one proof:
//   1. NULLIFIER  - this (secret, trial) pair hasn't been double-submitted
//   2. RESULT     - the claimed eligibility result is bound to this identity and trial
//
// Hash scheme (matches @semaphore-protocol/identity v4 + poseidon-lite):
//   commitment  = Poseidon([secret])              (internal only, never a public input)
//   nullifier   = Poseidon([scope, secret])        where scope = trial_id
//   result_hash = Poseidon([eligible, scope, secret])
//
// All hashes use the BN254 Poseidon from Noir stdlib, identical to the
// circomlibjs / poseidon-lite implementation used by Semaphore V4.
//
// Private inputs (never revealed on-chain):
//   secret             - Semaphore V4 identity secret (identity.toString() as BigInt)
//   eligibility_result - the actual eligibility decision (true = eligible)
//
// Public inputs (submitted on-chain, verified by HonkVerifier.sol):
//   scope        - trial_id as Field                -> matches the externalNullifier used
//   nullifier    - Poseidon([scope, secret])        -> matches proof.nullifier from Semaphore
//   result_hash  - Poseidon([eligible, scope, secret])

fn main(
    secret: Field,
    eligibility_result: bool,
    scope:       pub Field,
    nullifier:   pub Field,
    result_hash: pub Field,
) {
    // 1. Nullifier - binds this proof uniquely to one (identity, trial) pair
    // Order must match Semaphore V4 circuit: Poseidon([scope, secret])
    let computed_nullifier = std::hash::poseidon::bn254::hash_2([scope, secret]);
    assert(computed_nullifier == nullifier);

    // 2. Result hash - cryptographically binds the eligibility claim to this identity/trial
    let eligible_field: Field = if eligibility_result { 1 } else { 0 };
    let computed_result_hash = std::hash::poseidon::bn254::hash_3([eligible_field, scope, secret]);
    assert(computed_result_hash == result_hash);
}

#[test]
fn test_valid_eligible_proof() {
    let secret: Field = 12345678901234567890;
    let scope:  Field = 1;
    let eligible: bool = true;

    let nullifier   = std::hash::poseidon::bn254::hash_2([scope, secret]);
    let elig_field: Field = if eligible { 1 } else { 0 };
    let result_hash = std::hash::poseidon::bn254::hash_3([elig_field, scope, secret]);

    main(secret, eligible, scope, nullifier, result_hash);
}

#[test]
fn test_valid_ineligible_proof() {
    let secret: Field = 98765432109876543210;
    let scope:  Field = 7;
    let eligible: bool = false;

    let nullifier   = std::hash::poseidon::bn254::hash_2([scope, secret]);
    let elig_field: Field = if eligible { 1 } else { 0 };
    let result_hash = std::hash::poseidon::bn254::hash_3([elig_field, scope, secret]);

    main(secret, eligible, scope, nullifier, result_hash);
}

#[test(should_fail)]
fn test_wrong_secret_fails() {
    let real_secret:   Field = 12345678901234567890;
    let forged_secret: Field = 99999999999999999999;
    let scope: Field = 1;
    let eligible = true;

    // Nullifier from real secret, but proof uses forged secret - must fail
    let nullifier   = std::hash::poseidon::bn254::hash_2([scope, real_secret]);
    let elig_field: Field = 1;
    let result_hash = std::hash::poseidon::bn254::hash_3([elig_field, scope, real_secret]);

    main(forged_secret, eligible, scope, nullifier, result_hash);
}

#[test(should_fail)]
fn test_wrong_result_hash_fails() {
    let secret: Field = 12345678901234567890;
    let scope:  Field = 1;
    let eligible = false;

    let nullifier   = std::hash::poseidon::bn254::hash_2([scope, secret]);

    // result_hash computed for eligible=true but claiming false - must fail
    let wrong_hash = std::hash::poseidon::bn254::hash_3([1, scope, secret]);

    main(secret, eligible, scope, nullifier, wrong_hash);
}
