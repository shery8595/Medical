/** Short relative time from unix seconds (e.g. "2d ago"). */
export function formatRelativeTimeFromUnix(unixSec: number): string {
    const diff = Math.floor(Date.now() / 1000) - unixSec;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(unixSec * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
