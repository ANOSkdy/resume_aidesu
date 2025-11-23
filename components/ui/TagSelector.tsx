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

export const TagSelector = ({ category, selected = [], onChange, maxSelect = 3 }: Props) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // マスタデータ取得 (本来はSWRやReact Queryでキャッシュすべきですが簡易実装)
    fetch('/api/data/lookups')
      .then(res => res.json())
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

  if (loading) return <div className="text-sm text-gray-400">Loading options...</div>;
  if (options.length === 0) return <div className="text-sm text-gray-400">選択肢がありません (Lookupsデータ未登録)</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt.name);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.name)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
};
