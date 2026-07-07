import { useCallback, useEffect, useState } from "react";
import { Eye, FileText, Loader2, Video, XCircle } from "lucide-react";
import { Phase0ScopeBadge } from "../ui/Phase0ScopeBadge";
import { Button } from "../ui/Button";
import { useSubgraph } from "../../hooks/useSubgraph";
import {
  listSponsorApplicationsForAdmin,
  type SponsorApplicationRecord,
} from "../../lib/sponsorApplicationRelay";
import {
  loadSponsorApplicationMediaForAdmin,
  mediaKindFromContentType,
  type DecryptedSponsorApplicationMedia,
} from "../../lib/sponsorApplicationDecrypt";
import { filterPendingSponsorApplicants } from "../../lib/sponsorVerificationStatus";
import type { ethers } from "ethers";

const GET_PENDING_APPLICATIONS = `
  query GetPendingRequests {
    sponsorshipRequests(where: { status: "Pending" }, orderBy: requestedAt, orderDirection: desc) {
      id
      requestedAt
    }
  }
`;

type PendingRow = {
  applicant: string;
  requestedAt?: string;
  doc?: SponsorApplicationRecord;
};

type Props = {
  adminAccount: string | null;
  readOnlyProvider: ethers.Provider | null;
  isOwner: boolean;
  onApprove: (applicant: string, orgName: string) => void;
  onReject: (applicant: string) => void;
  actionLoading: boolean;
  refreshNonce?: number;
};

export function AdminSponsorApplicationReview({
  adminAccount,
  readOnlyProvider,
  isOwner,
  onApprove,
  onReject,
  actionLoading,
  refreshNonce = 0,
}: Props) {
  const { refetch: refetchSubgraph } = useSubgraph(GET_PENDING_APPLICATIONS);
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [viewingApplicant, setViewingApplicant] = useState<string | null>(null);
  const [media, setMedia] = useState<DecryptedSponsorApplicationMedia | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!adminAccount || !isOwner || !readOnlyProvider) {
      setRows([]);
      return;
    }
    setLoading(true);
    setListError(null);
    try {
      const apps = await listSponsorApplicationsForAdmin(adminAccount);
      const subgraphResult = await refetchSubgraph();
      const subgraphPending: { id: string; requestedAt?: string }[] =
        subgraphResult?.sponsorshipRequests ?? [];

      const merged = new Map<string, PendingRow>();
      for (const req of subgraphPending) {
        const applicant = req.id;
        const doc = apps.find((a) => a.applicant.toLowerCase() === applicant.toLowerCase());
        merged.set(applicant.toLowerCase(), { applicant, requestedAt: req.requestedAt, doc });
      }
      for (const doc of apps) {
        const key = doc.applicant.toLowerCase();
        if (!merged.has(key)) {
          merged.set(key, { applicant: doc.applicant, doc });
        }
      }

      const stillPending = await filterPendingSponsorApplicants(
        readOnlyProvider,
        [...merged.values()].map((row) => row.applicant),
      );
      const pendingSet = new Set(stillPending.map((a) => a.toLowerCase()));
      setRows([...merged.values()].filter((row) => pendingSet.has(row.applicant.toLowerCase())));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [adminAccount, isOwner, readOnlyProvider, refetchSubgraph]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshNonce]);

  const closeViewer = () => {
    if (media?.objectUrl) URL.revokeObjectURL(media.objectUrl);
    setMedia(null);
    setViewingApplicant(null);
    setViewError(null);
  };

  const openViewer = async (applicant: string) => {
    if (!adminAccount) return;
    closeViewer();
    setViewingApplicant(applicant);
    setViewLoading(true);
    setViewError(null);
    try {
      const decrypted = await loadSponsorApplicationMediaForAdmin(adminAccount, applicant);
      setMedia(decrypted);
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Failed to decrypt document");
    } finally {
      setViewLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <Card className="border-teal-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <FileText className="h-5 w-5 text-teal-600" />
          Pending sponsor applications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Phase0ScopeBadge className="w-full" />
        <p className="text-sm text-slate-600 leading-relaxed">
          Review encrypted organization proofs submitted at registration. Only the registry owner can decrypt them via
          the relayer.
        </p>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Refresh list
        </Button>
        {listError ? <p className="text-sm text-rose-600">{listError}</p> : null}

        {rows.length === 0 && !loading ? (
          <p className="text-sm text-slate-500">No pending applications right now.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.applicant}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-800 break-all">{row.applicant}</p>
                  {row.doc?.orgName ? (
                    <p className="mt-1 text-sm font-semibold text-slate-900">{row.doc.orgName}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {row.doc
                      ? `${row.doc.filename} · ${(row.doc.sizeBytes / 1024).toFixed(0)} KB`
                      : "No encrypted document on relayer"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={!row.doc || viewLoading}
                    onClick={() => void openViewer(row.applicant)}
                  >
                    <Eye className="h-4 w-4" />
                    View proof
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={actionLoading || !row.doc?.orgName}
                    onClick={() => onApprove(row.applicant, row.doc?.orgName ?? "")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-rose-700"
                    disabled={actionLoading}
                    onClick={() => onReject(row.applicant)}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {viewingApplicant ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Decrypted organization proof</p>
              <button
                type="button"
                onClick={closeViewer}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-200"
                aria-label="Close viewer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="font-mono text-xs text-slate-500 break-all">{viewingApplicant}</p>
            {viewLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Decrypting…
              </div>
            ) : null}
            {viewError ? <p className="text-sm text-rose-600">{viewError}</p> : null}
            {media ? (
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                {mediaKindFromContentType(media.contentType) === "pdf" ? (
                  <iframe
                    title="Organization proof PDF"
                    src={media.objectUrl}
                    className="h-[28rem] w-full rounded-md"
                  />
                ) : mediaKindFromContentType(media.contentType) === "video" ? (
                  <video controls className="max-h-[28rem] w-full rounded-md" src={media.objectUrl}>
                    <track kind="captions" />
                  </video>
                ) : (
                  <div className="flex items-center gap-2 p-4 text-sm text-slate-600">
                    <Video className="h-4 w-4" />
                    <a href={media.objectUrl} download={media.filename} className="text-teal-700 underline">
                      Download decrypted file
                    </a>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
