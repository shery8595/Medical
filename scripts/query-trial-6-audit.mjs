const url =
  process.env.VITE_SUBGRAPH_URL ||
  "https://api.studio.thegraph.com/query/1755644/medvault/v0.2.2-patient-wallet";

const query = `
{
  auditLogs(
    first: 30
    orderBy: timestamp
    orderDirection: desc
    where: { trialId: "6" }
  ) {
    id
    action
    actionType
    timestamp
    performer
    txHash
    patientHash
  }
  incentivePool(id: "6") {
    participantCount
    distributed
    distributedAt
    lastFundedAt
  }
  trialMilestones(where: { trial: "6" }, orderBy: index, orderDirection: asc) {
    id
    index
    name
    distributed
  }
}
`;

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
