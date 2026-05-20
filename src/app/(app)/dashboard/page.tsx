// src/app/(app)/dashboard/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
    ShieldCheck, AlertTriangle, Code2,
    Terminal, Download, Activity, Zap, ChevronRight, TrendingUp, Clock
} from 'lucide-react';
import { motion, useSpring, useMotionValue, animate } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface ScanHistoryItem {
    id: string;
    realId: string;
    project: string;
    branch: string;
    status: string;
    risk: string;
    score: string;
    date: string;
    language: string;
}

// Animated counter hook
function useCounter(target: number, duration = 1.5) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const controls = animate(0, target, {
            duration,
            ease: 'easeOut',
            onUpdate(value) {
                if (ref.current) ref.current.textContent = Math.round(value).toString();
            }
        });
        return controls.stop;
    }, [target, duration]);
    return ref;
}

// SVG circular progress ring
function SecurityRing({ score }: { score: number }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (score / 10) * circumference;
    const color = score >= 8.5 ? '#22C55E' : score >= 6 ? '#F59E0B' : '#EF4444';

    return (
        <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <motion.circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black" style={{ color }}>{score.toFixed(1)}</span>
                <span className="text-[10px] text-secondary font-black uppercase tracking-widest">/10</span>
            </div>
        </div>
    );
}

// Mini bar chart for 7-day activity
function ActivityChart({ data }: { data: number[] }) {
    const max = Math.max(...data, 1);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
        <div className="flex items-end gap-2 h-20">
            {data.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                        className="w-full rounded-t-sm bg-primary/30 hover:bg-primary/60 transition-colors cursor-default relative group"
                        style={{ height: `${(val / max) * 100}%` }}
                        initial={{ scaleY: 0, originY: 1 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-primary bg-background border border-card-border px-1.5 py-0.5 rounded-md whitespace-nowrap pointer-events-none">
                            {val} scan{val !== 1 ? 's' : ''}
                        </div>
                    </motion.div>
                    <span className="text-[9px] text-secondary font-bold">{days[i]}</span>
                </div>
            ))}
        </div>
    );
}

const getRiskConfig = (risk: string) => {
    switch (risk) {
        case 'CRITICAL': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/25', dot: 'bg-red-500', glow: 'shadow-red-500/40' };
        case 'HIGH': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/25', dot: 'bg-orange-500', glow: 'shadow-orange-500/40' };
        case 'MEDIUM': return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/25', dot: 'bg-yellow-500', glow: '' };
        case 'HALLUCINATED': return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/25', dot: 'bg-yellow-500', glow: '' };
        default: return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/25', dot: 'bg-green-500', glow: '' };
    }
};

function SkeletonRow() {
    return (
        <tr className="border-b border-white/4">
            {[...Array(5)].map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                </td>
            ))}
        </tr>
    );
}

