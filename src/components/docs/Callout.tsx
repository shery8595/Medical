import { ReactNode } from "react";
import { Info, AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";
import { cn } from "../../lib/utils";

type CalloutType = "info" | "warning" | "success" | "danger" | "tip" | "note";

interface CalloutProps {
    type?: CalloutType;
    title?: string;
    children: ReactNode;
    className?: string;
}

const config: Record<
    CalloutType,
    { icon: React.ComponentType<{ className?: string }>; classes: string; iconColor: string }
> = {
    info: {
        icon: Info,
        classes: "bg-blue-50/90 text-blue-900 border-blue-200/80",
        iconColor: "text-blue-600",
    },
    note: {
        icon: Info,
        classes: "bg-blue-50/90 text-blue-900 border-blue-200/80",
        iconColor: "text-blue-600",
    },
    warning: {
        icon: AlertTriangle,
        classes: "bg-amber-50/90 text-amber-950 border-amber-200/80",
        iconColor: "text-amber-600",
    },
    success: {
        icon: Info,
        classes: "bg-emerald-50/90 text-emerald-950 border-emerald-200/80",
        iconColor: "text-emerald-600",
    },
    danger: {
        icon: ShieldAlert,
        classes: "bg-rose-50/90 text-rose-950 border-rose-200/80",
        iconColor: "text-rose-600",
    },
    tip: {
        icon: Lightbulb,
        classes: "bg-blue-50/90 text-blue-900 border-blue-200/80",
        iconColor: "text-blue-600",
    },
};

export function Callout({ type = "info", title, children, className }: CalloutProps) {
    const { icon: Icon, classes, iconColor } = config[type] ?? config["info"];

    return (
        <div
            className={cn(
                "my-6 flex gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md",
                classes,
                className
            )}
        >
            <div className="mt-0.5 flex-shrink-0">
                <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div className="flex-1 space-y-1">
                {title && <h5 className="font-bold tracking-tight m-0">{title}</h5>}
                <div className="prose-sm max-w-none opacity-95 prose-p:leading-relaxed text-inherit">
                    {children}
                </div>
            </div>
        </div>
    );
}
