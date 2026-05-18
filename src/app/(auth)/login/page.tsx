'use client';

import { Mail, Lock, ArrowRight, Github } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        console.log("SIGNIN RESPONSE:", res);

        setIsLoading(false);

        if (res?.error) {
            setError("Invalid email or password");
            return;
        }

        router.replace("/dashboard");
    };

    return (
        <form
            onSubmit={handleLogin}
            className="glass p-5 sm:p-8 rounded-3xl border border-card-border shadow-2xl space-y-8"
        >

            <div className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                    Welcome Back
                </h1>
                <p className="text-secondary text-sm">
                    Enter your credentials to access your dashboard
                </p>
            </div>

            {error && (
                <div className="text-red-500 text-sm text-center">
                    {error}
                </div>
            )}

            <div className="space-y-4">

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-secondary ml-1">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border rounded-xl text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-black uppercase text-secondary">
                            Password
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs font-bold text-primary hover:underline transition-all"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-background/50 border border-card-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>

            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
                {isLoading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs uppercase font-bold text-secondary">
                OR
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                <button
                    type="button"
                    onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                    className="w-full py-3 border rounded-xl font-bold flex items-center justify-center gap-3"
                >
                    <Github className="w-5 h-5" /> GitHub
                </button>

                <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    className="w-full py-3 border rounded-xl font-bold"
                >
                    Google
                </button>

            </div>

            <p className="text-center text-sm text-secondary">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-bold">
                    Create Account
                </Link>
            </p>

        </form>
    );
}
