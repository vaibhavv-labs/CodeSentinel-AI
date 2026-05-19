'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, FileCode, AlertCircle, Sparkles, CheckCircle2, RotateCcw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// --- TYPES ---
interface ScanResult {
    line_number: number;
    code: string;
    label: number;
    label_name: string;
    confidence: number;
}

interface ApiVulnerability {
    lineNumber: number;
    codeSnippet: string;
    label: number;
    labelName: string;
    confidence: number;
}

interface ScanApiResponse {
    id?: string;
    vulnerabilities?: ApiVulnerability[];
    scan_results?: ScanResult[];
    error?: string;
}

interface FixApiResponse {
    fixed_code?: string;
    error?: string;
    message?: string;
}

async function readApiJson<T extends object>(res: Response): Promise<T> {
    const text = await res.text();
    let data: unknown = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            if (!res.ok) throw new Error(text);
            throw new Error('Server returned an invalid JSON response');
        }
    }
    if (!res.ok) {
        const message =
            data && typeof data === 'object' && 'error' in data && typeof (data as Record<string, unknown>).error === 'string'
                ? (data as { error: string }).error
                : 'Request failed';
        throw new Error(message);
    }
    return data as T;
}

const LANGUAGES = {
    python: {
        name: 'Python',
        version: '3.10',
        snippet: `import sqlite3

def get_user(id):
    clean = SQLSanitizer.clean(id)
    query = 'SELECT * FROM users WHERE id=' + clean
    cursor.execute(query)
    return cursor.fetchone()`,
    },
    javascript: {
        name: 'JavaScript',
        version: 'Node.js 18',
        snippet: `const express = require('express');
const app = express();
const db = require('./db');

app.get('/search', (req, res) => {
    const query = req.query.q;
    const sql = "SELECT * FROM items WHERE name = '" + query + "'";
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});`,
    },
};

type LanguageKey = keyof typeof LANGUAGES;

// Keyword sets for syntax highlighting
const KEYWORDS = ['import', 'from', 'def', 'async', 'await', 'return', 'class',
    'try', 'except', 'finally', 'if', 'else', 'elif', 'for', 'while',
    'with', 'as', 'pass', 'break', 'continue', 'raise', 'yield',
    'const', 'let', 'var', 'function', 'require', 'new', 'this'];

