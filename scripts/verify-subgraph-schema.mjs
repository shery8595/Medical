const url =
    process.env.VITE_SUBGRAPH_URL ||
    "https://api.studio.thegraph.com/query/1742459/medvault-final/v0.1.1";

const query = `{
  __type(name: "AnonymousSubmission") {
    fields { name }
  }
}`;

const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
});
const json = await res.json();
if (json.errors?.length) {
    console.error("GraphQL errors:", json.errors);
    process.exit(1);
}
const names = json.data.__type.fields.map((f) => f.name);
const required = [
    "fhePropensityCommittedAt",
    "noirCertified",
    "noirEligible",
    "noirCertifiedAt",
];
const missing = required.filter((f) => !names.includes(f));
if (missing.length) {
    console.error("Missing fields on AnonymousSubmission:", missing);
    process.exit(1);
}
console.log("OK:", url);
console.log("AnonymousSubmission FHE/seal fields:", required.join(", "));
