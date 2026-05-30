import { sponsorCardShellCompact } from "./sponsorUi";

/** Shared compact UI tokens for the sponsor Active Trials page (~67% visual scale). */
export const trialsCardShell = sponsorCardShellCompact;

export const trialsPageStack = "space-y-5 pb-8";

export const trialsSectionGap = "gap-3";

/** Main +15% again (10.58fr); sidebar 3.24fr (~76% / ~24% at xl). */
export const trialsSplitGrid = "grid grid-cols-1 gap-3 xl:grid-cols-[10.58fr_3.24fr]";

export const trialsControlHeight = "h-8";

export const trialsInputClass =
  "h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

export const trialsSelectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm";

/** Horizontal inset so card copy/buttons do not sit on the border. */
export const trialsCardInsetX = "px-4 md:px-5";

export const trialsCardBodyInset = "p-4 md:p-5";
