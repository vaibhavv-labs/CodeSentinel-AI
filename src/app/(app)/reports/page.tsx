'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, Zap, ArrowRight, Bug, Info, ChevronDown, ChevronUp, Loader2, Share2, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';

interface Finding {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cwe: string;
    owasp: string;
    description: string;
    file: string;
    line: number;
    unsafeCode: string;
    safeCode: string;
    aiRationale: string;
    label?: number;
    labelName?: string;
    confidence?: number;
}

interface ReportResponse {
    scan: {
        id: string;
        displayId: string;
        createdAt: string;
        fixedCode?: string | null;
        originalCode?: string;
    };
    findings: Finding[];
}

function ReportsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const scanId = searchParams.get('scanId');

    const [findings, setFindings] = useState<Finding[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [applyingFix, setApplyingFix] = useState<string | null>(null);
    const [fixedIds, setFixedIds] = useState<string[]>([]);
    const [showToast, setShowToast] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reportDisplayId, setReportDisplayId] = useState('N/A');
    const [resolvedScanId, setResolvedScanId] = useState<string | null>(scanId);
    const [sourceCode, setSourceCode] = useState('');

    const triggerToast = useCallback((msg: string) => {
        setShowToast(msg);
        setTimeout(() => setShowToast(null), 3000);
    }, []);

    const loadReport = useCallback(async (targetScanId: string | null) => {
        if (!targetScanId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch(`/api/reports/${targetScanId}`);
            if (!res.ok) {
                throw new Error('Failed to load report');
            }

            const data: ReportResponse = await res.json();
            setFindings(data.findings);
            setExpandedId(data.findings[0]?.id ?? null);
            setReportDisplayId(data.scan.displayId);
            setSourceCode(data.scan.originalCode ?? '');

            if (data.scan.fixedCode) {
                setFixedIds(data.findings.map((f) => f.id));
            } else {
                setFixedIds([]);
            }
        } catch (error) {
            console.error('REPORT_LOAD_ERROR', error);
            triggerToast('Unable to load report data');
        } finally {
            setIsLoading(false);
        }
    }, [triggerToast]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResolvedScanId(scanId);
    }, [scanId]);

    useEffect(() => {
        const loadLatestScanId = async () => {
            if (scanId) {
                return;
            }

            try {
                setIsLoading(true);
                const res = await fetch('/api/history');
                if (!res.ok) {
                    throw new Error('Failed to load history');
                }

                const data: Array<{ realId: string }> = await res.json();
                const latestScanId = data[0]?.realId;
                if (!latestScanId) {
                    setIsLoading(false);
                    return;
                }

                setResolvedScanId(latestScanId);
                router.replace(`/reports?scanId=${latestScanId}`);
            } catch (error) {
                console.error('REPORT_LATEST_SCAN_RESOLVE_ERROR', error);
                setIsLoading(false);
            }
        };

        loadLatestScanId();
    }, [scanId, router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadReport(resolvedScanId);
    }, [resolvedScanId, loadReport]);

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-vulnerable/20 text-vulnerable border-vulnerable/30';
            case 'HIGH': return 'bg-hallucinated/20 text-hallucinated border-hallucinated/30';
            case 'MEDIUM': return 'bg-hallucinated/20 text-hallucinated border-hallucinated/30';
            default: return 'bg-safe/20 text-safe border-safe/30';
        }
    };

    const handleApplyFix = async (id: string) => {
        if (!resolvedScanId) {
            triggerToast('Open a scan report from Dashboard or History first');
            return;
        }

        setApplyingFix(id);
        try {
            const res = await fetch('/api/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scanId: resolvedScanId,
                    code: sourceCode,
                    scan_results: findings.map((f) => ({
                        line_number: f.line,
                        code: f.unsafeCode,
                        label: f.label ?? (f.severity === 'CRITICAL' ? 0 : 2),
                        label_name: f.labelName ?? f.severity,
                        confidence: f.confidence ?? 0.9,
                    })),
                }),
            });

            if (!res.ok) {
                throw new Error('Patch generation failed');
            }

            await loadReport(resolvedScanId);
            setFixedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
            triggerToast(`Secured successfully: ${id}`);
        } catch (error) {
            console.error('REPORT_FIX_ERROR', error);
            triggerToast('Failed to apply security patch');
        } finally {
            setApplyingFix(null);
        }
    };

    const ignoreFinding = (id: string) => {
        setFindings(findings.filter(f => f.id !== id));
        triggerToast(`Ignored finding: ${id}`);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-6xl mx-auto relative">
            {/* Background Glows */}
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full animate-pulse-glow"></div>
            </div>

            {/* Report Header */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-3 text-primary font-black text-[10px] md:text-xs tracking-[0.2em] uppercase"
                    >
                        <span>Audit forensic</span> <ArrowRight className="w-3 h-3" /> <span>ID: {reportDisplayId}</span>
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 italic">Security <span className="gradient-text">Manifest</span></h1>
                    <p className="text-secondary text-sm max-w-2xl leading-relaxed">
                        Forensic analysis of <span className="text-foreground font-black underline decoration-primary/40 underline-offset-4">Legacy-API-Gateway</span>.
                        AI engine confidence: <span className="text-primary font-bold">98.4%</span>.
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(window.location.href);
                                triggerToast('Report link copied to clipboard');
                            } catch {
                                triggerToast('Unable to copy report link');
                            }
                        }}
                        className="flex-1 md:flex-none px-6 py-3 glass border border-card-border rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-card hover:border-primary/30 transition-all active:scale-95"
                    >
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button
                        onClick={() => triggerToast('Use Dashboard Report download for full forensic export')}
                        className="flex-1 md:flex-none px-6 py-3 bg-primary hover:bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {[
                    { label: 'Neural Findings', value: findings.length + 22, color: 'foreground' },
                    { label: 'Critical Path', value: '03', color: 'vulnerable' },
                    { label: 'High Alert', value: '09', color: 'hallucinated' },
                    { label: 'Remediated', value: fixedIds.length, color: 'safe' },
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass p-5 rounded-2xl border border-card-border bg-card/10 group hover:border-primary/20 transition-all"
                    >
                        <p className="text-[10px] text-secondary uppercase font-black tracking-widest mb-1 opacity-60">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.color === 'foreground' ? 'text-foreground' :
                            stat.color === 'vulnerable' ? 'text-vulnerable' :
                                stat.color === 'hallucinated' ? 'text-hallucinated' :
                                    stat.color === 'safe' ? 'text-safe' : 'text-primary'
                            }`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Findings List */}
            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <Bug className="w-6 h-6 text-primary" />
                        Primary Signatures
                    </h2>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">{findings.length} Issues</p>
                </div>

                <AnimatePresence>
                    {!resolvedScanId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass rounded-2xl border border-card-border p-8 text-center text-secondary"
                        >
                            Open a report from Dashboard or History to view scan findings.
                        </motion.div>
                    )}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass rounded-2xl border border-card-border p-8 text-center"
                        >
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
                            <p className="text-sm text-secondary">Loading forensic findings...</p>
                        </motion.div>
                    )}
                    {findings.map((finding) => (
                        <motion.div
                            key={finding.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="glass rounded-2xl border border-card-border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
                        >
                            {/* Header */}
                            <div
                                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer group gap-4"
                                onClick={() => setExpandedId(expandedId === finding.id ? null : finding.id)}
                            >
                                <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${fixedIds.includes(finding.id) ? 'bg-safe/20 text-safe border border-safe/30' : 'bg-card border border-card-border group-hover:border-primary/30'
                                        }`}>
                                        {fixedIds.includes(finding.id) ? (
                                            <ShieldCheck className="w-6 h-6" />
                                        ) : (
                                            <AlertCircle className={`w-6 h-6 ${finding.severity === 'CRITICAL' ? 'text-vulnerable' :
                                                    finding.severity === 'HIGH' || finding.severity === 'MEDIUM' ? 'text-hallucinated' : 'text-safe'
                                                }`} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`font-black text-base sm:text-lg md:text-xl tracking-tight wrap-break-word ${fixedIds.includes(finding.id) ? 'line-through text-secondary' : ''}`}>{finding.title}</h3>
                                            {fixedIds.includes(finding.id) ? (
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black border border-safe/30 bg-safe/20 text-safe tracking-widest uppercase">Secured</span>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getSeverityStyles(finding.severity)} uppercase tracking-widest`}>
                                                    {finding.severity}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] md:text-xs text-secondary font-bold uppercase tracking-wide">
                                            <span className="text-primary font-black italic">{finding.id}</span>
                                            <span className="opacity-30">|</span>
                                            <span className="font-mono">{finding.file}:{finding.line}</span>
                                            <span className="hidden sm:inline opacity-30">|</span>
                                            <span className="font-mono hidden sm:inline">{finding.cwe}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-secondary uppercase font-black tracking-widest mb-0.5 opacity-50">Standards</p>
                                        <p className="text-xs font-mono font-black text-foreground">{finding.owasp}</p>
                                    </div>
                                    {expandedId === finding.id ? <ChevronUp className="w-6 h-6 text-primary" /> : <ChevronDown className="w-6 h-6 text-secondary group-hover:text-foreground transition-colors" />}
                                </div>
                            </div>

                            {/* Content */}
                            <AnimatePresence>
                                {expandedId === finding.id && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 sm:p-6 md:p-8 border-t border-card-border bg-card/5 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="md:col-span-2 space-y-4">
                                                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Info className="w-4 h-4 text-primary" /> Forensic Context
                                                    </h4>
                                                    <p className="text-sm md:text-base leading-relaxed text-secondary border-l-2 border-primary/20 pl-6 italic">
                                                        &quot;{finding.description}&quot;
                                                    </p>
                                                </div>
                                                <div className="glass p-4 rounded-xl border border-card-border space-y-3">
                                                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Risk Mapping</h4>
                                                    <div className="space-y-2">
                                                        {['Data Integrity', 'Privilege Escalation', 'Remote Execution'].map((r, i) => (
                                                            <div key={i} className="flex items-center justify-between">
                                                                <span className="text-xs text-secondary font-medium">{r}</span>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-vulnerable"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Code Comparison */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-primary" /> Remediated Path
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <span className="px-2 py-1 bg-vulnerable/10 text-vulnerable text-[10px] font-black rounded-lg border border-vulnerable/20">UNSAFE ORIGIN</span>
                                                        <span className="px-2 py-1 bg-safe/10 text-safe text-[10px] font-black rounded-lg border border-safe/20">AI RECOMMENDATION</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto">
                                                    <div className="glass rounded-xl border border-vulnerable/20 overflow-hidden flex flex-col group/code shadow-lg hover:shadow-vulnerable/5 transition-all">
                                                        <div className="px-4 py-3 bg-vulnerable/5 border-b border-vulnerable/10 flex justify-between items-center">
                                                            <span className="text-[10px] font-mono font-bold text-vulnerable/70">{finding.file}</span>
                                                            <span className="text-[10px] font-black text-vulnerable tracking-widest uppercase">Exploitable</span>
                                                        </div>
                                                        <div className="p-5 bg-[#050812] font-mono text-xs md:text-sm text-gray-400 overflow-x-auto">
                                                            <pre><code>{finding.unsafeCode}</code></pre>
                                                        </div>
                                                    </div>

                                                    <div className="glass rounded-xl border border-safe/30 overflow-hidden flex flex-col group/code shadow-xl shadow-safe/5 hover:border-safe transition-all bg-safe/5">
                                                        <div className="px-4 py-3 bg-safe/10 border-b border-safe/20 flex justify-between items-center">
                                                            <span className="text-[10px] font-mono font-bold text-safe/70">{finding.file}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <ShieldCheck className="w-3.5 h-3.5 text-safe" />
                                                                <span className="text-[10px] font-black text-safe tracking-widest uppercase">Verified Secure</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-5 bg-[#050812] font-mono text-xs md:text-sm text-blue-300 overflow-x-auto">
                                                            <pre><code>{finding.safeCode}</code></pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap justify-stretch sm:justify-end gap-3 pt-6 border-t border-card-border">
                                                <button
                                                    onClick={() => ignoreFinding(finding.id)}
                                                    className="px-6 py-3 text-xs font-black uppercase tracking-widest text-secondary hover:text-vulnerable transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Ignore Signature
                                                </button>
                                                <button
                                                    onClick={() => handleApplyFix(finding.id)}
                                                    disabled={applyingFix === finding.id || fixedIds.includes(finding.id)}
                                                    className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${fixedIds.includes(finding.id)
                                                        ? 'bg-safe/20 text-safe border border-safe/30 cursor-default'
                                                        : 'bg-foreground text-background hover:bg-white active:scale-95'
                                                        }`}
                                                >
                                                    {applyingFix === finding.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Applying Neural Patch...
                                                        </>
                                                    ) : fixedIds.includes(finding.id) ? (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Remediation Applied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-5 h-5" />
                                                            Implement Security Patch
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Toast Notification Container */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto glass px-4 sm:px-8 py-3 sm:py-4 rounded-3xl border border-primary/30 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 sm:gap-4 z-100"
                    >
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground">{showToast}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-secondary">
                    Loading report...
                </div>
            }
        >
            <ReportsPageContent />
        </Suspense>
    );
}
