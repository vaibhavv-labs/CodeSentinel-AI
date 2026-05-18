'use client';

import { useState } from 'react';
import { useSession, signOut } from "next-auth/react";
import {
  Search, User, Menu, Settings,
  LogOut, ChevronDown
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {

  const { data: session } = useSession();

  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 glass border-b border-card-border z-20 backdrop-blur-xl">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4">

        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-card/50 rounded-xl md:hidden"
        >
          <Menu className="w-5 h-5 text-secondary" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-card/50 border border-card-border rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">

          <ThemeToggle />

          {/* Profile */}
          <div className="relative">

            <div
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-xl cursor-pointer border border-card-border max-w-[70vw]"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session?.user?.name ? `${session.user.name} avatar` : 'User avatar'}
                    width={32}
                    height={32}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="hidden lg:block">
                <p className="text-xs font-bold">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-[10px] text-secondary">
                  {session?.user?.email}
                </p>
              </div>

              <ChevronDown className="w-3 h-3 text-secondary hidden sm:block" />
            </div>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 mt-3 w-56 bg-card rounded-2xl border border-card-border shadow-xl"
                >

                  <div className="p-4 border-b border-card-border">
                    <p className="text-[10px] text-secondary uppercase">
                      Signed in as
                    </p>
                    <p className="text-xs font-bold break-all">
                      {session?.user?.email}
                    </p>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-card/50"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-xs font-bold">Settings</span>
                    </Link>
                  </div>

                  <div className="p-2 border-t border-card-border">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-red-500/10 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs font-bold">
                        Logout
                      </span>
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </header>
  );
}
