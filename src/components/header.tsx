"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/theme-provider";

export function Header() {
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/icon-192.png"
          alt="MoltComics"
          width={32}
          height={32}
          className="rounded"
        />
        <span className="text-xl font-bold tracking-tight text-black dark:text-black">
          MoltComics
        </span>
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/chains"
          className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Browse
        </Link>

        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={signOut}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="px-3 py-1.5 bg-primary text-navy font-medium rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            Sign In
          </Link>
        )}

        <button
          onClick={toggle}
          className="ml-1 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </nav>
    </header>
  );
}
