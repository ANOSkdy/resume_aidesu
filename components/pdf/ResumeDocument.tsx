import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// フォント登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf'
});

// --- スタイル定義 ---
const styles = StyleSheet.create({
  page: {
    padding: '12mm',
    fontFamily: 'NotoSansJP',
    fontSize: 10.5,
    lineHeight: 1.4,
    color: '#000',
  },
  
  // --- ヘッダー ---
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  date: {
    fontSize: 10,
    marginBottom: 2,
  },
  // ★修正: ヘッダー下の2行スペーサー
  headerSpacer: {
    height: 24,
  },

  // --- グリッドシステム (罫線統一) ---
  gridContainer: {
    borderTop: '1px solid #000',
    borderLeft: '1px solid #000',
    marginBottom: 5,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    alignItems: 'stretch',
    minHeight: 26,
  },
  gridCell: {
    borderRight: '1px solid #000',
    padding: '3 5',
    justifyContent: 'center',
  },
  
  // --- 基本情報 ---
  labelCell: { width: '15%', backgroundColor: '#fff' },
  valueCell: { flex: 1 },
  label: { fontSize: 9, marginBottom: 1 },
  value: { fontSize: 11 },
  nameValue: { fontSize: 18, fontWeight: 'bold', marginLeft: 5 },

  // --- 写真欄 ---
  photoContainer: {
    width: '20%',
    marginLeft: 10,
    height: 125,
    border: '1px solid #000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoText: { fontSize: 9, color: '#ccc', marginBottom: 2 },
  photoDim: { fontSize: 8, color: '#ccc' },

  // --- 学歴・職歴・資格 ---
  tableHeader: { textAlign: 'center', fontSize: 10 },
  center: { textAlign: 'center' },
  colYear: { width: '12%' },
  colMonth: { width: '8%' },
  colContent: { width: '80%' },

  // --- 2ページ目 ---
  page2Container: {
    borderLeft: '1px solid #000',
    borderTop: '1px solid #000',
    borderRight: '1px solid #000',
    borderBottom: '1px solid #000',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  // セクション
  sectionBox: {
    borderBottom: '1px solid #000',
    padding: 8,
  },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, borderBottom: '1px dashed #ccc', paddingBottom: 2 },
  sectionText: { fontSize: 10, lineHeight: 1.5 },
  
  // ★修正: セクション間の2行スペーサー (枠線内用)
  innerSpacer: {
    height: 24, // 2行分
    borderBottom: '1px solid #000', // 区切り線
    backgroundColor: '#fff', // 空白
  },

  // --- 個人情報 (通勤・扶養) ---
  piLabel: { width: '22%', backgroundColor: '#fff' },
  piValue: { width: '28%' },
  piInput: { borderBottom: '1px solid #000', width: 25, textAlign: 'center', marginHorizontal: 2 },
  piRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

// 履歴行コンポーネント
const HistoryRow = ({ year, month, content, align = 'left' }: any) => (
  <View style={styles.gridRow}>
    <View style={[styles.gridCell, styles.colYear]}><Text style={styles.center}>{year}</Text></View>
    <View style={[styles.gridCell, styles.colMonth]}><Text style={styles.center}>{month}</Text></View>
    <View style={[styles.gridCell, styles.colContent]}>
      <Text style={{ textAlign: align, fontSize: 10 }}>{content}</Text>
    </View>
  </View>
);

type LicenseRecord = {
  year: string | number | undefined;
  month: string | number | undefined;
  content: string;
};

type ResumeDocumentProps = {
  data: any;
  profilePhotoUrl?: string | null;
  showProfilePhoto?: boolean;
};

export const ResumeDocument = ({ data, profilePhotoUrl, showProfilePhoto = false }: ResumeDocumentProps) => {
  const { resume, educations, works, licenses } = data;
  const safeResume = resume || {};
  const today = new Date();
  const dateString = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日 現在`;

  const normalizedProfilePhotoUrl =
    typeof profilePhotoUrl === 'string' && profilePhotoUrl.trim().length > 0
      ? profilePhotoUrl
      : typeof safeResume.profilePhotoUrl === 'string' && safeResume.profilePhotoUrl.trim().length > 0
        ? safeResume.profilePhotoUrl
        : null;
  const shouldShowPhoto = showProfilePhoto || !!normalizedProfilePhotoUrl;

  // --- データ整形 ---
  const rawHistory = [
    { type: 'header', content: '学歴', sort: 0 },
    ...(educations || []).map((e: any) => ({
      year: e.start_year, month: e.start_month, content: `${e.school_name} 入学`, 
      sort: 1, val: e.start_year * 100 + e.start_month
    })),
    ...(educations || []).map((e: any) => ({
      year: e.end_year, month: e.end_month, content: `${e.school_name} ${e.degree || ''} 卒業`, 
      sort: 1, val: e.end_year * 100 + e.end_month
    })),
    { type: 'header', content: ' ', sort: 1.5 },
    { type: 'header', content: '職歴', sort: 2 },
    ...(works || []).map((w: any) => ({
      year: w.start_year, month: w.start_month, content: `${w.company_name} 入社`, 
      sort: 3, val: w.start_year * 100 + w.start_month
    })),
    ...(works || []).map((w: any) => ({
      year: w.end_year, month: w.end_month, 
      content: w.is_current ? '現在に至る' : `${w.company_name} 退社`, 
      sort: 3, val: (w.end_year || 9999) * 100 + (w.end_month || 12)
    })),
  ];

  let displayHistory: any[] = [];
  displayHistory.push({ content: '学歴', align: 'center' });
  displayHistory.push(...rawHistory.filter(h => h.sort === 1).sort((a, b) => a.val - b.val));
  displayHistory.push({ content: ' ', align: 'center' });
  displayHistory.push({ content: '職歴', align: 'center' });
  const worksItems = rawHistory.filter(h => h.sort === 3).sort((a, b) => a.val - b.val);
  displayHistory.push(...worksItems);
  
  if (worksItems.length > 0) displayHistory.push({ content: '以上', align: 'right' });
  else displayHistory.push({ content: 'なし', align: 'center' });

  const TARGET_ROWS = 14;
  const emptyRows = Array.from({ length: Math.max(0, TARGET_ROWS - displayHistory.length) });

  const licenseList: LicenseRecord[] = (licenses || []).map((l: Partial<LicenseRecord>) => ({
    year: l.year,
    month: l.month,
    content: l.content ?? '',
  }));
  const emptyLic = Array.from({ length: Math.max(0, 6 - licenseList.length) });

  return (
    <Document>
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>履 歴 書</Text>
          <Text style={styles.date}>{dateString}</Text>
        </View>
        {/* ★修正: ヘッダー下のスペーサー(2行分) */}
        <View style={styles.headerSpacer} />

        <View style={{ flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' }}>
          <View style={{ width: '80%' }}>
            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                <View style={[styles.gridCell, styles.labelCell, { borderBottomStyle: 'dotted' }]}>
                  <Text style={styles.label}>ふりがな</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell, { borderBottomStyle: 'dotted' }]}>
                  <Text style={styles.value}>{safeResume.last_name_kana} {safeResume.first_name_kana}</Text>
                </View>
              </View>
              <View style={[styles.gridRow, { minHeight: 45 }]}>
                <View style={[styles.gridCell, styles.labelCell]}>
                  <Text style={styles.label}>氏　　名</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell]}>
                  <Text style={styles.nameValue}>{safeResume.last_name_kanji}　{safeResume.first_name_kanji}</Text>
                </View>
              </View>
              <View style={[styles.gridRow, { minHeight: 28 }]}>
                <View style={[styles.gridCell, styles.labelCell]}>
                  <Text style={styles.label}>生年月日</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell]}>
                  <Text style={styles.value}>
                    {safeResume.dob_year}年 {safeResume.dob_month}月 {safeResume.dob_day}日生 (満 {today.getFullYear() - safeResume.dob_year}歳)
                    <Text style={{ fontSize: 10, color: '#444' }}>   性別：{safeResume.gender}</Text>
                  </Text>
                </View>
              </View>
              <View style={[styles.gridRow, { minHeight: 40 }]}>
                <View style={[styles.gridCell, styles.labelCell]}>
                  <Text style={styles.label}>現住所</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell]}>
                  <Text style={styles.value}>〒 {safeResume.postal_code}</Text>
                  <Text style={styles.value}>{(safeResume.desired_locations || []).join(' ')} {safeResume.address || ''}</Text>
                </View>
              </View>
              <View style={styles.gridRow}>
                 <View style={[styles.gridCell, styles.labelCell]}>
                   <Text style={styles.label}>連絡先</Text>
                 </View>
                 <View style={[styles.gridCell, styles.valueCell]}>
                   <Text style={{ fontSize: 9, color: '#666' }}>現住所と異なる場合のみ記入 (同上)</Text>
                 </View>
              </View>
            </View>
          </View>

          <View style={styles.photoContainer}>
            {shouldShowPhoto && normalizedProfilePhotoUrl ? (
              <Image src={normalizedProfilePhotoUrl} style={styles.photoImage} />
            ) : (
              <>
                <Text style={styles.photoText}>写真を貼る位置</Text>
                <Text style={styles.photoDim}>縦 40mm</Text>
                <Text style={styles.photoDim}>横 30mm</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.gridContainer}>
          <View style={[styles.gridRow, { backgroundColor: '#f0f0f0', minHeight: 22 }]}>
            <View style={[styles.gridCell, styles.colYear]}><Text style={styles.tableHeader}>年</Text></View>
            <View style={[styles.gridCell, styles.colMonth]}><Text style={styles.tableHeader}>月</Text></View>
            <View style={[styles.gridCell, styles.colContent]}><Text style={styles.tableHeader}>学歴・職歴</Text></View>
          </View>
          {displayHistory.map((h, i) => (
            <HistoryRow key={i} year={h.year} month={h.month} content={h.content} align={h.align} />
          ))}
          {emptyRows.map((_, i) => (
            <HistoryRow key={`emp-${i}`} year="" month="" content="" />
          ))}
        </View>
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>履歴書</Text>
          <Text style={styles.date}>{safeResume.last_name_kanji} {safeResume.first_name_kanji}</Text>
        </View>
        {/* ★修正: ヘッダー下のスペーサー(2行分) */}
        <View style={styles.headerSpacer} />

        {/* 免許・資格 */}
        {/* ★修正: 下マージンを30確保して2行空ける */}
        <View style={[styles.gridContainer, { marginBottom: 30 }]}>
          <View style={[styles.gridRow, { backgroundColor: '#f0f0f0', minHeight: 22 }]}>
            <View style={[styles.gridCell, styles.colYear]}><Text style={styles.tableHeader}>年</Text></View>
            <View style={[styles.gridCell, styles.colMonth]}><Text style={styles.tableHeader}>月</Text></View>
            <View style={[styles.gridCell, styles.colContent]}><Text style={styles.tableHeader}>免許・資格</Text></View>
          </View>
          {licenseList.map((l, i) => (
            <HistoryRow key={i} year={l.year} month={l.month} content={l.content} />
          ))}
          {emptyLic.map((_, i) => (
            <HistoryRow key={`lic-${i}`} year="" month="" content="" />
          ))}
        </View>

        {/* 2ページ目メインコンテナ */}
        <View style={styles.page2Container}>
          
          {/* 本人希望 */}
          <View style={[styles.sectionBox, { minHeight: 80 }]}>
            <Text style={styles.sectionTitle}>本人希望記入欄</Text>
            <Text style={styles.sectionText}>
               {safeResume.desired_occupations?.length > 0 && `希望職種: ${safeResume.desired_occupations.join(', ')}`}{'\n'}
               {safeResume.desired_locations?.length > 0 && `希望勤務地: ${safeResume.desired_locations.join(', ')}`}
            </Text>
          </View>

          {/* その他 (通勤・扶養) */}
          <View style={[styles.gridRow, { borderBottom: 'none' }]}>
             <View style={[styles.gridCell, styles.piLabel]}><Text style={styles.label}>通勤時間</Text></View>
             <View style={[styles.gridCell, styles.piValue]}>
                <View style={styles.piRow}>
                   <Text style={styles.value}>約</Text><Text style={styles.piInput}></Text><Text style={styles.value}>時間</Text>
                   <Text style={styles.piInput}></Text><Text style={styles.value}>分</Text>
                </View>
             </View>
             <View style={[styles.gridCell, styles.piLabel]}><Text style={styles.label}>扶養家族数</Text></View>
             <View style={[styles.gridCell, styles.piValue]}>
                <View style={styles.piRow}>
                   <Text style={styles.piInput}>0</Text><Text style={styles.value}>人</Text>
                </View>
             </View>
          </View>
          <View style={[styles.gridRow, { borderBottom: 'none', borderTop: '1px solid #000' }]}>
             <View style={[styles.gridCell, styles.piLabel]}><Text style={styles.label}>配偶者</Text></View>
             <View style={[styles.gridCell, styles.piValue]}><Text style={[styles.value, styles.center]}>有 ・ 無</Text></View>
             <View style={[styles.gridCell, styles.piLabel]}><Text style={styles.label}>配偶者の扶養義務</Text></View>
             <View style={[styles.gridCell, styles.piValue]}><Text style={[styles.value, styles.center]}>有 ・ 無</Text></View>
          </View>
        </View>

      </Page>
    </Document>
  );
};
