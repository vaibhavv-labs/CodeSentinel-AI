'use client';

import { useState, useRef } from 'react';
import { Play, FileCode, AlertCircle, Sparkles, CheckCircle2, RotateCcw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// --- TYPES FOR YOUR FLASK API ---
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
            if (!res.ok) {
                throw new Error(text);
            }
            throw new Error('Server returned an invalid JSON response');
        }
    }

    if (!res.ok) {
        const message =
            data &&
            typeof data === 'object' &&
            'error' in data &&
            typeof data.error === 'string'
                ? data.error
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
    return cursor.fetchone()`
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
});`
    }
};

type LanguageKey = keyof typeof LANGUAGES;

export default function AnalyzePage() {
    const [selectedLang, setSelectedLang] = useState<LanguageKey>('python');
    const [code, setCode] = useState(LANGUAGES['python'].snippet);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [analyzing, setAnalyzing] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);

    const [showFix, setShowFix] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [fixedCode, setFixedCode] = useState("");
    const [currentScanId, setCurrentScanId] = useState<string | null>(null);

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAnalyzed(false);
        setScanResults([]);

        try {
            const res = await fetch(`/api/scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            });

            const data = await readApiJson<ScanApiResponse>(res);

            if (data.id) {
                setCurrentScanId(data.id);
            }

            const vulnerabilities = data.vulnerabilities ?? data.scan_results ?? [];

            if (Array.isArray(vulnerabilities)) {
                const formattedResults = vulnerabilities.map((v: any) => ({
                    line_number: v.lineNumber ?? v.line_number,
                    code: v.codeSnippet ?? v.code,
                    label: v.label,
                    label_name: v.labelName ?? v.label_name,
                    confidence: v.confidence,
                }));

                setScanResults(formattedResults);
            }

        } catch (error) {
            console.error("Scan failed:", error);
        } finally {
            setAnalyzing(false);
            setAnalyzed(true);
        }
    };

    const handleGenerateFix = async () => {
        if (!currentScanId) return;

        setShowFix(true);
        setIsFixing(true);
        setFixedCode("");

        try {
            const res = await fetch(`/api/fix`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    scan_results: scanResults,
                    scanId: currentScanId
                })
            });

            const data = await readApiJson<FixApiResponse>(res);

            if (data.fixed_code) {
                setFixedCode(data.fixed_code);
            } else {
                setFixedCode(data.error ?? "No fix generated.");
            }

        } catch (error) {
            console.error("Fix failed:", error);
            setFixedCode("Error generating fix.");
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

    const issues = scanResults.filter(res => res.label !== 1);

    return (
        <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-visible lg:overflow-hidden relative">

            {/* Code Editor Panel */}
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
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">

                        <button
                            onClick={resetCode}
                            className="p-2 text-secondary hover:text-foreground hover:bg-card/50 rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="px-4 sm:px-5 md:px-6 py-2 bg-primary hover:bg-blue-600 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 whitespace-nowrap"
                        >
                            {analyzing ? 'Analyzing...' : 'Analyze Code'}
                        </button>
                    </div>
                </div>

                {/* ORIGINAL EDITOR */}
                <div className="flex-1 relative overflow-hidden group min-h-[340px]">

                    <textarea
                        ref={textAreaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-primary resize-none outline-none p-4 sm:p-6 font-mono text-sm leading-relaxed z-10 overflow-auto"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                    />

                    <pre className="absolute inset-0 py-4 sm:py-6 pr-4 sm:pr-6 pl-4 sm:pl-6 font-mono text-sm leading-relaxed pointer-events-none overflow-auto">
                        <code className="language-python">

                            {code.split('\n').map((line, idx) => {

                                const issue = scanResults.find(
                                    res => res.line_number === idx + 1 && res.label !== 1
                                );

                                return (
                                    <div
                                        key={idx}
                                        className={`px-2 rounded transition-colors ${
                                            issue
                                                ? issue.label === 0
                                                    ? 'bg-red-500/10 border-l-2 border-red-500'
                                                    : 'bg-yellow-500/10 border-l-2 border-yellow-500'
                                                : ''
                                        }`}
                                    >
                                        <span className="inline-block w-8 text-secondary/40 select-none">
                                            {idx + 1}
                                        </span>

                                        <span className="text-blue-300 whitespace-pre">
                                            {line}
                                        </span>
                                    </div>
                                );
                            })}

                        </code>
                    </pre>
                </div>
            </div>
        </div>
    );
}
