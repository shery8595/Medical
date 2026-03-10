import { BigInt } from "@graphprotocol/graph-ts"
import {
    Staked,
    Unstaked
} from "../../generated/StakingManager/StakingManager"
import { StakingUser } from "../../generated/schema"

export function handleStaked(event: Staked): void {
    let userId = event.params.user.toHexString()
    let user = StakingUser.load(userId)

    if (!user) {
        user = new StakingUser(userId)
        user.totalStakedWei = BigInt.fromI32(0)
    }

    user.totalStakedWei = user.totalStakedWei.plus(event.params.amount)
    user.lastUpdatedAt = event.block.timestamp
    user.save()
}

export function handleUnstaked(event: Unstaked): void {
    let userId = event.params.user.toHexString()
    let user = StakingUser.load(userId)

    if (!user) {
        user = new StakingUser(userId)
        user.totalStakedWei = BigInt.fromI32(0)
    }

    user.totalStakedWei = user.totalStakedWei.minus(event.params.amount)
    user.lastUpdatedAt = event.block.timestamp
    user.save()
} 
