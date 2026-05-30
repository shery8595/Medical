/**
 * MVP FHIR R4 importer: maps a small Patient + Observation (+ optional Condition) bundle
 * into MedVault plaintext profile fields used by PatientRecordForm.
 */

export type FhirMappedProfile = {
  age?: number;
  /** male / female mapped from administrative gender where present */
  gender?: "male" | "female";
  weightKg?: number;
  heightCm?: number;
  hasDiabetes?: boolean;
  hbApprox?: number;
  /** true if Observation indicates smoker */
  isSmoker?: boolean;
  /** true if observation / condition mentions hypertension */
  hasHypertension?: boolean;
};

export type FhirImportIssue = {
  path: string;
  message: string;
};

export type FhirImportResult =
  | { ok: true; profile: FhirMappedProfile; issues: FhirImportIssue[] }
  | { ok: false; issues: FhirImportIssue[] };

const HBA1C_LOINC = new Set(["4548-4", "33747-0", "71875-9", "59261-8", "17856-6"]);
const HBA1C_SNOMED = new Set(["43396009"]);

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

/** Age from birthDate (yyyy or yyyy-mm-dd). */
export function ageFromBirthDate(birthDate: string): number | undefined {
  const y = /^(\d{4})(?:-\d{2}-\d{2})?$/.exec(birthDate.trim());
  if (!y) return undefined;
  const born = Number(y[1]);
  const now = new Date().getUTCFullYear();
  if (!Number.isFinite(born) || born < 1900 || born > now) return undefined;
  return Math.max(1, now - born);
}

function numericQuantity(q: Record<string, unknown>): number | undefined {
  const v = q.value;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return undefined;
}

function obsHbValue(entry: Record<string, unknown>): number | undefined {
  const resource = asRecord(entry.resource);
  if (!resource || resource.resourceType !== "Observation") return undefined;
  const code = asRecord(resource.code);
  const codings = Array.isArray(code?.coding) ? code.coding : [];
  let isHb = false;
  for (const c of codings) {
    const cr = asRecord(c);
    const sys = readString(cr ?? {}, "system")?.toLowerCase() ?? "";
    const cod = readString(cr ?? {}, "code");
    if (!cod) continue;
    if (sys.includes("loinc") && HBA1C_LOINC.has(cod)) isHb = true;
    if (sys.includes("snomed") && HBA1C_SNOMED.has(cod)) isHb = true;
  }
  const text = typeof code?.text === "string" ? code.text.toLowerCase() : "";
  if (!isHb && (text.includes("hba1c") || text.includes("a1c") || text.includes("glycated"))) {
    isHb = true;
  }
  if (!isHb) return undefined;

  const vqm = resource.valueQuantity;
  const vq = asRecord(vqm);
  if (!vq) return undefined;
  const val = numericQuantity(vq);
  const unit = (readString(vq, "unit") || readString(vq, "code") || "").toLowerCase();

  if (val == null || !Number.isFinite(val)) return undefined;
  // mmol/mol (~20–180) vs % (~4–20)
  if (unit.includes("mmol") || val > 30) {
    return Math.round((val - 2.152) / 0.09148);
  }
  return Math.round(val * 10);
}

function diabetesFromConditions(entries: Record<string, unknown>[]): boolean {
  for (const e of entries) {
    const resource = asRecord(e.resource);
    if (!resource || resource.resourceType !== "Condition") continue;
    const code = asRecord(resource.code);
    const codings = Array.isArray(code?.coding) ? code.coding : [];
    const text = typeof code?.text === "string" ? code.text.toLowerCase() : "";
    if (text.includes("diabetes") || text.includes("e11")) return true;
    for (const c of codings) {
      const cr = asRecord(c);
      const cod = readString(cr ?? {}, "code") ?? "";
      if (cod.startsWith("E11") || cod === "73211009" || cod === "44054006") return true;
    }
  }
  return false;
}

