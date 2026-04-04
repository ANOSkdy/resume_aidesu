'use client';

import React, { useEffect, useState } from 'react';

type Option = {
  id: string;
  category: string;
  name: string;
};

type Props = {
  category: string; // 'occupation' | 'industry' | 'location'
  selected: string[];
  onChange: (values: string[]) => void;
  maxSelect?: number;
};

let lookupCache: Option[] | null = null;
let lookupCachePromise: Promise<Option[]> | null = null;

const loadLookupOptions = async (): Promise<Option[]> => {
  if (lookupCache) return lookupCache;
  if (!lookupCachePromise) {
    lookupCachePromise = fetch('/api/data/lookups')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch lookup options');
        return res.json() as Promise<Option[]>;
      })
      .then((data) => {
        lookupCache = data;
        return data;
      })
      .finally(() => {
        lookupCachePromise = null;
      });
  }
  return lookupCachePromise;
};

export const TagSelector = ({ category, selected = [], onChange, maxSelect = 3 }: Props) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLookupOptions()
      .then((data: Option[]) => {
        // 指定カテゴリのみ抽出
        const filtered = data.filter(d => d.category === category);
        setOptions(filtered);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [category]);

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name));
    } else {
      if (selected.length >= maxSelect) return;
      onChange([...selected, name]);
    }
  };

  if (loading) return <div className="text-sm text-nezumi/70">Loading options...</div>;
  if (options.length === 0) return <div className="text-sm text-nezumi/70">選択肢がありません (Lookupsデータ未登録)</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt.name);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.name)}
            className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-[transform,background-color,border-color,color] wa-motion-ui focus-visible:wa-focus ${
              isActive
                ? 'bg-ai text-kinari border-ai'
                : 'bg-white/85 text-nezumi border-[var(--border)] hover:bg-kinari active:bg-kinari/90'
            }`}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
};
