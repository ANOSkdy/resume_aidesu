import 'server-only';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'node:path';

// フォント登録
const notoSansSrc = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.ttf');

try {
  Font.register({
    family: 'NotoSansJP',
    src: notoSansSrc,
  });
} catch (error) {
  console.error('Failed to register NotoSansJP font', error);
}

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },

  // ヘッダー (タイトル等)
  headerContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
  },

  // セクション共通
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#eee',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderColor: '#444',
  },
  content: {
    marginLeft: 2,
    lineHeight: 1.6,
  },

  // --- テーブル・セル設定 ---
  // ヘッダー行スタイル
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    minHeight: 24,
  },
  
  // データ行
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1, 
    borderLeftWidth: 1,
    borderRightWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#ccc',
    minHeight: 24,
    backgroundColor: '#fff',
  },

  cell: {
    borderRightWidth: 1, 
    borderColor: '#ccc',
    padding: 6,
    justifyContent: 'flex-start',
  },
  lastCell: {
    borderRightWidth: 0,
    padding: 6,
    justifyContent: 'flex-start',
  },

  // 列幅設定
  colDate: { width: '25%' },
  colDesc: { width: '75%' },
  colFull: { width: '100%' },

  bold: { fontWeight: 'bold' },
  
  // --- 会社名表示用スタイル ---
  workEntryContainer: {
    marginTop: 12,
    marginBottom: 2, 
  },
  companyTitleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2, 
    marginLeft: 2,
  },
});

type ResumeData = {
  resume: any;
  works: any[];
};

const sanitizeLines = (input: unknown): string[] => {
  if (!input) return [];
  if (typeof input === 'string') {
    return input.split(/\r?\n/).map((item) => item.trim()).filter((item) => item.length > 0);
  }
  if (Array.isArray(input)) {
    return input.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((item) => item.length > 0);
  }
  return [];
};

const removeExperienceHeading = (items: string[]): string[] => {
  return items.filter((item, index) => {
    const normalized = item.replace(/[【】]/g, '');
    if (index === 0 && /活かせる経験・?知識|応募先で活かせる/.test(normalized)) {
      return false;
    }
    return true;
  });
};

export const JobHistoryDocument = ({ data }: { data: ResumeData }) => {
  const { resume, works } = data;
  const safeResume = resume || {};
  const safeWorks = Array.isArray(works) ? works : [];
  const today = new Date();

  const experienceList = removeExperienceHeading(
    sanitizeLines(safeResume.transferable_skills || safeResume.experience_knowledge),
  );
  const licenseList = sanitizeLines(safeResume.licenses_qualifications);

  // 職歴ソート
  const sortedWorks = [...safeWorks].sort((a, b) => {
    const ay = (a.start_year ?? 0) as number;
    const by = (b.start_year ?? 0) as number;
    if (ay !== by) return ay - by;
    const am = (a.start_month ?? 0) as number;
    const bm = (b.start_month ?? 0) as number;
    return am - bm;
  });

  const formatPeriod = (work: any) => {
    const sy = work.start_year;
    const sm = work.start_month;
    const ey = work.end_year;
    const em = work.end_month;
    const isCurrent = work.is_current;
    const hasStart = sy || sm;
    const hasEnd = ey || em;

    const start = hasStart ? `${sy ?? ''}年${sm ? `${sm}月` : ''}` : '';
    const end = isCurrent ? '現在' : hasEnd ? `${ey ?? ''}年${em ? `${em}月` : ''}` : '';

    if (start && end) return `${start} ～ ${end}`;
    if (start) return `${start} ～`;
    if (end) return `～ ${end}`;
    return '';
  };

  const formatCompanyInfo = (work: any) => {
    const parts = [
      work.company_name,
      work.department,
      work.position
    ].filter(Boolean);
    return parts.join('　');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>職務経歴書</Text>
          <View style={styles.headerInfo}>
            <Text>
              {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日 現在
            </Text>
            <Text>
              氏名：{safeResume.last_name_kanji ?? ''} {safeResume.first_name_kanji ?? ''}
            </Text>
          </View>
        </View>

        {/* 1. 職務要約 */}
        {safeResume.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>職務要約</Text>
            <Text style={styles.content}>{safeResume.summary}</Text>
          </View>
        )}

        {/* 2. 職務経歴詳細 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>職務経歴</Text>

          {/* 各職歴のループ */}
          {sortedWorks.map((work: any, index: number) => (
            <View key={work.id ?? index} wrap={false} style={styles.workEntryContainer}>
              
              {/* 会社名を枠外に表示 */}
              <Text style={styles.companyTitleText}>
                {formatCompanyInfo(work)}
              </Text>

              {/* テーブル行（期間・業務内容） */}
              <View style={styles.tableRow}>
                {/* 期間 */}
                <View style={[styles.cell, styles.colDate]}>
                  <Text>{formatPeriod(work)}</Text>
                </View>

                {/* 業務内容 */}
                <View style={[styles.lastCell, styles.colDesc]}>
                  <Text>{work.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 3. 活かせる経験・知識 */}
        {experienceList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>活かせる経験・知識</Text>
            
            {/* ★修正: 「内容」ヘッダー行を削除しました ★ */}
            
            {experienceList.map((item: string, index: number) => (
              <View key={index} style={[styles.tableRow, { marginTop: -1 }]}> 
                <View style={[styles.lastCell, styles.colFull]}>
                  <Text>・{item}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 4. 資格・免許 */}
        {licenseList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>資格・免許</Text>
            <View style={styles.tableHeader}>
              <View style={[styles.lastCell, styles.colFull]}>
                <Text>名称</Text>
              </View>
            </View>
            {licenseList.map((item: string, index: number) => (
              <View key={index} style={[styles.tableRow, { marginTop: -1 }]}>
                <View style={[styles.lastCell, styles.colFull]}>
                  <Text>・{item}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 5. 自己PR */}
        {safeResume.self_pr && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自己PR</Text>
            <Text style={styles.content}>{safeResume.self_pr}</Text>
          </View>
        )}

        {/* フッター */}
        <View style={{ position: 'absolute', bottom: 30, right: 30 }}>
          <Text style={{ fontSize: 9, color: '#ccc' }}>以上</Text>
        </View>
      </Page>
    </Document>
  );
};