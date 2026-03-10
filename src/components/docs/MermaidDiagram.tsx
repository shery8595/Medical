import React, { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

// ─── Module-level mermaid import (lazy to avoid SSR issues) ───────────────────
let mermaidLib: typeof import('mermaid')['default'] | null = null;
const loadMermaid = async () => {
    if (!mermaidLib) {
        const mod = await import('mermaid');
        mermaidLib = mod.default;
        mermaidLib.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Inter, sans-serif',
        });
    }
    return mermaidLib;
};

// ─── Stable counter so IDs never collide between instances ──────────────────
let _instanceCount = 0;

// ─── React Error Boundary (class component — only way to catch render errors) ─
interface BoundaryState { hasError: boolean; errMsg: string }
class DiagramErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, errMsg: '' };
    }
    static getDerivedStateFromError(err: Error): BoundaryState {
        return { hasError: true, errMsg: err.message ?? 'Unknown render error' };
    }
    componentDidCatch(_err: Error, _info: ErrorInfo) {
        // intentionally swallowed — parent page must not crash
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="my-10 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 text-sm">
                    <strong>⚠ Diagram could not render.</strong> {this.state.errMsg}
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Inner renderer ──────────────────────────────────────────────────────────
interface Props { chart: string; title?: string }

const MermaidInner: React.FC<Props> = ({ chart, title }) => {
    const [svg, setSvg] = useState('');
    const [err, setErr] = useState('');
    const idRef = useRef(`mvault-mmd-${++_instanceCount}`);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        const render = async () => {
            try {
                setSvg('');
                setErr('');
                const mermaid = await loadMermaid();

                // Re-initialize with dark/light theme on each render
                const isDark = document.documentElement.classList.contains('dark');
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? 'dark' : 'default',
                    securityLevel: 'loose',
                });

                const { svg: rendered } = await mermaid.render(idRef.current, chart);
                if (!cancelled) setSvg(rendered);
            } catch (e: unknown) {
                if (!cancelled) setErr((e as Error)?.message ?? 'Diagram parse error');
            }
        };

        render();
        return () => { cancelled = true; };
    }, [chart]);

    if (err) {
        return (
            <div className="my-10 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 text-sm">
                <strong>⚠ Diagram render error:</strong> {err}
            </div>
        );
    }

    return (
        <div className="my-10 not-prose">
            {title && (
                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</p>
            )}
            {svg ? (
                <div
                    ref={containerRef}
                    className="flex justify-center items-start bg-white dark:bg-slate-950 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            ) : (
                <div className="flex justify-center items-center h-40 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400 text-sm animate-pulse">Rendering diagram…</span>
                </div>
            )}
        </div>
    );
};

// ─── Public export: always wrapped in ErrorBoundary ──────────────────────────
export const MermaidDiagram: React.FC<Props> = (props) => (
    <DiagramErrorBoundary>
        <MermaidInner {...props} />
    </DiagramErrorBoundary>
);
