import { MilestonesSet, MilestoneCompleted, TrialMilestoneManager } from "../../generated/TrialMilestoneManager/TrialMilestoneManager"
import { TrialMilestone, ParticipantProgress } from "../../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleMilestonesSet(event: MilestonesSet): void {
    let trialId = event.params.trialId.toString()
    let contract = TrialMilestoneManager.bind(event.address)
    let milestoneCount = event.params.milestoneCount.toI32()

    // We need to fetch each milestone details via contract call since they aren't in the event
    // The subgraph/abis/TrialMilestoneManager.json must have getMilestones
    let milestonesResult = contract.getMilestones(event.params.trialId)

    for (let i = 0; i < milestoneCount; i++) {
        let m = milestonesResult[i]
        let milestoneId = trialId + "-" + i.toString()
        let milestone = new TrialMilestone(milestoneId)
        milestone.trial = trialId
        milestone.index = i
        milestone.name = m.name
        milestone.weightBps = m.weightBps
        milestone.deadline = m.deadline
        milestone.distributed = false
        milestone.save()
    }
}

export function handleMilestoneCompleted(event: MilestoneCompleted): void {
    let trialId = event.params.trialId.toString()
    let patient = event.params.patient
    let progressId = trialId + "-" + patient.toHexString()

    let progress = ParticipantProgress.load(progressId)
    if (!progress) {
        progress = new ParticipantProgress(progressId)
        progress.trial = trialId
        progress.patient = patient
    }

    progress.lastCompletedMilestoneIndex = event.params.milestoneIndex.toI32()
    progress.updatedAt = event.block.timestamp
    progress.save()
}
