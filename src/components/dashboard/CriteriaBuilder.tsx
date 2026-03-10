import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Sliders, User, Scale, Ruler, Cigarette, Heart, Activity } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Criteria {
  minAge: number;
  maxAge: number;
  requiresDiabetes: boolean;
  minHb: number;
  genderRequirement: number; // 0=any, 1=Male, 2=Female
  minHeight: number;
  maxWeight: number;
  requiresNonSmoker: boolean;
  requiresNormalBP: boolean;
}

interface CriteriaBuilderProps {
  criteria: Criteria;
  onChange: (criteria: Criteria) => void;
}

export function CriteriaBuilder({ criteria, onChange }: CriteriaBuilderProps) {
  const handleChange = (field: keyof Criteria, value: any) => {
    onChange({ ...criteria, [field]: value });
  };

  return (
    <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" />
            Eligibility Rules
          </CardTitle>
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest border border-blue-200 dark:border-blue-800">
            FHE Layer
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Biology Section */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Biological Parameters</p>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Min Age</label>
              <input
                type="number"
                value={criteria.minAge}
                onChange={(e) => handleChange("minAge", parseInt(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-accent focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Max Age</label>
              <input
                type="number"
                value={criteria.maxAge}
                onChange={(e) => handleChange("maxAge", parseInt(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-accent focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Gender Target</label>
            <div className="flex p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              {[
                { id: 0, label: "Any" },
                { id: 1, label: "Male" },
                { id: 2, label: "Female" }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleChange("genderRequirement", g.id)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                    criteria.genderRequirement === g.id
                      ? "bg-white dark:bg-accent text-accent dark:text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Min Height (CM)</label>
              <input
                type="number"
                value={criteria.minHeight}
                onChange={(e) => handleChange("minHeight", parseInt(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-accent focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Max Weight (KG)</label>
              <input
                type="number"
                value={criteria.maxWeight}
                onChange={(e) => handleChange("maxWeight", parseInt(e.target.value))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-accent focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Clinical Section */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Clinical Logic</p>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Require Diabetes Diagnosis</h4>
              <p className="text-[11px] text-slate-500">Filters for patients with confirmed diagnosis.</p>
            </div>
            <input
              type="checkbox"
              checked={criteria.requiresDiabetes}
              onChange={(e) => handleChange("requiresDiabetes", e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Min Hemoglobin Level (mg/dL)</label>
            <input
              type="number"
              value={criteria.minHb}
              onChange={(e) => handleChange("minHb", parseInt(e.target.value))}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold focus:ring-2 focus:ring-accent focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> Normal Blood Pressure
              </h4>
              <p className="text-[11px] text-slate-500">Exclude patients with hypertension.</p>
            </div>
            <input
              type="checkbox"
              checked={criteria.requiresNormalBP}
              onChange={(e) => handleChange("requiresNormalBP", e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent/20"
            />
          </div>
        </div>

        {/* Lifestyle Section */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lifestyle Controls</p>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cigarette className="h-4 w-4 text-amber-500" /> Non-Smoker Policy
              </h4>
              <p className="text-[11px] text-slate-500">Only eligible if the patient is a non-smoker.</p>
            </div>
            <input
              type="checkbox"
              checked={criteria.requiresNonSmoker}
              onChange={(e) => handleChange("requiresNonSmoker", e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent/20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