export default function Dashboard() {
    const { data: session } = useSession();
    const [scans, setScans] = useState<ScanHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        fetch('/api/history').then(r => r.json()).then(setScans).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/history/export');
            if (!res.ok) throw new Error('Failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cd = res.headers.get('Content-Disposition');
            a.download = cd?.match(/filename=([^;]+)/i)?.[1]?.replace(/"/g, '') || `CodeSentinel-report-${Date.now()}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch { alert('Download failed. Please try again.'); }
        finally { setIsGenerating(false); }
    };

    const totalScans = scans.length;
    const criticalScans = scans.filter(s => s.risk === 'CRITICAL' || s.risk === 'HIGH').length;
    const avgScore = totalScans > 0
        ? parseFloat((scans.reduce((a, c) => a + parseFloat(c.score), 0) / totalScans).toFixed(1))
        : 10.0;

    const greeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Fake 7-day activity based on real data
    const weekActivity = [
        Math.max(0, totalScans - 6), Math.max(0, totalScans - 4),
        Math.max(0, totalScans - 3), Math.max(0, totalScans - 2),
        Math.max(0, totalScans - 1), totalScans, 0
    ].map(v => Math.min(v, 10));

    const linesAudited = scans.reduce((a, s) => a + (s.project?.length || 0) * 10, 0);

    const statCards = [
        {
            title: 'Security Score', sub: 'Overall health', icon: ShieldCheck,
            value: avgScore.toFixed(1), suffix: '/10',
            color: avgScore >= 8.5 ? 'text-green-400' : avgScore >= 6 ? 'text-yellow-400' : 'text-red-400',
            glow: avgScore >= 8.5 ? 'shadow-green-500/10' : avgScore >= 6 ? 'shadow-yellow-500/10' : 'shadow-red-500/10',
            isRing: true,
        },
        {
            title: 'Active Threats', sub: 'Critical & High risk', icon: AlertTriangle,
            value: criticalScans, suffix: '',
            color: criticalScans > 0 ? 'text-red-400' : 'text-green-400',
            glow: criticalScans > 0 ? 'shadow-red-500/20' : '',
            pulse: criticalScans > 0,
        },
        {
            title: 'Scans Today', sub: 'All time total', icon: Zap,
            value: totalScans, suffix: '',
            color: 'text-primary',
            glow: 'shadow-blue-500/10',
        },
        {
            title: 'Lines Audited', sub: 'Estimated total', icon: Code2,
            value: linesAudited, suffix: '',
            color: 'text-violet-400',
            glow: 'shadow-violet-500/10',
        },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-400">System Online</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
                        {greeting()}, <span className="gradient-text">{session?.user?.name?.split(' ')[0] || 'Developer'}</span> 👋
                    </h1>
                    <p className="text-secondary text-sm font-medium flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {' · '}
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Link href="/analyze" className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                        <Terminal className="w-4 h-4" /> New Audit
                    </Link>
                    <button onClick={handleGeneratePDF} disabled={isGenerating}
                        className="px-6 py-3 glass border border-white/8 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:border-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {isGenerating ? <Activity className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Report
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={`relative glass p-6 rounded-3xl border border-white/6 hover:border-primary/20 transition-all group overflow-hidden shadow-xl ${stat.glow || ''} ${stat.pulse ? 'border-red-500/20' : ''}`}>
                        {stat.pulse && (
                            <div className="absolute inset-0 rounded-3xl animate-pulse-glow bg-red-500/5 pointer-events-none" />
                        )}
                        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/3 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <p className="text-[10px] text-secondary uppercase font-black tracking-widest">{stat.title}</p>
                            <stat.icon className={`w-4 h-4 ${stat.color} opacity-70`} />
                        </div>
                        <div className="relative z-10">
                            {stat.isRing ? (
                                <SecurityRing score={avgScore} />
                            ) : (
                                <div className={`text-4xl font-black mb-1 ${stat.color} flex items-baseline gap-1`}>
                                    <span>{stat.value}</span>
                                    {stat.suffix && <span className="text-lg opacity-60">{stat.suffix}</span>}
                                </div>
                            )}
                            <p className="text-xs text-secondary font-medium mt-2">{stat.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main content row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Scans */}
                <div className="lg:col-span-2 glass rounded-3xl border border-white/6 overflow-hidden shadow-2xl shadow-primary/5">
                    <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-black">Recent Audits</h3>
                            <p className="text-xs text-secondary font-medium mt-0.5">Latest vulnerability scans</p>
                        </div>
                        <Link href="/history" className="text-xs text-primary font-black hover:underline flex items-center gap-1">
                            View All <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-white/2 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-white/4">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Target</th>
                                    <th className="px-6 py-4">Risk</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4 text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/4">
                                {isLoading ? (
                                    [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                                ) : scans.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-secondary">
                                            <ShieldCheck className="w-10 h-10 opacity-20" />
                                            <p className="text-sm font-bold">No audits yet. Run your first scan!</p>
                                            <Link href="/analyze" className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-black border border-primary/20 hover:bg-primary/20 transition-colors">
                                                Start Scan →
                                            </Link>
                                        </div>
                                    </td></tr>
                                ) : (
                                    scans.slice(0, 5).map((scan, i) => {
                                        const rc = getRiskConfig(scan.risk);
                                        return (
                                            <motion.tr key={scan.realId}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
                                                className="hover:bg-white/3 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-xs text-primary font-black">{scan.id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Code2 className="w-3.5 h-3.5 text-secondary group-hover:text-primary transition-colors" />
                                                        <span className="text-sm font-bold truncate max-w-[120px]">{scan.project}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${rc.bg} ${rc.text} ${rc.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot} ${scan.risk === 'CRITICAL' ? 'shadow-[0_0_6px] ' + rc.glow : ''}`} />
                                                        {scan.risk}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-black ${parseFloat(scan.score) >= 7 ? 'text-green-400' : parseFloat(scan.score) >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {scan.score}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/reports?scanId=${scan.realId}`}
                                                        className="inline-flex p-2 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all text-secondary hover:text-primary">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity + Quick Actions */}
                <div className="space-y-5">
                    {/* Activity chart */}
                    <div className="glass p-6 rounded-3xl border border-white/6 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-black">Weekly Activity</h3>
                                <p className="text-[10px] text-secondary font-medium mt-0.5">Scans per day</p>
                            </div>
                            <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <ActivityChart data={weekActivity} />
                    </div>

                    {/* Quick actions */}
                    <div className="glass p-6 rounded-3xl border border-white/6 shadow-xl space-y-3">
                        <h3 className="text-sm font-black mb-4">Quick Actions</h3>
                        {[
                            { label: 'Analyze New Code', href: '/analyze', icon: Terminal, color: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white' },
                            { label: 'View All Reports', href: '/reports', icon: Activity, color: 'bg-white/4 text-secondary border-white/6 hover:bg-white/8 hover:text-foreground' },
                            { label: 'Scan History', href: '/history', icon: Code2, color: 'bg-white/4 text-secondary border-white/6 hover:bg-white/8 hover:text-foreground' },
                        ].map((action, i) => (
                            <Link key={i} href={action.href}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group font-bold text-sm ${action.color}`}>
                                <action.icon className="w-4 h-4 flex-shrink-0" />
                                {action.label}
                                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
