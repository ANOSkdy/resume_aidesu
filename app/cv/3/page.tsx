'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PDFTrigger } from '@/components/pdf/PDFTrigger';
import { JobHistoryTrigger } from '@/components/pdf/JobHistoryTrigger';

export default function CVStep3() {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [fullData, setFullData] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const resumeId = localStorage.getItem('carrimy_resume_id');
    if (!resumeId) return;

    fetch('/api/data/resume?id=' + resumeId)
      .then(res => res.json())
      .then(data => {
        console.log("Full Data loaded:", data); // ブラウザコンソールで確認用
        setFullData(data);
        if (data.resume && data.resume.summary) {
          setSummary(data.resume.summary);
        }
      });
  }, []);

  const generateSummary = async () => {
    if (!fullData || !fullData.works || fullData.works.length === 0) {
      alert("職歴データが0件です。Step 4に戻ってデータを追加してください。");
      return;
    }
    setLoadingAI(true);
    
    try {
      // ★修正: 列名が company_name でなくても、Name や Company などよくある名前も探す
      // また、undefined が混入しないようにチェックする
      const careerText = fullData.works.map((w: any, index: number) => {
        const year = w.start_year || w.Year || '';
        const month = w.start_month || w.Month || '';
        // 列名の揺らぎを吸収
        const company = w.company_name || w.Name || w.Company || w.Title || '会社名不明';
        const desc = w.description || w.Description || w.Notes || '';
        
        return `【${index+1}社目】${year}年${month}月入社 ${company} ${desc}`;
      }).join('\n');

      console.log("Sending Career Text to AI:", careerText); // 送信内容を確認

      if (careerText.replace(/\s/g, '').length < 10) {
        alert("職歴データのテキスト化に失敗しました。データの中身が空のようです。");
        setLoadingAI(false);
        return;
      }

      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_text: careerText })
      });
      
      const json = await res.json();
      if (json.result) {
        setSummary(json.result);
      } else {
        alert('AI生成エラー: ' + (json.error || '不明なエラー'));
      }
    } catch (error) {
      alert('通信エラーが発生しました');
    } finally {
      setLoadingAI(false);
    }
  };

  const onSaveSummary = async () => {
    if (!fullData) return;
    try {
      const resumeId = localStorage.getItem('carrimy_resume_id');
      const userId = localStorage.getItem('carrimy_uid') || 'guest';
      
      const payload = {
        ...fullData.resume,
        user_id: userId,
        summary: summary
      };
      
      delete payload.createdTime;
      delete payload.fields;

      await fetch('/api/data/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setFullData({ ...fullData, resume: { ...fullData.resume, summary } });
      alert('保存しました！下のボタンからPDFをダウンロードできます。');

    } catch (error) {
      alert('保存失敗');
    }
  };

  const worksCount = fullData?.works?.length || 0;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">職務要約と仕上げ</h2>
      
      <div className="bg-green-50 p-4 rounded mb-6">
        <h3 className="font-bold text-sm mb-2 text-green-800">職務要約の自動生成</h3>
        <div className="text-xs text-green-700 mb-3">
           <p>登録されている職歴データ数: <strong>{worksCount}件</strong></p>
        </div>
        <Button onClick={generateSummary} isLoading={loadingAI} size="sm" className="bg-green-600 hover:bg-green-700">
          🤖 AIで職務要約を書く
        </Button>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-gray-700 mb-2">職務要約 (編集可能)</label>
        <textarea 
          className="w-full p-3 border rounded-md h-32"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <div className="text-right mt-2">
           <Button size="sm" variant="outline" onClick={onSaveSummary} disabled={!summary}>
             要約を保存してPDFに反映
           </Button>
        </div>
      </div>

      <hr className="my-8" />

      <div className="text-center p-8 border-2 border-dashed rounded-lg bg-gray-50">
        <h3 className="text-lg font-bold mb-6">🎉 応募書類の準備ができました</h3>
        {fullData ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">JIS規格フォーマット</p>
              <PDFTrigger data={fullData} />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">標準ビジネスフォーマット</p>
              <JobHistoryTrigger data={fullData} />
            </div>
          </div>
        ) : (
          <p>データを読み込み中...</p>
        )}
      </div>

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => router.push('/')}>トップへ戻る</Button>
      </div>
    </div>
  );
}
