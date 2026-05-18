'use client';

import { useState, useEffect, Suspense } from 'react';
import { User, Bell, Shield, Key, Globe, LogOut, Check, Save, Zap, Activity, Network as NetworkIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

function SettingToggle({ label, value, initialEnabled = false, desc }: { label: string, value?: string, initialEnabled?: boolean, desc?: string }) {
    const [enabled, setEnabled] = useState(initialEnabled);
    return (
        <div className="p-5 glass rounded-2xl border border-card-border flex items-center justify-between group hover:border-primary/20 transition-all">
            <div className="space-y-0.5">
                <p className="text-[9px] text-secondary font-black uppercase tracking-[0.15em] opacity-60">{label}</p>
                {value ? <p className="text-sm font-bold">{value}</p> : <p className="text-xs text-secondary">{desc}</p>}
            </div>
            <div
                onClick={() => setEnabled(!enabled)}
                className={`w-12 h-6 rounded-full relative p-1 transition-all cursor-pointer ${enabled ? 'bg-primary' : 'bg-card-border'}`}
            >
                <motion.div
                    animate={{ x: enabled ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-lg"
                />
            </div>
        </div>
    );
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || 'profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // --- API KEYS STATE (Moved inside the component!) ---
    interface ApiKeyItem {
        id: string;
        name: string;
        key: string;
        createdAt: string;
    }

    const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
    const [isCreatingKey, setIsCreatingKey] = useState(false);

    // 1. Pull in the session and the update function
    const { data: session, update } = useSession();

    // 2. Track the input states for saving to the DB
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");

    // 3. Sync local state when the session loads
    useEffect(() => {
        if (session?.user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName(session.user.name || "");
            setEmail(session.user.email || "");
        }
    }, [session]);

    const userInitials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'US';

    useEffect(() => {
        if (tabParam) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Fetch API Keys when tab is active
    useEffect(() => {
        if (activeTab === 'api') {
            fetch('/api/keys')
                .then(res => res.json())
                .then(data => setApiKeys(data))
                .catch(err => console.error(err));
        }
    }, [activeTab]);

    // Handle Creating a new API Key
    const handleCreateKey = async () => {
        setIsCreatingKey(true);
        try {
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `CodeTrust Interface ${apiKeys.length + 1}` })
            });
            
            if (res.ok) {
                const newKey = await res.json();
                setApiKeys([newKey, ...apiKeys]); // Update UI instantly
            }
        } catch (error) {
            console.error("Failed to create key", error);
        } finally {
            setIsCreatingKey(false);
        }
    };

    // 4. The real save function hitting your profile API route
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, bio })
            });

            if (res.ok) {
                await update({ name, email });
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                console.error("Failed to save profile");
            }
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'api', icon: Key, label: 'API Keys' },
        { id: 'notifications', icon: Bell, label: 'Alerts' },
        { id: 'network', icon: Globe, label: 'Network' },
        { id: 'advanced', icon: Sparkles, label: 'Advanced' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto relative min-h-screen">
            {/* Background 3D Elements */}
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-20">
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full animate-drift"></div>
                <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full animate-float"></div>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-3 text-primary font-black text-[10px] tracking-widest uppercase"
                    >
                        <Zap className="w-4 h-4" /> System Configuration
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter">Control <span className="gradient-text">Matrix</span></h1>
                    <p className="text-secondary text-sm mt-3 max-w-xl font-medium">Manage your neural identity, security protocols, and integration primitives.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto px-6 md:px-8 py-3 bg-foreground text-background rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95 shadow-xl disabled:opacity-50"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                    ) : saved ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Syncing...' : saved ? 'Archived' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <div className="lg:hidden -mx-1 px-1 overflow-x-auto pb-2">
                        <div className="flex gap-2 min-w-max">
                            {tabs.map((tab) => (
                                <button
                                    key={`mobile-${tab.id}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'glass bg-primary/10 border border-primary/30 text-primary'
                                        : 'text-secondary border border-card-border hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`hidden lg:flex w-full items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${activeTab === tab.id
                                ? 'glass bg-primary/10 border-primary/30 text-primary'
                                : 'text-secondary hover:bg-card/40 hover:text-foreground'
                                }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                                />
                            )}
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary' : 'text-secondary group-hover:text-foreground'}`} />
                            <span className="font-bold text-sm">{tab.label}</span>
                        </button>
                    ))}

                    <div className="pt-3 lg:pt-8 px-0 lg:px-4">
                        <Link href="/login" className="w-full flex items-center gap-3 p-4 rounded-2xl text-vulnerable hover:bg-vulnerable/10 transition-all font-black text-xs uppercase tracking-widest border border-vulnerable/20">
                            <LogOut className="w-4 h-4" /> Terminate Session
                        </Link>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass p-4 sm:p-6 md:p-8 rounded-3xl border border-card-border bg-card/5 min-h-[500px]"
                        >
                            {activeTab === 'profile' && (
                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row items-center gap-8 border-b border-card-border pb-8">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                                                {userInitials}
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-xl hover:scale-110 transition-all">
                                                <Activity className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-center sm:text-left space-y-2">
                                            <h3 className="text-2xl font-black italic">{name || "Loading Node..."}</h3>
                                            <p className="text-sm text-secondary font-medium uppercase tracking-[0.2em] opacity-60">Enterprise Security Administrator</p>
                                            <div className="flex gap-2 justify-center sm:justify-start">
                                                <span className="px-3 py-1 bg-safe/10 text-safe text-[10px] font-black rounded-full border border-safe/20">VERIFIED NODE</span>
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full border border-primary/20">PREMIUM TIER</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-widest px-1">Display Descriptor</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-5 py-3 bg-background/50 border border-card-border rounded-xl focus:outline-none focus:border-primary/50 transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-secondary font-black uppercase tracking-widest px-1">Forensic Email</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-5 py-3 bg-background/50 border border-card-border rounded-xl focus:outline-none focus:border-primary/50 transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-widest px-1">Operational Bio</label>
                                        <textarea
                                            rows={3}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Overseeing neural security audits for the legacy API gateway systems. Expert in forensic pattern matching."
                                            className="w-full px-5 py-3 bg-background/50 border border-card-border rounded-xl focus:outline-none focus:border-primary/50 transition-all font-bold resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-8">
                                    <div className="p-6 rounded-2xl border border-vulnerable/20 bg-vulnerable/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black italic">Two-Factor Authentication</p>
                                            <p className="text-xs text-secondary leading-relaxed">Secure your neural node with biometric or hardware-key authentication.</p>
                                        </div>
                                        <button className="px-6 py-2.5 bg-vulnerable text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-vulnerable/10">Configure</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { label: 'Neural Session Timeout', value: '30 Minutes' },
                                            { label: 'Audit Log Retention', value: '90 Days' },
                                            { label: 'Risk Threshold Alert', value: 'Level 8.0+' },
                                            { label: 'Auto-Remediate', value: 'In-active' },
                                        ].map((setting, i) => (
                                            <SettingToggle key={i} label={setting.label} value={setting.value} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'api' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-card-border pb-6">
                                        <h3 className="text-xl font-black italic">Neural Interface Keys</h3>
                                        <button 
                                            onClick={handleCreateKey}
                                            disabled={isCreatingKey}
                                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isCreatingKey ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Zap className="w-4 h-4" />}
                                            {isCreatingKey ? 'Generating...' : 'Create Key'}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {apiKeys.length === 0 ? (
                                            <div className="text-center p-8 text-secondary font-medium text-sm border border-dashed border-card-border rounded-2xl">
                                                No interface keys generated yet. Create one to authenticate external neural scans.
                                            </div>
                                        ) : (
                                            apiKeys.map((key) => (
                                                <div key={key.id} className="p-6 glass rounded-2xl border border-card-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-primary/20 transition-all group">
                                                    <div className="space-y-1">
                                                        <p className="font-black italic text-sm">{key.name}</p>
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-xs font-mono text-secondary bg-background/50 px-3 py-1 rounded-md">
                                                                {key.key.substring(0, 12)}************************
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-secondary font-black uppercase opacity-50 mb-1">Created</p>
                                                        <p className="text-xs font-bold whitespace-nowrap">
                                                            {new Date(key.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8">
                                    <p className="text-sm text-secondary font-medium leading-relaxed">Choose how CodeTrust AI communicates critical forensic findings to your team.</p>
                                    <div className="space-y-4">
                                        {[
                                            { title: 'Slack Intercepts', desc: 'Instant audit reports in your security channel.', active: true },
                                            { title: 'Email Forensic Digest', desc: 'Weekly summary of all neural patterns found.', active: false },
                                            { title: 'Critical Push Webhooks', desc: 'Zero-latency alerts for high-risk vulnerabilities.', active: true },
                                            { title: 'Browser Signatures', desc: 'Desktop notifications for active scan status.', active: false },
                                        ].map((n, i) => (
                                            <SettingToggle key={i} label={n.title} desc={n.desc} initialEnabled={n.active} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'network' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-card-border pb-6">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black italic">Network Topology</h3>
                                            <p className="text-xs text-secondary">Configure your scanners to route through custom enterprise infrastructure.</p>
                                        </div>
                                        <NetworkIcon className="w-8 h-8 text-primary/40" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { label: 'VPN Tunneling', desc: 'Route all scans through internal VPN.', active: false },
                                            { label: 'Dedicated IP', desc: 'Use a static IP for all outbound requests.', active: true },
                                            { label: 'TLS Inspection', desc: 'Allow deep packet analysis for scanning.', active: true },
                                            { label: 'Custom DNS', desc: 'Resolve private hostnames during audits.', active: false },
                                        ].map((n, i) => (
                                            <SettingToggle key={i} label={n.label} desc={n.desc} initialEnabled={n.active} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="space-y-8">
                                    <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <p className="text-sm font-black italic flex items-center justify-center sm:justify-start gap-2">
                                                <Sparkles className="w-4 h-4 text-primary" /> Neural Optimizer v4.0
                                            </p>
                                            <p className="text-xs text-secondary leading-relaxed">Early access to experimental AI detection models and hardware acceleration hooks.</p>
                                        </div>
                                        <button className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/10">Request Access</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { label: 'Deep Trace mode', desc: 'Collect verbose execution graphs.', active: false },
                                            { label: 'Hallucination Beta', desc: 'Advanced detection for non-existent code.', active: true },
                                            { label: 'Hardware Acceleration', desc: 'Use local CUDA/MPS for faster scans.', active: false },
                                            { label: 'Custom Training', desc: 'Fine-tune models on your codebase.', active: false },
                                        ].map((n, i) => (
                                            <SettingToggle key={i} label={n.label} desc={n.desc} initialEnabled={n.active} />
                                        ))}
                                    </div>

                                    <div className="p-4 bg-vulnerable/5 border border-vulnerable/20 rounded-xl">
                                        <p className="text-[10px] text-vulnerable text-center font-bold uppercase tracking-widest">
                                            Caution: Advanced features may impact scan stability.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!(activeTab === 'profile' || activeTab === 'security' || activeTab === 'api' || activeTab === 'notifications' || activeTab === 'network' || activeTab === 'advanced') && (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 animate-pulse">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tight">Node Optimization in Progress</h3>
                                    <p className="text-sm text-secondary max-w-xs leading-relaxed">Detailed network telemetry and data governance modules are currently being synchronized.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto glass px-4 sm:px-8 py-3 sm:py-4 rounded-3xl border border-primary/30 shadow-2xl flex items-center justify-center gap-3 sm:gap-4 z-[100]"
                    >
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Configuration Synchronized</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary">Loading Settings...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
