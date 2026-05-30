import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "../../../lib/utils";
import type { LucideIcon } from "lucide-react";
import {
    Users,
    Database,
    Fingerprint,
    Activity,
    Building2,
    Shield,
    Lock,
} from "lucide-react";

export type ProtocolNodeKind = "client" | "vault" | "compute" | "sponsor";

export type ProtocolNodeData = {
    title: string;
    subtitle: string;
    kind: ProtocolNodeKind;
    hub?: boolean;
};

const ICONS: Record<string, LucideIcon> = {
    patient: Users,
    mvr: Database,
    apr: Fingerprint,
    ee: Activity,
    sponsor: Building2,
    tm: Shield,
    consent: Lock,
};

const KIND_STYLE: Record<ProtocolNodeKind, { ring: string; icon: string; accent: string }> = {
    client: {
        ring: "ring-teal-200/90",
        icon: "bg-teal-50 text-teal-700",
        accent: "border-l-teal-500",
    },
    vault: {
        ring: "ring-blue-200/90",
        icon: "bg-blue-50 text-blue-700",
        accent: "border-l-blue-500",
    },
    compute: {
        ring: "ring-violet-300/90",
        icon: "bg-violet-50 text-violet-700",
        accent: "border-l-violet-500",
    },
    sponsor: {
        ring: "ring-amber-200/90",
        icon: "bg-amber-50 text-amber-800",
        accent: "border-l-amber-500",
    },
};

function ProtocolFlowNodeComponent({ id, data }: NodeProps) {
    const d = data as ProtocolNodeData;
    const style = KIND_STYLE[d.kind] ?? KIND_STYLE.vault;
    const Icon = ICONS[id] ?? Database;

    return (
        <>
            <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-300 !border-white" />
            <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-300 !border-white" />
            <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-slate-300 !border-white" />
            <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-slate-300 !border-white" />

            <div
                className={cn(
                    "min-w-[150px] max-w-[180px] rounded-xl border-l-[3px] bg-white px-3 py-2.5 shadow-sm ring-1",
                    style.accent,
                    style.ring,
                    d.hub && "min-w-[170px] shadow-md ring-2 ring-violet-200/80 py-3"
                )}
            >
                <div className="flex items-start gap-2">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.icon)}>
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                        <p className="text-[11px] font-bold text-slate-900 leading-tight m-0 truncate">{d.title}</p>
                        <p className="text-[9px] font-medium text-slate-500 mt-0.5 m-0 leading-snug line-clamp-2">
                            {d.subtitle}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export const ProtocolFlowNode = memo(ProtocolFlowNodeComponent);
