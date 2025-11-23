// components/pdf/ResumeDocument.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// フォント登録 (publicフォルダのローカルフォントを参照)
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: '10mm',
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    lineHeight: 1.3,
  },
  // テーブル罫線用
  tableBorder: {
    borderTop: '1px solid #000',
    borderLeft: '1px solid #000',
    width: '100%',
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    minHeight: 24,
    alignItems: 'stretch',
  },
  cell: {
    borderRight: '1px solid #000',
    padding: 4,
    justifyContent: 'center',
  },
  // 幅調整
  w10: { width: '10%' },
  w5:  { width: '5%' },
  w15: { width: '15%' },
  w70: { width: '70%' },
  w85: { width: '85%' },
  
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  label: { fontSize: 8, marginBottom: 2, color: '#555' },
  center: { textAlign: 'center' },
  bold: { fontWeight: 'bold' },
});

// 行コンポーネント
const HistoryRow = ({ year, month, content }: { year: string, month: string, content: string }) => (
  <View style={styles.row}>
    <View style={[styles.cell, styles.w10]}><Text style={styles.center}>{year}</Text></View>
    <View style={[styles.cell, styles.w5]}><Text style={styles.center}>{month}</Text></View>
    <View style={[styles.cell, styles.w85]}><Text>{content}</Text></View>
  </View>
);

// データ型定義 (Airtableの生データを受け取る想定)
type ResumeData = {
  resume: any;
  educations: any[];
  works: any[];
};

export const ResumeDocument = ({ data }: { data: ResumeData }) => {
  const { resume, educations, works } = data;
  const safeResume = resume || {};

  // 日付フォーマット等のヘルパー
  const today = new Date();

  // 学歴・職歴を結合して時系列順に並べる処理
  const histories = [
    ...(educations || []).map((e: any) => ({
      year: e.start_year, month: e.start_month, content: `${e.school_name} 入学`, type: 'edu'
    })),
    ...(educations || []).map((e: any) => ({
      year: e.end_year, month: e.end_month, content: `${e.school_name} ${e.degree || ''} 卒業`, type: 'edu'
    })),
    ...(works || []).map((w: any) => ({
      year: w.start_year, month: w.start_month, content: `${w.company_name} 入社`, type: 'work'
    })),
    ...(works || []).map((w: any) => ({
      year: w.end_year || 9999, month: w.end_month || 12, 
      content: w.is_current ? '現在に至る' : `${w.company_name} 退社`, type: 'work'
    })),
  ].sort((a, b) => (a.year - b.year) || (a.month - b.month));

  // 空行埋め (レイアウト崩れ防止)
  const MAX_LINES = 18;
  const emptyLines = Array.from({ length: Math.max(0, MAX_LINES - histories.length) });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 }}>
           <Text style={styles.header}>履歴書</Text>
           <Text style={{ fontSize: 10 }}>{today.getFullYear()}年 {today.getMonth()+1}月 {today.getDate()}日 現在</Text>
        </View>

        {/* 基本情報ブロック */}
        <View style={[styles.tableBorder, { marginBottom: 10 }]}>
          <View style={styles.row}>
            <View style={{ width: '75%', borderRight: '1px solid #000' }}>
              {/* ふりがな */}
              <View style={[styles.row, { borderBottom: '1px dotted #ccc', minHeight: 18 }]}>
                <View style={[styles.cell, styles.w15, { borderRight: 'none' }]}><Text style={styles.label}>ふりがな</Text></View>
                <View style={[styles.cell, styles.w85, { borderRight: 'none' }]}>
                   <Text>{safeResume.last_name_kana} {safeResume.first_name_kana}</Text>
                </View>
              </View>
              {/* 氏名 */}
              <View style={{ padding: 10 }}>
                <Text style={styles.label}>氏　　名</Text>
                <Text style={{ fontSize: 24, textAlign: 'center', marginTop: 10 }}>
                  {safeResume.last_name_kanji}　{safeResume.first_name_kanji}
                </Text>
              </View>
              {/* 生年月日 */}
              <View style={[styles.row, { borderTop: '1px solid #000', borderBottom: 'none' }]}>
                 <View style={[styles.cell, { width: '100%', borderRight: 'none' }]}>
                    <Text style={styles.center}>
                      {safeResume.dob_year}年 {safeResume.dob_month}月 {safeResume.dob_day}日生 （満 20代）
                    </Text>
                 </View>
              </View>
            </View>
            {/* 性別欄 (簡易) */}
            <View style={{ width: '25%' }}>
               <View style={[styles.cell, { borderRight: 'none', height: '100%' }]}>
                 <Text style={styles.label}>性別</Text>
                 <Text style={[styles.center, { marginTop: 20 }]}>{safeResume.gender}</Text>
               </View>
            </View>
          </View>
        </View>

        {/* 学歴・職歴ブロック */}
        <View style={styles.tableBorder}>
          <View style={[styles.row, { backgroundColor: '#eee', minHeight: 18 }]}>
             <View style={[styles.cell, styles.w10]}><Text style={styles.center}>年</Text></View>
             <View style={[styles.cell, styles.w5]}><Text style={styles.center}>月</Text></View>
             <View style={[styles.cell, styles.w85]}><Text style={styles.center}>学歴・職歴</Text></View>
          </View>
          
          {histories.map((h, i) => (
             <HistoryRow key={i} year={h.year === 9999 ? '' : h.year.toString()} month={h.year === 9999 ? '' : h.month.toString()} content={h.content} />
          ))}
          
          <HistoryRow year="" month="" content="以上" />
          
          {emptyLines.map((_, i) => (
             <HistoryRow key={`empty-${i}`} year="" month="" content="" />
          ))}
        </View>
      </Page>
      
      {/* 2ページ目: 自己PR・要約 */}
      <Page size="A4" style={styles.page}>
         <View style={styles.tableBorder}>
            <View style={[styles.cell, { width: '100%', borderRight: 'none', height: 250, justifyContent: 'flex-start' }]}>
               <Text style={styles.label}>職務要約</Text>
               <Text style={{ marginTop: 5 }}>{safeResume.summary}</Text>
            </View>
            <View style={[styles.cell, { width: '100%', borderRight: 'none', borderTop: '1px solid #000', height: 250, justifyContent: 'flex-start' }]}>
               <Text style={styles.label}>志望の動機、自己PR、アピールポイントなど</Text>
               <Text style={{ marginTop: 5 }}>{safeResume.self_pr}</Text>
            </View>
         </View>
      </Page>
    </Document>
  );
};