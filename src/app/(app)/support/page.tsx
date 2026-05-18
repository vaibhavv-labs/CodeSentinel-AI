'use client';

import { useState } from 'react';
import { HelpCircle, MessageSquare, BookOpen, ExternalLink, Mail, Phone, Search, ChevronRight, Sparkles, LifeBuoy, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const faqs = [
        { q: "How does Neural Pattern Matching work?", a: "CodeTrust AI uses advanced LLMs fine-tuned on security forensic data to identify patterns that traditional static analysis tools miss, specifically looking for business logic flaws and multi-file vulnerabilities." },
        { q: "Can I integrate with my local CI/CD pipeline?", a: "Yes, we provide a robust CLI and specialized GitHub Actions/GitLab Runners that can trigger neural scans on every pull request." },
        { q: "What languages are currently supported?", a: "We officially support Python, JavaScript, TypeScript, Go, Java, and Rust. Experimental support for C++ and Swift is available for Enterprise users." },
        { q: "Is my source code stored on your servers?", a: "No. We utilize local-first processing where possible. For neural analysis, code snippets are processed in memory and immediately purged post-audit. We are SOC2 Type II compliant." },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
        }, 2000);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto relative min-h-screen">
            {/* Background 3D Elements */}
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-30">
                <div className="absolute top-0 right-[10%] w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full animate-float"></div>
                <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full animate-drift"></div>
            </div>

            {/* Header / Search Hero */}
            <div className="text-center space-y-6 py-8 md:py-12 relative z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex py-2 px-4 glass rounded-full border border-primary/20 bg-primary/5 mb-4"
                >
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <LifeBuoy className="w-3.5 h-3.5" /> Support Nexus 24/7
                    </span>
                </motion.div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black italic tracking-tighter">How can we <span className="gradient-text">Assist?</span></h1>
                <p className="text-secondary text-sm md:text-base max-w-2xl mx-auto font-medium">Search our forensic knowledge base or initiate a direct neural link with our security engineers.</p>

                <div className="max-w-2xl mx-auto relative mt-8 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for security protocols, API docs, scan limits..."
                        className="w-full pl-14 md:pl-16 pr-4 md:pr-6 py-4 md:py-5 bg-card/30 glass border border-card-border rounded-3xl text-sm font-bold focus:outline-none focus:border-primary/50 focus:bg-card transition-all placeholder:text-secondary/50 shadow-2xl"
                    />
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {[
                    { icon: BookOpen, label: 'Neural Docs', desc: 'Integration guides and forensic mapping documentation.', color: 'text-primary' },
                    { icon: MessageSquare, label: 'Community Feed', desc: 'Join 50k+ security experts in our forensic discussions.', color: 'text-safe' },
                    { icon: FileCode, label: 'CLI Binaries', desc: 'Binary downloads for local neural engine execution.', color: 'text-hallucinated' },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass p-6 md:p-8 rounded-3xl border border-card-border hover:border-primary/30 transition-all cursor-pointer group"
                    >
                        <item.icon className={`w-8 h-8 ${item.color} mb-6 group-hover:scale-110 transition-transform`} />
                        <h3 className="text-lg font-black italic mb-2 tracking-tight">{item.label}</h3>
                        <p className="text-xs text-secondary leading-relaxed mb-6 font-medium">{item.desc}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest group-hover:gap-3 transition-all">
                            Access Portal <ExternalLink className="w-3 h-3" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-8 md:pt-12 relative z-10">
                {/* FAQ Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black italic">Frequent <span className="gradient-text">Queries</span></h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="glass rounded-2xl border border-card-border overflow-hidden">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-card/30 transition-colors group"
                                >
                                    <span className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{faq.q}</span>
                                    <ChevronRight className={`w-5 h-5 text-secondary transition-transform duration-300 ${expandedFaq === i ? 'rotate-90 text-primary' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {expandedFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-5 pb-5"
                                        >
                                            <p className="text-xs text-secondary leading-relaxed pt-2 border-t border-card-border/50">
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Form */}
                <div className="glass p-5 sm:p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-card-border bg-card/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10">
                        <h3 className="text-2xl font-black italic mb-2">Direct <span className="gradient-text">Link</span></h3>
                        <p className="text-xs text-secondary mb-8 font-medium">Message our Level 3 Forensic Engineers directly. Responses usually within <span className="text-foreground">2 forensic cycles (24h)</span>.</p>

                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-widest px-1">Node Identifier</label>
                                        <input required type="text" placeholder="Alex Rivera" className="w-full px-5 py-3 bg-background/50 border border-card-border rounded-xl focus:outline-none focus:border-primary/50 transition-all font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-secondary font-black uppercase tracking-widest px-1">Forensic Email</label>
                                        <input required type="email" placeholder="arivera@codetrust.ai" className="w-full px-5 py-3 bg-background/50 border border-card-border rounded-xl focus:outline-none focus:border-primary/50 transition-all font-bold text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-secondary font-black uppercase tracking-widest px-1">Intercept Subject</label>
                                    <select className="w-full px-5 py-3 bg-background/50 border border-card-border rounded-xl focus:outline-none focus:border-primary/50 transition-all font-bold text-sm appearance-none cursor-pointer">
                                        <option>Neural Engine False Positives</option>
                                        <option>Enterprise Integration Support</option>
                                        <option>API & SDK Interaction Issues</option>
                                        <option>Security & Compliance Audit</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-secondary font-black uppercase tracking-widest px-1">Manifest Details</label>
                                    <textarea required rows={4} placeholder="Describe the neural anomaly or integration bottleneck encountered..." className="w-full px-5 py-3 bg-background/50 border border-card-border rounded-xl focus:outline-none focus:border-primary/50 transition-all font-bold text-sm resize-none" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50 mt-4"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>Initialize Transmission <Mail className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-safe/10 flex items-center justify-center mb-6 border border-safe/20">
                                    <Sparkles className="w-10 h-10 text-safe" />
                                </div>
                                <h4 className="text-xl font-black italic tracking-tight mb-2">Transmission Successful</h4>
                                <p className="text-sm text-secondary font-medium leading-relaxed max-w-xs">Our forensic engineers have received your intercept. Synchronization scheduled within 24h.</p>
                                <button onClick={() => setSubmitted(false)} className="mt-8 text-xs font-black text-primary hover:underline uppercase tracking-widest">Send Another Dispatch</button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Contact Info */}
            <div className="pt-12 border-t border-card-border flex flex-col items-center justify-center gap-6 relative z-10 text-center opacity-60">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-foreground transition-colors cursor-pointer">
                        <Mail className="w-4 h-4 text-primary" /> infra@codetrust.ai
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-foreground transition-colors cursor-pointer">
                        <Phone className="w-4 h-4 text-primary" /> +1 (888) NEURAL-AI
                    </div>
                </div>
                <p className="text-[9px] text-secondary/50 font-bold uppercase tracking-[0.3em]">CodeTrust AI Security Operations Center (SOC) - GLOBAL INTERCEPT</p>
            </div>
        </div>
    );
}
