import { Link } from "react-router-dom";
import { BarChart3, ChevronRight, Upload } from "lucide-react";

type Props = {
  onUpload: () => void;
};

export function VaultQuickActions({ onUpload }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <button
        type="button"
        onClick={onUpload}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/20"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <Upload className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="font-bold text-slate-900">Upload Files</p>
            <p className="text-sm text-slate-500">Securely upload and store medical documents</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </button>

      <Link
        to="/patient/consent-logs"
        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/20"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <BarChart3 className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="font-bold text-slate-900">View Activity</p>
            <p className="text-sm text-slate-500">Track access, updates and history</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </Link>
    </div>
  );
}
