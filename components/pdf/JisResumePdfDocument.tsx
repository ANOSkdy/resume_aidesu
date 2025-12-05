import 'server-only';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: 'NotoSansJP',
    fontSize: 10.5,
    lineHeight: 1.4,
    color: '#000',
  },
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
  headerSpacer: {
    height: 24,
  },
  gridContainer: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 5,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    alignItems: 'stretch',
    minHeight: 26,
  },
  gridCell: {
    borderRightWidth: 1,
    borderColor: '#000',
    paddingVertical: 3,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  labelCell: { width: '15%', backgroundColor: '#fff' },
  valueCell: { flex: 1 },
  label: { fontSize: 9, marginBottom: 1 },
  value: { fontSize: 11 },
  nameValue: { fontSize: 18, fontWeight: 'bold', marginLeft: 5 },
  photoContainer: {
    width: '20%',
    marginLeft: 10,
    height: 125,
    borderWidth: 1,
    borderColor: '#000',
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
  tableHeader: { textAlign: 'center', fontSize: 10 },
  center: { textAlign: 'center' },
  colYear: { width: '12%' },
  colMonth: { width: '8%' },
  colContent: { width: '80%' },
  page2Container: {
    borderWidth: 1,
    borderColor: '#000',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  sectionBox: {
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 2,
  },
  sectionText: { fontSize: 10, lineHeight: 1.5 },
  innerSpacer: {
    height: 24,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  piLabel: { width: '22%', backgroundColor: '#fff' },
  piValue: { width: '28%' },
  piInput: {
    borderBottomWidth: 1,
    borderColor: '#000',
    width: 25,
    textAlign: 'center',
    marginHorizontal: 2,
  },
  piRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

const HistoryRow = ({ year, month, content, align = 'left' }: any) => (
  <View style={styles.gridRow}>
    <View style={[styles.gridCell, styles.colYear]}>
      <Text style={styles.center}>{year ?? ''}</Text>
    </View>
    <View style={[styles.gridCell, styles.colMonth]}>
      <Text style={styles.center}>{month ?? ''}</Text>
    </View>
    <View style={[styles.gridCell, styles.colContent]}>
      <Text style={{ textAlign: align, fontSize: 10 }}>{content ?? ''}</Text>
    </View>
  </View>
);

type LicenseRecord = {
  year: string | number | undefined;
  month: string | number | undefined;
  content: string;
};

type JisResumePdfDocumentProps = {
  data: any;
  profilePhotoUrl?: string | null;
  showProfilePhoto?: boolean;
};

export const JisResumePdfDocument = ({ data, profilePhotoUrl, showProfilePhoto = false }: JisResumePdfDocumentProps) => {
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

  const rawHistory = [
    { type: 'header', content: '学歴', sort: 0 },
    ...(educations || []).map((e: any) => ({
      year: e.start_year,
      month: e.start_month,
      content: `${e.school_name ?? ''} 入学`,
      sort: 1,
      val: (e.start_year || 0) * 100 + (e.start_month || 0),
    })),
    ...(educations || []).map((e: any) => ({
      year: e.end_year,
      month: e.end_month,
      content: `${e.school_name ?? ''} ${e.degree || ''} 卒業`,
      sort: 1,
      val: (e.end_year || 0) * 100 + (e.end_month || 0),
    })),
    { type: 'header', content: ' ', sort: 1.5 },
    { type: 'header', content: '職歴', sort: 2 },
    ...(works || []).map((w: any) => ({
      year: w.start_year,
      month: w.start_month,
      content: `${w.company_name ?? ''} 入社`,
      sort: 3,
      val: (w.start_year || 0) * 100 + (w.start_month || 0),
    })),
    ...(works || []).map((w: any) => ({
      year: w.end_year,
      month: w.end_month,
      content: w.is_current ? '現在に至る' : `${w.company_name ?? ''} 退社`,
      sort: 3,
      val: ((w.end_year ?? 9999) as number) * 100 + ((w.end_month ?? 12) as number),
    })),
  ];

  const displayHistory: any[] = [];
  displayHistory.push({ content: '学歴', align: 'center' });
  displayHistory.push(...rawHistory.filter((h) => h.sort === 1).sort((a, b) => a.val - b.val));
  displayHistory.push({ content: ' ', align: 'center' });
  displayHistory.push({ content: '職歴', align: 'center' });
  const worksItems = rawHistory.filter((h) => h.sort === 3).sort((a, b) => a.val - b.val);
  displayHistory.push(...worksItems);

  if (worksItems.length > 0) displayHistory.push({ content: '以上', align: 'right' });
  else displayHistory.push({ content: 'なし', align: 'center' });

  const TARGET_ROWS = 14;
  const emptyRows = Array.from({ length: Math.max(0, TARGET_ROWS - displayHistory.length) });

  const licenseList: LicenseRecord[] = Array.isArray(licenses)
    ? (licenses || []).map((l: Partial<LicenseRecord>) => ({
        year: l.year,
        month: l.month,
        content: l.content ?? '',
      }))
    : Array.isArray(safeResume.licenses_qualifications)
      ? (safeResume.licenses_qualifications as string[]).map((content) => ({
          year: '',
          month: '',
          content: content ?? '',
        }))
      : [];
  const emptyLic = Array.from({ length: Math.max(0, 6 - licenseList.length) });

  const dobYear = typeof safeResume.dob_year === 'number' ? safeResume.dob_year : null;
  const age = dobYear ? today.getFullYear() - dobYear : null;
  const dobLine = dobYear
    ? `${safeResume.dob_year}年 ${safeResume.dob_month ?? ''}月 ${safeResume.dob_day ?? ''}日生 (満 ${age ?? ''}歳)   性別：${safeResume.gender ?? ''}`
    : `性別：${safeResume.gender ?? ''}`;

  const desiredOccupationLine = Array.isArray(safeResume.desired_occupations) && safeResume.desired_occupations.length > 0
    ? `希望職種: ${safeResume.desired_occupations.join(', ')}`
    : '';
  const desiredLocationLine = Array.isArray(safeResume.desired_locations) && safeResume.desired_locations.length > 0
    ? `希望勤務地: ${safeResume.desired_locations.join(', ')}`
    : '';
  const desiredText = [desiredOccupationLine, desiredLocationLine].filter(Boolean).join('\n') || '特になし';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>履 歴 書</Text>
          <Text style={styles.date}>{dateString}</Text>
        </View>
        <View style={styles.headerSpacer} />

        <View style={{ flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' }}>
          <View style={{ width: '80%' }}>
            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                <View style={[styles.gridCell, styles.labelCell]}>
                  <Text style={styles.label}>ふりがな</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell]}>
                  <Text style={styles.value}>{`${safeResume.last_name_kana ?? ''} ${safeResume.first_name_kana ?? ''}`}</Text>
                </View>
              </View>
              <View style={[styles.gridRow, { minHeight: 45 }]}>
                <View style={[styles.gridCell, styles.labelCell]}>
                  <Text style={styles.label}>氏　　名</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell]}>
                  <Text style={styles.nameValue}>{`${safeResume.last_name_kanji ?? ''}　${safeResume.first_name_kanji ?? ''}`}</Text>
                </View>
              </View>
              <View style={[styles.gridRow, { minHeight: 28 }]}>
                <View style={[styles.gridCell, styles.labelCell]}>
                  <Text style={styles.label}>生年月日</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell]}>
                  <Text style={styles.value}>{dobLine}</Text>
                </View>
              </View>
              <View style={[styles.gridRow, { minHeight: 40 }]}>
                <View style={[styles.gridCell, styles.labelCell]}>
                  <Text style={styles.label}>現住所</Text>
                </View>
                <View style={[styles.gridCell, styles.valueCell]}>
                  <Text style={styles.value}>{`〒 ${safeResume.postal_code ?? ''}`}</Text>
                  <Text style={styles.value}>{`${(safeResume.desired_locations || []).join(' ')} ${safeResume.address || ''}`}</Text>
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
            <View style={[styles.gridCell, styles.colYear]}>
              <Text style={styles.tableHeader}>年</Text>
            </View>
            <View style={[styles.gridCell, styles.colMonth]}>
              <Text style={styles.tableHeader}>月</Text>
            </View>
            <View style={[styles.gridCell, styles.colContent]}>
              <Text style={styles.tableHeader}>学歴・職歴</Text>
            </View>
          </View>
          {displayHistory.map((h, i) => (
            <HistoryRow key={i} year={h.year} month={h.month} content={h.content} align={h.align} />
          ))}
          {emptyRows.map((_, i) => (
            <HistoryRow key={`emp-${i}`} year="" month="" content="" />
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>履歴書</Text>
          <Text style={styles.date}>{`${safeResume.last_name_kanji ?? ''} ${safeResume.first_name_kanji ?? ''}`}</Text>
        </View>
        <View style={styles.headerSpacer} />

        <View style={[styles.gridContainer, { marginBottom: 30 }]}>
          <View style={[styles.gridRow, { backgroundColor: '#f0f0f0', minHeight: 22 }]}>
            <View style={[styles.gridCell, styles.colYear]}>
              <Text style={styles.tableHeader}>年</Text>
            </View>
            <View style={[styles.gridCell, styles.colMonth]}>
              <Text style={styles.tableHeader}>月</Text>
            </View>
            <View style={[styles.gridCell, styles.colContent]}>
              <Text style={styles.tableHeader}>免許・資格</Text>
            </View>
          </View>
          {licenseList.map((l, i) => (
            <HistoryRow key={i} year={l.year} month={l.month} content={l.content} />
          ))}
          {emptyLic.map((_, i) => (
            <HistoryRow key={`lic-${i}`} year="" month="" content="" />
          ))}
        </View>

        <View style={styles.page2Container}>
          <View style={[styles.sectionBox, { minHeight: 80 }]}>
            <Text style={styles.sectionTitle}>本人希望記入欄</Text>
            <Text style={styles.sectionText}>{desiredText}</Text>
          </View>

          <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.gridCell, styles.piLabel]}>
              <Text style={styles.label}>通勤時間</Text>
            </View>
            <View style={[styles.gridCell, styles.piValue]}>
              <View style={styles.piRow}>
                <Text style={styles.value}>約</Text>
                <Text style={styles.piInput}> </Text>
                <Text style={styles.value}>時間</Text>
                <Text style={styles.piInput}> </Text>
                <Text style={styles.value}>分</Text>
              </View>
            </View>
            <View style={[styles.gridCell, styles.piLabel]}>
              <Text style={styles.label}>扶養家族数</Text>
            </View>
            <View style={[styles.gridCell, styles.piValue]}>
              <View style={styles.piRow}>
                <Text style={styles.piInput}>0</Text>
                <Text style={styles.value}>人</Text>
              </View>
            </View>
          </View>
          <View style={[styles.gridRow, { borderBottomWidth: 0, borderTopWidth: 1 }]}>
            <View style={[styles.gridCell, styles.piLabel]}>
              <Text style={styles.label}>配偶者</Text>
            </View>
            <View style={[styles.gridCell, styles.piValue]}>
              <Text style={[styles.value, styles.center]}>有 ・ 無</Text>
            </View>
            <View style={[styles.gridCell, styles.piLabel]}>
              <Text style={styles.label}>配偶者の扶養義務</Text>
            </View>
            <View style={[styles.gridCell, styles.piValue]}>
              <Text style={[styles.value, styles.center]}>有 ・ 無</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