/** Parse JSON Bundle or loose array of FHIR-ish resources */
export function importFhirJson(text: string): FhirImportResult {
  let root: unknown;
  try {
    root = JSON.parse(text) as unknown;
  } catch {
    return {
      ok: false,
      issues: [{ path: "$", message: "Invalid JSON — check that the file is valid UTF-8 JSON." }],
    };
  }

  const issues: FhirImportIssue[] = [];
  let entries: Record<string, unknown>[] = [];

  const rootObj = asRecord(root);
  if (rootObj?.resourceType === "Bundle" && Array.isArray(rootObj.entry)) {
    entries = rootObj.entry.map((x) => asRecord(x) ?? {}).filter((x) => Object.keys(x).length > 0);
  } else if (rootObj?.resourceType && rootObj.entry == null && rootObj.resourceType !== "Patient") {
    entries = [{ resource: rootObj }];
  } else if (Array.isArray(root)) {
    entries = root.map((x) => ({ resource: x }));
  }

  const profile: FhirMappedProfile = {};

  let patientRes: Record<string, unknown> | null = null;
  for (const e of entries) {
    const r = asRecord(e.resource);
    if (r?.resourceType === "Patient") {
      patientRes = r;
      break;
    }
  }

  if (patientRes) {
    const bd = readString(patientRes, "birthDate");
    if (bd) {
      const age = ageFromBirthDate(bd);
      if (age != null) profile.age = age;
      else issues.push({ path: "Patient.birthDate", message: `Could not derive age from birthDate "${bd}".` });
    } else {
      issues.push({
        path: "Patient.birthDate",
        message: "Patient.birthDate is missing — age cannot be derived automatically.",
      });
    }

    const g = readString(patientRes, "gender")?.toLowerCase();
    if (g === "male" || g === "female") profile.gender = g;
    else if (g === "unknown" || g === "other")
      issues.push({ path: "Patient.gender", message: `Gender "${g}" is not mapped — select male/female manually.` });

    /** Optional body weight Observation in bundle entries */
    for (const e of entries) {
      const resource = asRecord(e.resource);
      if (!resource || resource.resourceType !== "Observation") continue;
      const code = asRecord(resource.code);
      const text = typeof code?.text === "string" ? code.text.toLowerCase() : "";
      const codings = Array.isArray(code?.coding) ? code.coding : [];
      let isWeight = text.includes("weight") || text.includes("body mass");
      for (const c of codings) {
        const cr = asRecord(c);
        const cod = readString(cr ?? {}, "code") ?? "";
        if (cod === "29463-7") isWeight = true;
      }
      if (!isWeight) continue;
      const vq = asRecord(resource.valueQuantity);
      if (!vq) continue;
      const val = numericQuantity(vq);
      const unit = (readString(vq, "unit") || readString(vq, "code") || "").toLowerCase();
      if (val == null) continue;
      if (unit.includes("[lb_us]") || unit.includes("lb")) profile.weightKg = Math.round(val * 0.453592 * 10) / 10;
      else profile.weightKg = Math.round(val * 10) / 10;
      break;
    }

    /** Optional height Observation */
    for (const e of entries) {
      const resource = asRecord(e.resource);
      if (!resource || resource.resourceType !== "Observation") continue;
      const code = asRecord(resource.code);
      const text = typeof code?.text === "string" ? code.text.toLowerCase() : "";
      const codings = Array.isArray(code?.coding) ? code.coding : [];
      let isHeight = text.includes("height") || text.includes("stature");
      for (const c of codings) {
        const cr = asRecord(c);
        const cod = readString(cr ?? {}, "code") ?? "";
        if (cod === "8302-2") isHeight = true;
      }
      if (!isHeight) continue;
      const vq = asRecord(resource.valueQuantity);
      if (!vq) continue;
      const val = numericQuantity(vq);
      const unit = (readString(vq, "unit") || readString(vq, "code") || "").toLowerCase();
      if (val == null) continue;
      if (unit.includes("in") || unit.includes("[in_i]")) profile.heightCm = Math.round(val * 2.54);
      else profile.heightCm = Math.round(val);
      break;
    }
  }

  let hbObs: number | undefined;
  for (const e of entries) {
    const hb = obsHbValue(e);
    if (hb != null) {
      hbObs = hb;
      break;
    }
  }
  if (hbObs != null) profile.hbApprox = hbObs;

  if (diabetesFromConditions(entries)) profile.hasDiabetes = true;

  /** Smoking status (optional) */
  for (const e of entries) {
    const resource = asRecord(e.resource);
    if (!resource || resource.resourceType !== "Observation") continue;
    const code = asRecord(resource.code);
    const codings = Array.isArray(code?.coding) ? code.coding : [];
    for (const c of codings) {
      const cr = asRecord(c);
      if (readString(cr ?? {}, "code") === "72166-2") {
        const cv = resource.valueCodeableConcept as unknown;
        const cc = asRecord(cv);
        const inner = Array.isArray(cc?.coding) ? cc.coding : [];
        for (const x of inner) {
          const xr = asRecord(x);
          const codeVal = readString(xr ?? {}, "code") ?? "";
          if (
            codeVal === "8517006" ||
            codeVal === "449868002" ||
            codeVal === "77176002" ||
            codeVal === "266919005"
          ) {
            profile.isSmoker = true;
          }
        }
        const disp = typeof cc?.text === "string" ? cc.text.toLowerCase() : "";
        if (disp.includes("never") || disp.includes("non-smok")) profile.isSmoker = false;
        else if (disp.includes("smoker") || disp.includes("tobacco")) profile.isSmoker = true;
      }
    }
  }

  /** Hypertension / BP high */
  for (const e of entries) {
    const resource = asRecord(e.resource);
    if (!resource || resource.resourceType !== "Condition") continue;
    const code = asRecord(resource.code);
    const text = typeof code?.text === "string" ? code.text.toLowerCase() : "";
    if (text.includes("hypertension") || text.includes("high blood pressure")) profile.hasHypertension = true;
  }

  if (!patientRes) {
    issues.unshift({
      path: "Bundle.entry",
      message:
        'No Patient resource found. MVP import expects at least one resource with `"resourceType": "Patient"` (inside a FHIR Bundle or as a standalone resource).',
    });
    return { ok: false, issues };
  }

  if (profile.age == null || profile.gender == null || profile.hbApprox == null) {
    issues.push({
      path: "$",
      message:
        "Missing age, biological sex marker, or HbA1c-related observation — complete those fields manually before encrypting.",
    });
  }

  return { ok: true, profile, issues };
}
