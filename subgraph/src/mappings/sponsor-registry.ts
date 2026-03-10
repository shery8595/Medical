import { SponsorAdded, SponsorRemoved } from "../../generated/SponsorRegistry/SponsorRegistry";
import { Sponsor } from "../../generated/schema";

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
