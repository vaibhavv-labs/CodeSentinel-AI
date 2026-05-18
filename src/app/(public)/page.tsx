'use client';

import { Shield, Zap, Lock, Code, Database, AlertTriangle, Key, Terminal, ArrowRight, PlayCircle, Menu, X, CheckCircle, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 20 + 15,
  delay: Math.random() * 10,
  symbol: ['<>', '{}', '//', '&&', '=>', '[]', '/*', '**', '!=', '=='][i % 10],
}));

const FEATURES = [
  { icon: Database, label: 'SQL Injection', color: 'from-red-500/20 to-red-600/5', border: 'border-red-500/20', iconColor: 'text-red-400', desc: 'Detect parameterized query violations and injection vectors in real time.' },
  { icon: Code, label: 'XSS Attacks', color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/20', iconColor: 'text-orange-400', desc: 'Identify unsanitized input rendering and DOM manipulation vulnerabilities.' },
  { icon: Terminal, label: 'Path Traversal', color: 'from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/20', iconColor: 'text-yellow-400', desc: 'Catch directory traversal attacks targeting your file system resources.' },
  { icon: AlertTriangle, label: 'Command Injection', color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20', iconColor: 'text-purple-400', desc: 'Detect shell command injection and OS command execution vulnerabilities.' },
  { icon: Key, label: 'Hardcoded Secrets', color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20', iconColor: 'text-blue-400', desc: 'Find exposed API keys, passwords, and credentials in your codebase.' },
  { icon: Lock, label: 'Weak Crypto', color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20', iconColor: 'text-green-400', desc: 'Flag deprecated algorithms, weak keys, and insecure hashing methods.' },
];

const STEPS = [
  { num: '01', title: 'Paste Your Code', desc: 'Drop any code snippet — Python, JavaScript, PHP, Java, or SQL — into the intelligent editor.' },
  { num: '02', title: 'AI Deep Scan', desc: 'GraphCodeBERT analyzes every line, detecting vulnerabilities with 98.4% accuracy in under 5 seconds.' },
  { num: '03', title: 'Get Secure Fix', desc: 'Receive hardened, production-ready code with detailed explanations for every vulnerability found.' },
];

const PLANS = [
  {
    name: 'Free', price: '$0', period: '/mo', desc: 'Perfect for individual developers.',
    features: ['50 scans/month', 'XSS & SQL detection', 'Basic reports', 'VS Code extension'],
    cta: 'Start Free', highlight: false,
  },
  {
    name: 'Pro', price: '$29', period: '/mo', desc: 'For serious security-conscious teams.',
    features: ['Unlimited scans', 'All 6 vulnerability types', 'AI-powered auto-fix', 'Priority support', 'API access', 'Team dashboard'],
    cta: 'Start Pro Trial', highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', desc: 'Security at enterprise scale.',
    features: ['On-premise deployment', 'SAML/SSO integration', 'Custom AI training', 'Dedicated manager', 'SLA guarantee', 'Audit compliance'],
    cta: 'Contact Sales', highlight: false,
  },
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-[#0A0F1E] min-h-screen text-foreground selection:bg-primary/30 overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between gap-3 ${scrolled ? 'glass border-b border-white/5 shadow-2xl shadow-black/20' : ''}`}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">CodeTrust <span className="gradient-text">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-secondary">
          <a href="#features" className="hover:text-foreground transition-colors hover:text-primary">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors hover:text-primary">How It Works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors hover:text-primary">Pricing</a>
          <Link href="/login" className="px-4 py-2 glass border border-white/10 rounded-xl hover:border-primary/40 transition-all font-bold text-foreground text-xs uppercase tracking-widest">Sign In</Link>
          <Link href="/signup" className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">Get Started</Link>
        </div>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-white/5 rounded-xl text-secondary">
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full glass border-b border-white/5 md:hidden p-6 flex flex-col gap-4">
              {['#features', '#how', '#pricing'].map((href, i) => (
                <a key={i} href={href} onClick={() => setIsMenuOpen(false)} className="text-base font-bold text-secondary hover:text-primary transition-colors">
                  {href.replace('#', '').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </a>
              ))}
              <Link href="/login" className="py-3 text-center border border-white/10 rounded-xl font-bold text-sm" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              <Link href="/signup" className="py-3 text-center bg-primary text-white rounded-xl font-bold text-sm" onClick={() => setIsMenuOpen(false)}>Get Started Free</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 md:px-10 pt-20">
        {/* Particle canvas */}
        <div className="absolute inset-0 pointer-events-none">
          {PARTICLES.map(p => (
            <motion.div key={p.id}
              initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 0 }}
              animate={{ y: [`${p.y}vh`, `${p.y - 30}vh`, `${p.y}vh`], opacity: [0, 0.15, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute font-mono text-primary/40 text-xs select-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size * 8}px` }}>
              {p.symbol}
            </motion.div>
          ))}
          {/* Glow orbs */}
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
          {/* Grid */}
          <div className="absolute inset-0 bg-3d-grid opacity-[0.025]" />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-black uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
            AI-Powered Security • Now in Beta
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.95] tracking-tighter mb-6">
            <span className="text-foreground">Your Code.</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500 bg-clip-text text-transparent animate-[gradient_3s_ease_infinite] bg-[length:200%_auto]">Bulletproof.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-secondary max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            GraphCodeBERT-powered vulnerability detection that finds SQL injection, XSS, path traversal, and more — then generates secure fixes instantly.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup"
              className="group px-8 py-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-primary/30 hover:scale-105 hover:bg-blue-500 active:scale-95 transition-all">
              Start Free Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/analyze"
              className="group px-8 py-4 glass border border-white/10 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:border-primary/40 hover:bg-white/5 active:scale-95 transition-all">
              <PlayCircle className="w-4 h-4 text-primary" />
              Watch Demo
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-secondary">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['B', 'K', 'A', 'R', 'J'].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-[#0A0F1E] flex items-center justify-center text-[9px] font-black text-white">{l}</div>
                ))}
              </div>
              <span className="text-xs font-bold">10,000+ developers trust CodeTrust AI</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
              <span className="text-xs font-bold ml-1">4.9/5 rating</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-secondary/40">
          <span className="text-[10px] uppercase tracking-widest font-bold">Scroll</span>
          <ChevronRight className="w-4 h-4 rotate-90" />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 sm:px-6 md:px-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-primary text-xs font-black uppercase tracking-widest mb-4">What We Detect</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Every Attack Vector. <span className="gradient-text">Covered.</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-secondary text-lg max-w-2xl mx-auto">
              Our model is trained on real-world exploits across 50,000+ code patterns.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`group relative glass p-7 rounded-3xl border ${f.border} bg-gradient-to-br ${f.color} hover:shadow-2xl transition-all duration-300 cursor-default`}>
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 30px rgba(255,255,255,0.02)` }} />
                <div className={`w-12 h-12 rounded-2xl bg-white/5 border ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="text-lg font-black mb-2">{f.label}</h3>
                <p className="text-secondary text-sm leading-relaxed">{f.desc}</p>
                <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <ChevronRight className={`w-4 h-4 ${f.iconColor}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-4 sm:px-6 md:px-10 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-primary text-xs font-black uppercase tracking-widest mb-4">3 Simple Steps</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black tracking-tight">
              From Vulnerable to <span className="gradient-text">Bulletproof</span>
            </motion.h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden md:block" />

            <div className="space-y-12">
              {STEPS.map((step, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="flex-1 glass p-8 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group">
                    <p className="text-5xl font-black text-primary/20 group-hover:text-primary/40 transition-colors mb-3 font-mono">{step.num}</p>
                    <h3 className="text-2xl font-black mb-3">{step.title}</h3>
                    <p className="text-secondary leading-relaxed">{step.desc}</p>
                  </div>
                  {/* Center dot */}
                  <div className="hidden md:flex w-6 h-6 rounded-full bg-primary border-4 border-[#0A0F1E] shadow-lg shadow-primary/50 flex-shrink-0 z-10" />
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-primary text-xs font-black uppercase tracking-widest mb-4">Pricing</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Simple. <span className="gradient-text">Transparent.</span> Fair.
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-secondary text-lg">No hidden fees. Cancel anytime.</motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            {PLANS.map((plan, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative glass p-8 rounded-3xl border flex flex-col transition-all duration-300 ${plan.highlight
                  ? 'border-primary shadow-2xl shadow-primary/20 bg-primary/5 scale-105'
                  : 'border-white/6 hover:border-white/12'}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-[10px] font-black rounded-full tracking-widest uppercase shadow-lg shadow-primary/30">
                    ✦ Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <p className="text-xs font-black uppercase tracking-widest text-secondary mb-3">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-5xl font-black">{plan.price}</span>
                    {plan.period && <span className="text-secondary text-sm font-medium">{plan.period}</span>}
                  </div>
                  <p className="text-secondary text-sm">{plan.desc}</p>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-primary' : 'text-secondary'}`} />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/signup"
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest text-center transition-all hover:scale-105 active:scale-95 ${plan.highlight
                    ? 'bg-primary text-white hover:bg-blue-500 shadow-xl shadow-primary/20'
                    : 'glass border border-white/10 hover:border-primary/30 hover:bg-white/5'}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-4 sm:px-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-violet-900/30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Ready to Ship <span className="gradient-text">Secure Code?</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-secondary text-lg mb-10 max-w-2xl mx-auto">
            Join 10,000+ developers who trust CodeTrust AI to keep their code bulletproof.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="group px-10 py-5 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-105 hover:bg-blue-500 active:scale-95 transition-all">
              Start Free — No Card Needed
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-4 sm:px-6 md:px-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
            <div className="space-y-4 max-w-xs">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-black">CodeTrust <span className="gradient-text">AI</span></span>
              </Link>
              <p className="text-secondary text-sm leading-relaxed">AI-powered code vulnerability detection and auto-remediation for modern development teams.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              {[
                { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
                { title: 'Developers', links: ['Documentation', 'API Reference', 'VS Code Extension', 'GitHub'] },
                { title: 'Company', links: ['About', 'Blog', 'Privacy Policy', 'Terms'] },
              ].map((col, i) => (
                <div key={i}>
                  <p className="text-xs font-black uppercase tracking-widest text-secondary mb-4">{col.title}</p>
                  <div className="space-y-3">
                    {col.links.map((link, j) => (
                      <a key={j} href="#" className="block text-secondary hover:text-foreground transition-colors">{link}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-secondary">© 2025 CodeTrust AI. All rights reserved.</p>
            <p className="text-xs text-secondary">Built with ❤️ for developers who care about security</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
