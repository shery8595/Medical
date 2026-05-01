import { ActionLogged } from "../../generated/DataAccessLog/DataAccessLog"
import { AuditLog } from "../../generated/schema"

export function handleActionLogged(event: ActionLogged): void {
    let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    let log = new AuditLog(id)

    let actionType = "UNKNOWN"
    let action = event.params.action

    if (action == 0) actionType = "PROFILE_SUBMISSION"
    else if (action == 1) actionType = "CONSENT_GRANTED"
    else if (action == 2) actionType = "ELIGIBILITY_CHECKED"
    else if (action == 3) actionType = "APPLICATION_STATUS_CHANGED"
    else if (action == 4) actionType = "MILESTONE_COMPLETED"
    else if (action == 5) actionType = "REWARDS_DISTRIBUTED"

    log.action = actionType
    log.actionType = actionType
    log.trialId = event.params.trialId
    log.patientHash = event.params.patientHash
    log.timestamp = event.block.timestamp
    log.performer = event.transaction.from
    log.actor = event.transaction.from
    log.txHash = event.transaction.hash
    log.transactionHash = event.transaction.hash.toHexString()
    log.save()
}