function getWordClass(word: string): string {
    const trimmed = word.trim();
    if (KEYWORDS.includes(trimmed)) return 'text-purple-400';
    if (/^['"`].*['"`]$/.test(trimmed)) return 'text-green-400';
    if (/^\d+$/.test(trimmed)) return 'text-orange-400';
    if (trimmed.includes('(')) return 'text-yellow-300';
    return 'text-blue-300';
}

export default function AnalyzePage() {
    const [selectedLang, setSelectedLang] = useState<LanguageKey>('python');
    const [code, setCode] = useState(LANGUAGES['python'].snippet);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [analyzing, setAnalyzing] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);

    const [showFix, setShowFix] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [fixedCode, setFixedCode] = useState('');
    const [currentScanId, setCurrentScanId] = useState<string | null>(null);

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const scrollWrapperRef = useRef<HTMLDivElement>(null);

    // FIX 1: Lock body scroll when fix overlay is open (prevents background scroll-through on mobile)
    useEffect(() => {
        if (showFix) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [showFix]);

    // FIX 2: Tab key support
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const next = code.substring(0, start) + '    ' + code.substring(end);
            setCode(next);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + 4;
            });
        }
    };

    // FIX 3: Sync scroll from the wrapper div down to the textarea
    // (textarea is overflow:hidden, wrapper is the real scroll container)
    const handleScrollWrapperScroll = () => {
        const wrapper = scrollWrapperRef.current;
        const ta = textAreaRef.current;
        if (!wrapper || !ta) return;
        ta.scrollTop = wrapper.scrollTop;
        ta.scrollLeft = wrapper.scrollLeft;
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAnalyzed(false);
        setScanResults([]);
        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await readApiJson<ScanApiResponse>(res);
            if (data.id) setCurrentScanId(data.id);
            const vulnerabilities = data.vulnerabilities ?? data.scan_results ?? [];
            if (Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
                const formatted = (vulnerabilities as Array<ApiVulnerability | ScanResult>).map((v) => {
                    if ('lineNumber' in v) {
                        return { line_number: v.lineNumber, code: v.codeSnippet, label: v.label, label_name: v.labelName, confidence: v.confidence };
                    }
                    return v;
                });
                setScanResults(formatted);
            }
        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setAnalyzing(false);
            setAnalyzed(true);
        }
    };

    const handleGenerateFix = async () => {
        if (!currentScanId) return;
        setShowFix(true);
        setIsFixing(true);
        setFixedCode('');
        try {
            const res = await fetch('/api/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, scan_results: scanResults, scanId: currentScanId }),
            });
            const data = await readApiJson<FixApiResponse>(res);
            setFixedCode(data.fixed_code ?? data.error ?? 'No fix generated.');
        } catch (error) {
            setFixedCode(error instanceof Error ? error.message : 'Error connecting to backend.');
        } finally {
            setIsFixing(false);
        }
    };

    const resetCode = () => {
        setCode(LANGUAGES[selectedLang].snippet);
        setAnalyzed(false);
        setShowFix(false);
        setScanResults([]);
    };

    const handleLanguageChange = (lang: LanguageKey) => {
        setSelectedLang(lang);
        setCode(LANGUAGES[lang].snippet);
        setIsDropdownOpen(false);
        setAnalyzed(false);
        setShowFix(false);
        setScanResults([]);
    };

    const issues = scanResults.filter((r) => r.label !== 1);

    return (
        // FIX 4: overflow-hidden (not overflow-visible) on root — prevents mobile bleed
        <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden relative">

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse-glow" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
            </div>

            {/* ── LEFT: Code Editor Panel ── */}
            <div className="flex-1 flex flex-col border-r-0 lg:border-r border-card-border bg-[#0A0F1E] min-h-[380px] lg:min-h-[400px] z-10">

                {/* Toolbar */}
                <div className="min-h-14 glass border-b border-card-border px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 relative">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                            <FileCode className="w-4 h-4 text-primary" />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 font-medium text-sm hover:text-primary transition-colors focus:outline-none"
                            >
                                {LANGUAGES[selectedLang].name}
                                <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-48 bg-[#0A0F1E] border border-card-border rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                                    >
                                        {(Object.keys(LANGUAGES) as LanguageKey[]).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => handleLanguageChange(lang)}
                                                className={`w-full px-4 py-2 text-left text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors ${selectedLang === lang ? 'text-primary bg-white/5' : 'text-secondary'}`}
                                            >
                                                {LANGUAGES[lang].name}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={resetCode} className="p-2 text-secondary hover:text-foreground hover:bg-card/50 rounded-lg transition-colors">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="px-4 sm:px-5 md:px-6 py-2 bg-primary hover:bg-blue-600 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 whitespace-nowrap"
                        >
                            {analyzing
                                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
                                : <><Play className="w-4 h-4" />Analyze Code</>
                            }
                        </button>
                    </div>
                </div>

                {/*
                  ── FIX 5: Editor Area ──
                  Architecture:
                    • Outer div: overflow-hidden, clips everything
                    • scrollWrapperRef div: the ONE real scroll container (overflow-auto,
                      WebkitOverflowScrolling:touch). Both layers live inside this.
                    • Inner div: min-w-max so long lines expand width correctly.
                    • <pre>: flows naturally (not absolute), determines height/width.
                    • <textarea>: absolute inset-0, overflow:hidden (no scrollbars),
                      follows the wrapper's scroll via onScroll sync.
                  This eliminates the double-scroll-container problem entirely.
                */}
                <div className="flex-1 relative overflow-hidden min-h-[340px]">
                    {/* Single scroll container */}
                    <div
                        ref={scrollWrapperRef}
                        className="absolute inset-0 overflow-auto"
                        onScroll={handleScrollWrapperScroll}
                        style={{
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'contain',
                        }}
                    >
                        {/* Width expands to longest line */}
                        <div className="relative min-w-max min-h-full">

                            {/* Syntax-highlighted overlay — NOT absolute, sets the natural size */}
                            <pre
                                aria-hidden="true"
                                className="font-mono text-sm leading-relaxed pointer-events-none select-none m-0"
                                style={{ padding: '1.5rem 2.5rem 1.5rem 3.5rem' }}
                            >
                                <code className="block">
                                    {code.split('\n').map((line, i) => {
                                        const lineNum = i + 1;
                                        const flaggedIssue = scanResults.find(
                                            (r) => r.line_number === lineNum && r.label !== 1
                                        );
                                        let highlightClass = '';
                                        if (analyzed && flaggedIssue) {
                                            highlightClass = flaggedIssue.label === 0
                                                ? 'bg-red-500/20 border-l-2 border-red-500'
                                                : 'bg-yellow-500/20 border-l-2 border-yellow-500';
                                        }
                                        return (
                                            <div key={i} className={`flex w-full ${highlightClass}`}>
                                                <span className="text-gray-600 w-10 flex-shrink-0 text-right pr-4 select-none italic">
                                                    {lineNum}
                                                </span>
                                                <span className="text-gray-400 whitespace-pre">
                                                    {line.match(/(\s+|\S+)/g)?.map((word, j) => (
                                                        <span key={j} className={getWordClass(word)}>{word}</span>
                                                    )) || line}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </code>
                            </pre>

                            {/* Transparent textarea — absolute, no own scrollbars */}
                            <textarea
                                ref={textAreaRef}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                className="
                                    absolute inset-0
                                    w-full h-full
                                    font-mono text-sm leading-relaxed
                                    bg-transparent text-transparent
                                    resize-none focus:outline-none
                                    overflow-hidden
                                    whitespace-pre
                                    z-10
                                "
                                style={{
                                    /* Must match pre padding exactly so caret aligns with highlighted text */
                                    padding: '1.5rem 2.5rem 1.5rem 3.5rem',
                                    caretColor: 'white',
                                    fontSize: '0.875rem',   /* >= 16px equivalent prevents iOS zoom */
                                    lineHeight: '1.625',
                                    WebkitUserSelect: 'text',
                                    userSelect: 'text',
                                    touchAction: 'pan-x pan-y',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Results Panel ── */}
            <div className="w-full lg:w-[420px] flex flex-col bg-background/80 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-card-border min-h-[300px] lg:h-auto overflow-auto z-10">
                <div className="h-14 glass border-b border-card-border px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
                    <h2 className="font-bold tracking-tight">AI Audit Results</h2>
                </div>

                <AnimatePresence mode="wait">
                    {!analyzed && !analyzing && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6"
                        >
                            <div className="relative w-24 h-24 rounded-3xl glass border border-primary/40 flex items-center justify-center animate-float">
                                <Sparkles className="w-10 h-10 text-primary" />
                            </div>
                            <p className="font-extrabold text-xl text-foreground">Awaiting Analysis</p>
                        </motion.div>
                    )}

                    {analyzing && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 space-y-8"
                        >
                            <p className="text-sm font-bold text-primary animate-pulse tracking-widest uppercase">
                                Scanning Neural Patterns
                            </p>
                        </motion.div>
                    )}

                    {analyzed && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex-1 p-4 sm:p-6 space-y-6"
                        >
                            {issues.length > 0 ? (
                                <>
                                    {issues.map((issue, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            className={`glass p-6 rounded-2xl border ${issue.label === 0 ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}
                                        >
                                            <span className={`text-[10px] font-black tracking-widest uppercase mb-1 ${issue.label === 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                                                {issue.label_name} (Line {issue.line_number})
                                            </span>
                                            <div className="mt-2 p-3 rounded-xl bg-black/20 border border-white/5 font-mono text-xs text-secondary whitespace-pre-wrap break-all">
                                                {issue.code}
                                            </div>
                                        </motion.div>
                                    ))}

                                    <button
                                        onClick={handleGenerateFix}
                                        className="w-full py-4 bg-foreground text-background rounded-xl font-bold hover:bg-gray-200 transition-all shadow-xl flex items-center justify-center gap-3"
                                    >
                                        <Sparkles className="w-5 h-5" /> Generate Secure Fix
                                    </button>

                                    {currentScanId && (
                                        <Link
                                            href={`/reports?scanId=${currentScanId}`}
                                            className="w-full inline-flex py-3 border border-card-border rounded-xl text-xs font-black uppercase tracking-widest justify-center hover:border-primary/30 hover:bg-card/30 transition-all"
                                        >
                                            Open Full Report
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center glass rounded-2xl border border-safe/30">
                                    <CheckCircle2 className="w-12 h-12 text-safe mx-auto mb-4" />
                                    <p className="font-bold text-safe">Zero vulnerabilities detected!</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── AI Fix Overlay ── */}
            <AnimatePresence>
                {showFix && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                        // FIX 6: tap outside to close on mobile
                        onClick={(e) => { if (e.target === e.currentTarget) setShowFix(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            className="w-full max-w-2xl glass rounded-3xl border border-primary/30 p-4 sm:p-8 space-y-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                            // FIX 7: stop touch events from bleeding to the body
                            style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black flex gap-3 items-center">
                                    <Sparkles className="text-primary" /> AI Proposed Fix
                                </h2>
                                <button onClick={() => setShowFix(false)} className="text-secondary hover:text-white">
                                    <AlertCircle className="rotate-45" />
                                </button>
                            </div>

                            <div className="glass rounded-xl border border-safe/30 overflow-hidden">
                                <div className="px-4 py-2 border-b border-safe/20 bg-safe/5 text-[10px] font-bold text-safe uppercase tracking-widest">
                                    Remediated Code
                                </div>
                                {/* FIX 8: horizontal scroll on fixed code block */}
                                <div
                                    className="p-6 bg-[#0A0F1E] font-mono text-sm text-blue-300 overflow-auto max-h-[300px]"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    {isFixing ? (
                                        <div className="flex items-center gap-3 animate-pulse text-secondary">
                                            <Sparkles className="w-4 h-4 animate-spin" /> Generating secure logic...
                                        </div>
                                    ) : (
                                        <pre className="whitespace-pre min-w-max"><code>{fixedCode}</code></pre>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowFix(false);
                                    if (fixedCode) setCode(fixedCode);
                                    setAnalyzed(false);
                                    setScanResults([]);
                                }}
                                disabled={isFixing}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
                            >
                                Apply Fix Locally
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
