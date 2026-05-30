// MedVault Eligibility ZK Circuit - Semaphore V4 Compatible
//
// Proves two things in one proof:
//   1. NULLIFIER  - binds to the Semaphore application nullifier for this trial
//   2. RESULT     - the claimed eligibility result is bound to this identity and trial
//
// Hash scheme (matches @semaphore-protocol/identity v4 + poseidon-lite via noir-lang/poseidon):
//   nullifier   = Poseidon([scope_internal, secret])  where scope_internal = keccak256(trial_id)
//   result_hash = Poseidon([eligible, scope, secret]) where scope = trial_id (public)

use poseidon::poseidon::bn254;
//
// Private inputs (never revealed on-chain):
//   secret, scope_internal, eligibility_result
//
// Public inputs (submitted on-chain, verified by HonkVerifier.sol):
//   scope        - trial_id as Field
//   nullifier    - Semaphore proof.nullifier
//   result_hash  - Poseidon([eligible, scope, secret])
//   eligible     - eligibility bit (0 or 1 Field)

fn main(
    secret: Field,
    scope_internal: Field,
    eligibility_result: bool,
    scope:       pub Field,
    nullifier:   pub Field,
    result_hash: pub Field,
    eligible:    pub Field,
) {
    let eligible_field: Field = if eligibility_result { 1 } else { 0 };
    assert(eligible == eligible_field);

    // 1. Nullifier - must match Semaphore V4: Poseidon([hash(scope), secret])
    let computed_nullifier = bn254::hash_2([scope_internal, secret]);
    assert(computed_nullifier == nullifier);

    // 2. Result hash - binds eligibility to raw trial_id (public scope)
    let computed_result_hash = bn254::hash_3([eligible_field, scope, secret]);
    assert(computed_result_hash == result_hash);
}

#[test]
fn test_valid_eligible_proof() {
    let secret: Field = 12345678901234567890;
    let scope: Field = 1;
    let scope_internal: Field = 42;
    let eligible: bool = true;

    let nullifier = bn254::hash_2([scope_internal, secret]);
    let elig_field: Field = if eligible { 1 } else { 0 };
    let result_hash = bn254::hash_3([elig_field, scope, secret]);

    main(secret, scope_internal, eligible, scope, nullifier, result_hash, elig_field);
}

#[test]
fn test_valid_ineligible_proof() {
    let secret: Field = 98765432109876543210;
    let scope: Field = 7;
    let scope_internal: Field = 99;
    let eligible: bool = false;

    let nullifier = bn254::hash_2([scope_internal, secret]);
    let elig_field: Field = if eligible { 1 } else { 0 };
    let result_hash = bn254::hash_3([elig_field, scope, secret]);

    main(secret, scope_internal, eligible, scope, nullifier, result_hash, elig_field);
}

#[test(should_fail)]
fn test_wrong_secret_fails() {
    let real_secret: Field = 12345678901234567890;
    let forged_secret: Field = 99999999999999999999;
    let scope: Field = 1;
    let scope_internal: Field = 42;
    let eligible = true;

    let nullifier = bn254::hash_2([scope_internal, real_secret]);
    let elig_field: Field = 1;
    let result_hash = bn254::hash_3([elig_field, scope, real_secret]);

    main(forged_secret, scope_internal, eligible, scope, nullifier, result_hash, elig_field);
}

#[test(should_fail)]
fn test_wrong_result_hash_fails() {
    let secret: Field = 12345678901234567890;
    let scope: Field = 1;
    let scope_internal: Field = 42;
    let eligible = false;

    let nullifier = bn254::hash_2([scope_internal, secret]);
    let wrong_hash = bn254::hash_3([1, scope, secret]);

    main(secret, scope_internal, eligible, scope, nullifier, wrong_hash, 0);
}
