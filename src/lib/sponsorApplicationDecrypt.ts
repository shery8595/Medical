import { base64ToBytes } from "./crypto-utils";
import { fetchAndDecryptDocument } from "./EncryptionService";
import {
  fetchSponsorApplicationForAdmin,
  type SponsorApplicationRecordWithKey,
} from "./sponsorApplicationRelay";
import { isPdfContentType, isVideoContentType } from "./sponsorApplicationDocument";

export type DecryptedSponsorApplicationMedia = {
  blob: Blob;
  objectUrl: string;
  contentType: string;
  filename: string;
};

export async function decryptSponsorApplicationDocument(
  record: SponsorApplicationRecordWithKey,
): Promise<Uint8Array> {
  const aesKey = base64ToBytes(record.aesKeyB64);
  return fetchAndDecryptDocument(record.docCid, aesKey);
}

export async function loadSponsorApplicationMediaForAdmin(
  adminWallet: string,
  applicant: string,
): Promise<DecryptedSponsorApplicationMedia> {
  const record = await fetchSponsorApplicationForAdmin(adminWallet, applicant);
  const bytes = await decryptSponsorApplicationDocument(record);
  const contentType = record.contentType || "application/octet-stream";
  const blob = new Blob([bytes], { type: contentType });
  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
    contentType,
    filename: record.filename,
  };
}

export function mediaKindFromContentType(contentType: string): "pdf" | "video" | "other" {
  if (isPdfContentType(contentType)) return "pdf";
  if (isVideoContentType(contentType)) return "video";
  return "other";
}
