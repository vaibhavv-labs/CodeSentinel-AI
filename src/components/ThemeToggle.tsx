'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSyncExternalStore } from 'react';

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const isClient = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    if (!isClient || !resolvedTheme) return <div className="w-10 h-10" />;

    const isDark = resolvedTheme === 'dark';

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2.5 rounded-xl glass-hover glass text-secondary hover:text-primary transition-all duration-300 flex items-center justify-center relative overflow-hidden"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <div className="relative w-5 h-5">
                <motion.div
                    initial={false}
                    animate={{
                        y: isDark ? 0 : 20,
                        opacity: isDark ? 1 : 0,
                        rotate: isDark ? 0 : 45
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute inset-0"
                >
                    <Moon className="w-5 h-5" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{
                        y: !isDark ? 0 : -20,
                        opacity: !isDark ? 1 : 0,
                        rotate: !isDark ? 0 : -45
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute inset-0"
                >
                    <Sun className="w-5 h-5" />
                </motion.div>
            </div>
        </motion.button>
    );
}
