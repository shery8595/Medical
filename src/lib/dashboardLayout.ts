/** Fixed dashboard nav sidebar width (280px − 12% ≈ 246px). */
export const DASHBOARD_SIDEBAR_WIDTH_PX = 246;

export const dashboardSidebarWidthClass = "w-[246px]";
export const dashboardSidebarOffsetClass = "md:pl-[246px]";

/** Main content inset — minimal left gutter after sidebar, comfortable right padding. */
export const dashboardMainInset =
  "pb-10 pt-4 pl-4 pr-5 md:pb-10 md:pt-5 md:pl-5 md:pr-7 lg:pr-9";

export const dashboardMainInsetCompact =
  "pb-8 pt-3 pl-4 pr-4 md:pl-5 md:pr-5 lg:pr-6";

/** Negates horizontal main inset so sticky bars span the content column edge-to-edge. */
export const dashboardBleedBar =
  "-ml-4 -mr-5 pl-4 pr-5 md:-ml-5 md:-mr-7 md:pl-5 md:pr-7 lg:-mr-9 lg:pr-9";
