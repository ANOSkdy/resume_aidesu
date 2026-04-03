import Link from 'next/link';
import React from 'react';

export const Header = () => {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tighter">
          Carrime
        </Link>
        <nav className="flex gap-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">ホーム</Link>
          <span className="text-gray-300">|</span>
          <span className="cursor-not-allowed">ログイン</span>
        </nav>
      </div>
    </header>
  );
};
