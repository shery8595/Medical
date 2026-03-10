import { IncentiveFunded, ParticipantRegistered, RewardsDistributed, MilestoneRewardsDistributed } from "../../generated/SponsorIncentiveVault/SponsorIncentiveVault"
import { IncentivePool, IncentiveParticipant, TrialMilestone } from "../../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleIncentiveFunded(event: IncentiveFunded): void {
    let poolId = event.params.trialId.toString()
    let pool = IncentivePool.load(poolId)

    if (!pool) {
        pool = new IncentivePool(poolId)
        pool.trial = poolId
        pool.totalFundedWei = BigInt.fromI32(0)
        pool.participantCount = 0
        pool.distributed = false
    }

    pool.totalFundedWei = pool.totalFundedWei.plus(event.params.amount)
    pool.save()
}

export function handleParticipantRegistered(event: ParticipantRegistered): void {
    let poolId = event.params.trialId.toString()
    let participantId = poolId + "-" + event.params.participant.toHexString()

    let participant = new IncentiveParticipant(participantId)
    participant.pool = poolId
    participant.patient = event.params.participant
    participant.registeredAt = event.block.timestamp
    participant.save()

    // Update pool participant count
    let pool = IncentivePool.load(poolId)
    if (pool) {
        pool.participantCount = pool.participantCount + 1
        pool.save()
    }
}

export function handleRewardsDistributed(event: RewardsDistributed): void {
    let poolId = event.params.trialId.toString()
    let pool = IncentivePool.load(poolId)

    if (pool) {
        pool.distributed = true
        pool.shareWei = event.params.shareWei
        pool.distributedAt = event.block.timestamp
        pool.save()
    }
}

export function handleMilestoneRewardsDistributed(event: MilestoneRewardsDistributed): void {
    let trialId = event.params.trialId.toString()
    let milestoneIndex = event.params.milestoneIndex.toString()
    let milestoneId = trialId + "-" + milestoneIndex

    let milestone = TrialMilestone.load(milestoneId)
    if (milestone) {
        milestone.distributed = true
        milestone.save()
    }
}
