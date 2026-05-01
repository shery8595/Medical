import type { ElementType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Sliders, Activity, Heart, Cigarette } from "lucide-react";
import { cn } from "../../lib/utils";

const cardShell =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_-2px_rgba(15,23,42,0.05)]";

const fieldLabel = "text-xs font-semibold uppercase tracking-[0.08em] text-slate-500";

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400/80 transition-colors";

export interface Criteria {
  minAge: number;
  maxAge: number;
  requiresDiabetes: boolean;
  minHb: number;
  genderRequirement: number;
  minHeight: number;
  maxWeight: number;
  requiresNonSmoker: boolean;
  requiresNormalBP: boolean;
}

interface CriteriaBuilderProps {
  criteria: Criteria;
  onChange: (criteria: Criteria) => void;
}

function ToggleRow({
  title,
  description,
  icon: Icon,
  iconClass,
  checked,
  onChecked,
}: {
  title: string;
  description: string;
  icon: ElementType;
  iconClass: string;
  checked: boolean;
  onChecked: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-slate-50/80 p-5 transition-colors hover:bg-white">
      <div className="min-w-0 space-y-1">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Icon className={cn("h-4 w-4 shrink-0", iconClass)} strokeWidth={2} />
          {title}
        </h4>
        <p className="text-xs leading-relaxed text-slate-600">{description}</p>
      </div>
      <div className="relative flex shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChecked(e.target.checked)}
          className="peer absolute h-6 w-6 cursor-pointer opacity-0"
        />
        <div
          className={cn(
            "flex h-7 w-11 items-center rounded-full p-0.5 transition-colors",
            checked ? "bg-[#1D2634]" : "bg-slate-300",
          )}
        >
          <div
            className={cn(
              "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              checked ? "translate-x-5" : "translate-x-0",
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function CriteriaBuilder({ criteria, onChange }: CriteriaBuilderProps) {
  const handleChange = (field: keyof Criteria, value: unknown) => {
    onChange({ ...criteria, [field]: value });
  };

  return (
    <Card className={`${cardShell} overflow-hidden`}>
      <CardHeader className="border-b border-slate-200/80 px-6 py-5 md:px-8 md:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-display flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-200/60">
              <Sliders className="h-5 w-5 text-teal-700" strokeWidth={2} />
            </div>
            Eligibility criteria
          </CardTitle>
          <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
            Encrypted evaluation
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-10 p-6 md:p-8">
        <div className="space-y-5">
          <p className={fieldLabel}>Biological parameters</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={fieldLabel}>Min age</label>
              <input
                type="number"
                value={criteria.minAge}
                onChange={(e) => handleChange("minAge", parseInt(e.target.value, 10))}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={fieldLabel}>Max age</label>
              <input
                type="number"
                value={criteria.maxAge}
                onChange={(e) => handleChange("maxAge", parseInt(e.target.value, 10))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={fieldLabel}>Gender target</label>
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                { id: 0, label: "Any" },
                { id: 1, label: "Male" },
                { id: 2, label: "Female" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleChange("genderRequirement", g.id)}
                  className={cn(
                    "flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors",
                    criteria.genderRequirement === g.id
                      ? "bg-[#1D2634] text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={fieldLabel}>Min height (cm)</label>
              <input
                type="number"
                value={criteria.minHeight}
                onChange={(e) => handleChange("minHeight", parseInt(e.target.value, 10))}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={fieldLabel}>Max weight (kg)</label>
              <input
                type="number"
                value={criteria.maxWeight}
                onChange={(e) => handleChange("maxWeight", parseInt(e.target.value, 10))}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5 border-t border-slate-200/80 pt-8">
          <p className={fieldLabel}>Clinical logic</p>

          <ToggleRow
            title="Require diabetes diagnosis"
            description="Filters for patients with a confirmed diagnosis in the vault. Evaluated without exposing raw PHI."
            icon={Activity}
            iconClass="text-emerald-600"
            checked={criteria.requiresDiabetes}
            onChecked={(v) => handleChange("requiresDiabetes", v)}
          />

          <div className="space-y-2">
            <label className={fieldLabel}>Min hemoglobin (mg/dL)</label>
            <input
              type="number"
              value={criteria.minHb}
              onChange={(e) => handleChange("minHb", parseInt(e.target.value, 10))}
              className={inputClass}
            />
          </div>

          <ToggleRow
            title="Normal blood pressure"
            description="Exclude hypertensive profiles using encrypted comparison in the protocol."
            icon={Heart}
            iconClass="text-rose-600"
            checked={criteria.requiresNormalBP}
            onChecked={(v) => handleChange("requiresNormalBP", v)}
          />
        </div>

        <div className="space-y-5 border-t border-slate-200/80 pt-8">
          <p className={fieldLabel}>Lifestyle</p>

          <ToggleRow
            title="Non-smoker policy"
            description="Only patients marked non-smoker in the vault pass this gate."
            icon={Cigarette}
            iconClass="text-amber-600"
            checked={criteria.requiresNonSmoker}
            onChecked={(v) => handleChange("requiresNonSmoker", v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
