'use client';

import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-primary/30">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-3d-grid opacity-[0.02]"></div>
            </div>

            {/* Navigation Header */}
            <header className="relative z-10 p-4 sm:p-6 md:p-8 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-110">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">CodeTrust <span className="gradient-text">AI</span></span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {children}
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 p-4 sm:p-6 md:p-8 text-center">
                <p className="text-xs text-secondary">
                    © 2024 CodeTrust AI. Secured by Enterprise-Grade Encryption.
                </p>
            </footer>
        </div>
    );
}
