# Demo fixtures

## `sponsor-medvault-demo-protocol.pdf`

Sample sponsor **protocol PDF** for testing trial creation at `/sponsor/trials/create` (step 1: **Upload protocol PDF**).

### Expected AI extraction (heuristic / LLM)

| Field | Expected value |
|-------|----------------|
| minAge | 25 |
| maxAge | 60 |
| requiresDiabetes | true |
| minHb | 11 |
| genderRequirement | 2 (female only) |
| minHeight | 155 |
| maxWeight | 100 |
| requiresNonSmoker | true |
| requiresNormalBP | true |

Includes fake PHI (name, email, phone, MRN) to exercise the redaction banner before submit.

### Regenerate

```bash
node scripts/generate-demo-protocol-pdf.mjs
```

Requires `pdf-lib` (install once: `npm install pdf-lib --no-save`).

The generator saves with `useObjectStreams: false` so `pdf-parse` in the AI service can read the file. Older copies of this fixture may need regeneration.

### Requirements

- AI service running (`docker compose --profile ai up` or `cd ai-service && npm start`)
- `VITE_AI_SERVICE_URL` set (dev default: `/ai-service` via Vite proxy)
