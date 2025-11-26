import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// フォント登録 (共通のローカルフォント)
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: '15mm',
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },
  // ヘッダー (タイトル・日付・氏名)
  headerContainer: {
    marginBottom: 20,
    borderBottom: '1px solid #000',
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
    padding: '4px 8px',
    marginBottom: 8,
    borderLeft: '4px solid #444',
  },
  content: {
    marginLeft: 2,
    lineHeight: 1.6,
  },

  // テーブルスタイル
  table: {
    width: '100%',
    borderTop: '1px solid #ccc',
    borderLeft: '1px solid #ccc',
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ccc',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    borderRight: '1px solid #ccc',
    padding: 6,
    justifyContent: 'flex-start',
  },
  // 列幅
  colDate: { width: '18%' },
  colCompany: { width: '25%' },
  colDesc: { width: '57%' },
  colFull: { width: '100%' },

  bold: { fontWeight: 'bold' },
  small: { fontSize: 9, color: '#666' },
});

// データ型定義 (履歴書と共通)
type ResumeData = {
  resume: any;
  works: any[];
};

const sanitizeLines = (input: unknown): string[] => {
  if (!input) return [];

  if (typeof input === 'string') {
    return input
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
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
  const safeWorks = works || [];
  const today = new Date();
  const experienceList = removeExperienceHeading(
    sanitizeLines(safeResume.transferable_skills || safeResume.experience_knowledge)
  );
  const licenseList = sanitizeLines(safeResume.licenses_qualifications);

  // 職歴を時系列順 (古い順) にソート
  const sortedWorks = [...safeWorks].sort((a, b) => {
    if (a.start_year !== b.start_year) return a.start_year - b.start_year;
    return a.start_month - b.start_month;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ヘッダー */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>職務経歴書</Text>
          <View style={styles.headerInfo}>
            <Text>{today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日 現在</Text>
            <Text>氏名：{safeResume.last_name_kanji} {safeResume.first_name_kanji}</Text>
          </View>
        </View>

        {/* 1. 職務要約 */}
        {safeResume.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>職務要約</Text>
            <Text style={styles.content}>{safeResume.summary}</Text>
          </View>
        )}

        {/* 2. 職務経歴詳細 (テーブル形式) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>職務経歴</Text>
          
          <View style={styles.table}>
            {/* テーブルヘッダー */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.cell, styles.colDate]}><Text>期間</Text></View>
              <View style={[styles.cell, styles.colCompany]}><Text>会社名・部署・役職</Text></View>
              <View style={[styles.cell, styles.colDesc]}><Text>業務内容</Text></View>
            </View>

            {/* データ行 */}
            {sortedWorks.map((work: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                {/* 期間 */}
                <View style={[styles.cell, styles.colDate]}>
                  <Text>{work.start_year}年{work.start_month}月 ～</Text>
                  <Text>{work.is_current ? '現在' : `${work.end_year}年${work.end_month}月`}</Text>
                  <Text style={{ marginTop: 4, fontSize: 8, color: '#666' }}>
                    {/* 期間計算ロジックがあればここへ (省略) */}
                  </Text>
                </View>

                {/* 会社情報 */}
                <View style={[styles.cell, styles.colCompany]}>
                  <Text style={styles.bold}>{work.company_name}</Text>
                  <Text style={{ marginTop: 2, fontSize: 9 }}>{work.department}</Text>
                  <Text style={{ fontSize: 9 }}>{work.position}</Text>
                </View>

                {/* 業務内容 */}
                <View style={[styles.cell, styles.colDesc]}>
                  <Text>{work.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. 活かせる経験・知識 */}
        {experienceList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>活かせる経験・知識</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.cell, styles.colFull]}><Text>内容</Text></View>
              </View>
              {experienceList.map((item: string, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.cell, styles.colFull]}>
                    <Text>・{item}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 4. 資格・免許 */}
        {licenseList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>資格・免許</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.cell, styles.colFull]}><Text>名称</Text></View>
              </View>
              {licenseList.map((item: string, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.cell, styles.colFull]}>
                    <Text>・{item}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. 自己PR */}
        {safeResume.self_pr && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自己PR</Text>
            <Text style={styles.content}>{safeResume.self_pr}</Text>
          </View>
        )}

        {/* フッター (任意) */}
        <View style={{ position: 'absolute', bottom: 30, right: 30 }}>
           <Text style={{ fontSize: 9, color: '#ccc' }}>以上</Text>
        </View>

      </Page>
    </Document>
  );
};
