'use client';

import { Mail, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {

    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {

        setLoading(true);

        await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        setLoading(false);
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="glass p-5 sm:p-8 rounded-3xl border border-card-border shadow-2xl space-y-8 max-w-md w-full relative z-10">
                {!isSubmitted ? (
                    <>
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
                            <p className="text-secondary text-sm">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-secondary ml-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                    <input
                                        type="email"
                                        placeholder="name@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-background/50 border border-card-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !email}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send Reset Link
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm font-bold text-secondary hover:text-foreground inline-flex items-center gap-2 transition-colors">
                                <ChevronLeft className="w-4 h-4" /> Back to Login
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-10 h-10 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Check your email</h2>
                            <p className="text-secondary text-sm">
                                We&apos;ve sent a password reset link to <span className="text-foreground font-medium">{email}</span>.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Link
                                href="/login"
                                className="inline-block w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/25"
                            >
                                Return to login
                            </Link>
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="mt-4 text-sm font-medium text-secondary hover:text-foreground transition-colors"
                            >
                                Didn&apos;t receive the email? Try again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
