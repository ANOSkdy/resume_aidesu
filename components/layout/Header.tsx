import Link from 'next/link';
import React from 'react';

export const Header = () => {
  return (
    <header className="wa-ink-divider bg-kinari/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-ai tracking-tighter">
          Aidesu
        </Link>
        <nav className="flex gap-4 text-sm text-nezumi">
          <Link href="/" className="hover:text-ai">ホーム</Link>
          <span className="text-nezumi/40">|</span>
          <span className="cursor-not-allowed">ログイン</span>
        </nav>
      </div>
    </header>
  );
};
