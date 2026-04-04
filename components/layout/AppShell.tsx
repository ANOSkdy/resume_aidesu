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
      <header className="wa-ink-divider fixed inset-x-0 top-0 z-20 bg-kinari/90 backdrop-blur-sm">
        <div className="relative flex h-14 w-full items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.03em] text-ai focus-visible:wa-focus"
          >
            Aidesu
          </Link>
          {title ? (
            <p className="ml-4 flex-1 truncate text-right text-sm font-medium text-nezumi">
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
        <footer className="wa-ink-divider fixed inset-x-0 bottom-0 z-20 bg-kinari/90 backdrop-blur-sm">
          <div className="px-4 py-3">
            {footer}
          </div>
        </footer>
      ) : null}
    </div>
  );
};
