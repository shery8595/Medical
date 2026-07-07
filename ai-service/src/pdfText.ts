import { PDFDocument } from "pdf-lib";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/** Re-save PDFs that use object streams / compressed xref (common from pdf-lib). */
async function normalizePdfForLegacyParser(buffer: Buffer): Promise<Buffer> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const bytes = await doc.save({ useObjectStreams: false });
  return Buffer.from(bytes);
}

async function parsePdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return (result.text ?? "").trim();
}

/** Extract plain text from a PDF buffer. Caller must discard buffer after redaction. */
export async function pdfBufferToText(buffer: Buffer): Promise<string> {
  let lastError: Error | undefined;

  for (const candidate of [buffer, await normalizePdfForLegacyParser(buffer).catch(() => null)]) {
    if (!candidate) continue;
    try {
      const text = await parsePdfText(candidate);
      if (text) return text;
      lastError = new Error("PDF contained no extractable text");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (lastError?.message.includes("Invalid PDF structure")) {
    throw new Error(
      "Could not read this PDF. Use a text-based protocol PDF (export from Word/Google Docs as PDF, or regenerate fixtures/sponsor-medvault-demo-protocol.pdf)."
    );
  }

  throw lastError ?? new Error("PDF contained no extractable text");
}
