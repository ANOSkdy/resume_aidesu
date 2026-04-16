import Link from 'next/link';
import React from 'react';

interface AppShellProps {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell = ({ title, footer, children }: AppShellProps) => {
  const mainPaddingBottom = footer ? 'pb-24' : 'pb-8';

  return (
    <div className="flex min-h-screen flex-col text-sumi">
      <header className="wa-ink-divider fixed inset-x-0 top-0 z-20 bg-white/92 shadow-[0_4px_14px_rgba(6,199,85,0.12)] backdrop-blur-sm">
        <div className="relative flex h-14 w-full items-center justify-between px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-ai px-3 py-1 text-sm font-bold tracking-[0.04em] text-white focus-visible:wa-focus"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-white/90" />
            Aidesu
          </Link>
          {title ? (
            <p className="ml-4 flex-1 truncate text-right text-sm font-semibold text-sumi">
              {title}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pt-14" style={{ WebkitOverflowScrolling: 'touch' }}>
        <main className={`w-full px-4 ${mainPaddingBottom}`}>
          {children}
        </main>
      </div>

      {footer ? (
        <footer className="wa-ink-divider fixed inset-x-0 bottom-0 z-20 bg-white/94 shadow-[0_-6px_16px_rgba(6,199,85,0.12)] backdrop-blur-sm">
          <div className="px-4 py-3">
            {footer}
          </div>
        </footer>
      ) : null}
    </div>
  );
};
