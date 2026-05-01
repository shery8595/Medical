import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CodeBlockProps {
    code: string;
    language?: string;
    filename?: string;
    className?: string;
}

export function CodeBlock({ code, language = "solidity", filename, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("my-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl", className)}>
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    {/* OS Dots for aesthetic */}
                    <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                        <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                        <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    </div>
                    {filename && (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-white/5 text-xs font-mono text-slate-400 border border-white/5 tracking-tight">
                            {filename}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {language && (
                        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                            {language}
                        </span>
                    )}
                    <button
                        onClick={handleCopy}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                        aria-label="Copy code"
                    >
                        <AnimatePresence mode="wait">
                            {copied ? (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Check className="h-4 w-4 text-emerald-400" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="copy"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Copy className="h-4 w-4" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="relative overflow-x-auto p-4 custom-scrollbar">
                <pre className="text-sm font-mono text-slate-300 leading-relaxed tracking-tight">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}
