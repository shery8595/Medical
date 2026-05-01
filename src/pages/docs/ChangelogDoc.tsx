import { Prose } from "../../components/docs/Prose";
import { DocsPageHeaderForRoute } from "../../components/docs/DocsPageHeader";
import { motion } from "framer-motion";

const entries: { date: string; title: string; items: string[] }[] = [
    {
        date: "2026-04",
        title: "Documentation & routing",
        items: [
            "Added tabbed documentation shell with search and per-page copy link.",
            "Aligned technical copy with Arbitrum Sepolia and AnonymousPatientRegistry / MedVaultRegistry naming.",
        ],
    },
    {
        date: "Ongoing",
        title: "Protocol",
        items: [
            "fhEVM FHE types and EligibilityEngine remain the core matching layer.",
            "Subgraph and ConsentManager integrations evolve with contract upgrades—check addresses.json for your deployment.",
        ],
    },
];

export function ChangelogDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <DocsPageHeaderForRoute />
                <div className="not-prose space-y-8 max-w-3xl">
                    {entries.map((e) => (
                        <section key={e.title}>
                            <p className="text-xs font-bold uppercase tracking-widest text-[#00685f] m-0 mb-1">
                                {e.date}
                            </p>
                            <h2 className="text-lg font-bold text-slate-900 m-0 mb-3">{e.title}</h2>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 m-0">
                                {e.items.map((t) => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </Prose>
        </motion.div>
    );
}
