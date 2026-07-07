const url =
  process.env.VITE_SUBGRAPH_URL ||
  "https://api.studio.thegraph.com/query/1755644/medvault/v0.2.2-patient-wallet";

const query = `
{
  trial(id: "6") {
    id
    name
    sponsor { id }
    endTime
    active
    milestones(first: 10, orderBy: index, orderDirection: asc) {
      id
      index
      name
      weightBps
      distributed
    }
    incentivePool {
      id
      participantCount
      distributed
      distributedAt
      lastFundedAt
      participants(first: 20) {
        id
        nullifier
        registeredAt
      }
    }
    applications(first: 20) {
      id
      status
      patient
      updatedAt
    }
    progress(first: 20) {
      id
      patient
      lastCompletedMilestoneIndex
      updatedAt
    }
    anonymousSubmissions(first: 20) {
      id
      nullifier
      status
      submittedAt
      statusUpdatedAt
    }
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
