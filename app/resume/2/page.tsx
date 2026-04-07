'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResumeStep2() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/resume/3');
  }, [router]);

  return (
    <div className="py-8 text-center text-sm text-gray-600">
      次の入力画面へ移動しています...
    </div>
  );
}
