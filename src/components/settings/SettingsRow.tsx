import { Link } from "react-router-dom";
import type { ElementType } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

export function SettingsRow({
  to,
  icon: Icon,
  label,
  description,
  external,
  iconClassName = "bg-teal-50 text-teal-700 ring-teal-100",
}: {
  to: string;
  icon: ElementType;
  label: string;
  description: string;
  external?: boolean;
  iconClassName?: string;
}) {
  const className = cn(
    "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80",
    external ? "cursor-default" : "",
  );

  const inner = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
          iconClassName,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      {external ? (
        <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      ) : (
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      )}
    </>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  );
}
