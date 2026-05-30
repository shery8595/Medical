import type { PatientProfileValues } from "../fhe";

export const ELIGIBLE_PROFILE: PatientProfileValues = {
    age: 30,
    gender: true,
    weight: 70,
    height: 175,
    hasDiabetes: false,
    hbLevel: 140,
    isSmoker: false,
    hasHypertension: false,
};

export const PROFILE_FAIL_AGE: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    age: 10,
};

export const PROFILE_FAIL_DIABETES: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    hasDiabetes: true,
};

export const PROFILE_FAIL_HB: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    hbLevel: 100,
};

export const PROFILE_FAIL_GENDER: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    gender: false,
};

export const PROFILE_FAIL_HEIGHT: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    height: 150,
};

export const PROFILE_FAIL_WEIGHT: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    weight: 120,
};

export const PROFILE_FAIL_SMOKER: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    isSmoker: true,
};

export const PROFILE_FAIL_HYPERTENSION: PatientProfileValues = {
    ...ELIGIBLE_PROFILE,
    hasHypertension: true,
};
