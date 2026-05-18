'use client';

import { Mail, Lock, ArrowRight, User, Github } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from "next-auth/react";

export default function SignupPage() {

    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ✅ Create account
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || "Signup failed");
            setIsLoading(false);
            return;
        }

        // ✅ auto login after signup
        const loginRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setIsLoading(false);

        if (loginRes?.error) {
            setError("Account created but login failed");
            return;
        }

        router.replace("/dashboard");

    };

    return (
        <form
            onSubmit={handleSignup}
            className="glass p-5 sm:p-8 rounded-3xl border border-card-border shadow-2xl space-y-8"
        >

            <div className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                    Create Account
                </h1>
                <p className="text-secondary text-sm">
                    Join the next generation of AI code security
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="text-red-500 text-sm text-center">
                    {error}
                </div>
            )}

            <div className="space-y-4">

                {/* Name */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-secondary ml-1">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Rivera"
                            className="w-full pl-12 pr-4 py-3 border rounded-xl text-sm"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-secondary ml-1">
                        Work Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full pl-12 pr-4 py-3 border rounded-xl text-sm"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-secondary ml-1">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-4 py-3 border rounded-xl text-sm"
                        />
                    </div>
                </div>

            </div>

            {/* Signup button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
                {isLoading ? "Creating account..." : "Create Account"}
                <ArrowRight className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="text-center text-xs uppercase font-bold text-secondary">
                OR
            </div>

            {/* OAuth */}
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
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold">
                    Sign In
                </Link>
            </p>

        </form>
    );
}
