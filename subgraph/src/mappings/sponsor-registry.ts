import { SponsorAdded, SponsorRemoved, SponsorshipRequested, SponsorshipRequestResolved } from "../../generated/SponsorRegistry/SponsorRegistry";
import { Sponsor, SponsorshipRequest } from "../../generated/schema";

export function handleSponsorAdded(event: SponsorAdded): void {
    let sponsor = Sponsor.load(event.params.sponsor);
    if (sponsor == null) {
        sponsor = new Sponsor(event.params.sponsor);
        sponsor.name = event.params.name;
        sponsor.verified = true;
        sponsor.addedAt = event.block.timestamp;
        sponsor.save();
    } else {
        sponsor.name = event.params.name;
        sponsor.verified = true;
        sponsor.save();
    }
}

export function handleSponsorRemoved(event: SponsorRemoved): void {
    let sponsor = Sponsor.load(event.params.sponsor);
    if (sponsor != null) {
        sponsor.verified = false;
        sponsor.save();
    }
}

export function handleSponsorshipRequested(event: SponsorshipRequested): void {
    let request = new SponsorshipRequest(event.params.applicant);
    request.encryptedData = event.params.encryptedInstitutionId;
    request.status = "Pending";
    request.requestedAt = event.block.timestamp;
    request.txHash = event.transaction.hash;
    request.save();
}

export function handleSponsorshipRequestResolved(event: SponsorshipRequestResolved): void {
    let request = SponsorshipRequest.load(event.params.applicant);
    if (request != null) {
        if (event.params.status == 2) { // Approved
            request.status = "Approved";
        } else if (event.params.status == 3) { // Rejected
            request.status = "Rejected";
        }
        request.save();
    }
}
