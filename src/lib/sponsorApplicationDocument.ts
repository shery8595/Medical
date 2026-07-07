import { encryptDocument, generateKey } from "./EncryptionService";
import { pinToIpfs } from "./ipfs";
import { bytesToBase64 } from "./crypto-utils";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME = new Set([
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type PreparedSponsorApplicationDocument = {
  docCid: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  /** Relayer-only: AES key for admin decrypt (never pinned to IPFS). */
  aesKeyB64: string;
};

export function validateSponsorApplicationFile(file: File): void {
  if (file.size <= 0) throw new Error("File is empty.");
  if (file.size > MAX_BYTES) throw new Error("File must be 25 MB or smaller.");
  const mime = file.type || guessMimeFromName(file.name);
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Upload a PDF or video file (PDF, MP4, WebM).");
  }
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return "application/octet-stream";
}

/** AES-encrypt organization proof document and pin ciphertext to IPFS. */
export async function prepareSponsorApplicationDocumentUpload(
  file: File,
): Promise<PreparedSponsorApplicationDocument> {
  validateSponsorApplicationFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = file.type || guessMimeFromName(file.name);
  const aesKey = generateKey();
  const encryptedPayload = await encryptDocument(bytes, aesKey);
  const docCid = await pinToIpfs(encryptedPayload, `sponsor-application-${file.name}`);

  return {
    docCid,
    filename: file.name,
    contentType,
    sizeBytes: file.size,
    aesKeyB64: bytesToBase64(aesKey),
  };
}

export function isPdfContentType(contentType: string): boolean {
  return contentType === "application/pdf";
}

export function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith("video/");
}
