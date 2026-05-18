'use client';

import { LayoutDashboard, Code, Clock, FileText, Settings, HelpCircle, Shield, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Code, label: 'Analyze Code', href: '/analyze' },
    { icon: Clock, label: 'Scan History', href: '/history' },
    { icon: FileText, label: 'Reports', href: '/reports' },
];

const preferenceItems = [
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: HelpCircle, label: 'Support', href: '/support' },
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className={`fixed left-0 top-0 h-screen w-[85vw] max-w-64 glass border-r border-card-border flex flex-col z-30 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 blur-[100px] pointer-events-none"></div>

            {/* Logo */}
            <div className="p-6 border-b border-card-border flex items-center justify-between relative z-10">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-foreground tracking-tighter">
                            CodeTrust <span className="gradient-text">AI</span>
                        </h1>
                    </div>
                </Link>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-card/50 rounded-lg md:hidden text-secondary hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 md:p-4 space-y-1 relative z-10 overflow-y-auto">
                <p className="text-[10px] text-secondary uppercase font-black tracking-widest px-4 mb-4 opacity-50">Main Menu</p>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                                ? 'sidebar-active shadow-xl shadow-primary/5'
                                : 'text-secondary hover:bg-card/40 hover:text-foreground'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active-indicator"
                                    className="absolute inset-0 bg-primary/10 border-r-2 border-primary"
                                />
                            )}
                            <Icon className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
                            <span className="font-bold text-sm relative z-10">{item.label}</span>
                            {!isActive && (
                                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="w-3 h-3 text-primary/40" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Preferences */}
            <div className="p-4 border-t border-card-border space-y-1 relative z-10 bg-card/10">
                <p className="text-[10px] text-secondary uppercase font-black tracking-widest px-4 mb-3 opacity-50">Preferences</p>
                {preferenceItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive
                                ? 'sidebar-active'
                                : 'text-secondary hover:bg-card/40 hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="font-bold text-xs">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Scan Quota Card */}
            <div className="p-4 md:p-5 m-3 md:m-4 glass rounded-2xl border border-primary/20 bg-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-xl translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <p className="text-[10px] text-secondary uppercase font-black tracking-widest">Neural Quota</p>
                    <div className="w-4 h-4 rounded-full bg-safe/20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse"></div>
                    </div>
                </div>
                <div className="flex items-baseline gap-1 mb-3 relative z-10">
                    <span className="text-2xl font-black italic">1,240</span>
                    <span className="text-secondary text-[10px] font-bold">/ 2,000 units</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden relative z-10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '62%' }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary to-blue-400"
                    />
                </div>
                <button className="w-full mt-4 py-2 bg-card border border-card-border rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-white transition-all">
                    Upgrade Tier
                </button>
            </div>
        </aside>
    );
}
