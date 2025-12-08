import 'server-only';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import path from 'node:path';

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
    fontSize: 10.5,
    lineHeight: 1.4,
    color: '#000',
    flexDirection: 'row',
  },
  leftColumn: {
    width: '50%',
    paddingRight: 15,
    flexDirection: 'column',
  },
  rightColumn: {
    width: '50%',
    paddingLeft: 15,
    flexDirection: 'column',
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
  // 重複防止のため、コンテナは「上」と「左」のみ描画
  gridContainer: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
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

  // 右下の枠組み
  page2Container: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#000',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionBox: {
    borderBottomWidth: 1,
    borderRightWidth: 1, // 右線を追加
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

  // 住所・連絡先エリア用スタイル
  addressRowContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 55,
  },
  addressLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    flexDirection: 'column',
  },
  addressRight: {
    width: '25%',
    flexDirection: 'column',
    borderRightWidth: 1, // 右線を追加
    borderColor: '#000',
  },
  dottedSeparator: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid', // 実線に統一
    borderColor: '#000',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  solidArea: {
    flex: 2,
    justifyContent: 'center',
    padding: 5,
  },
  furiLabel: { fontSize: 8, marginRight: 5 },
  furiValue: { fontSize: 9 },
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

// 汎用：どんな値でも文字列にする
const toStringSafe = (v: unknown): string =>
  typeof v === 'string' ? v : v == null ? '' : String(v);

export const JisResumePdfDocument = ({
  data,
  profilePhotoUrl,
  showProfilePhoto = false,
}: JisResumePdfDocumentProps) => {
  const { resume, educations, works, licenses } = data;
  const safeResume = resume || {};
  const today = new Date();
  const dateString = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日 現在`;

  // --- 写真 URL: props → resume.profilePhotoUrl → resume.profilePhoto (配列 or JSON文字列) ---
  let profileAttachments: any[] = [];

  if (Array.isArray(safeResume.profilePhoto)) {
    profileAttachments = safeResume.profilePhoto;
  } else if (typeof safeResume.profilePhoto === 'string') {
    try {
      const parsed = JSON.parse(safeResume.profilePhoto);
      if (Array.isArray(parsed)) {
        profileAttachments = parsed;
      } else if (parsed && typeof parsed === 'object') {
        profileAttachments = [parsed];
      }
    } catch {
      // パース失敗時は無視
    }
  }

  const attachmentsUrl = profileAttachments[0]?.url as string | undefined;

  const normalizedProfilePhotoUrl =
    (typeof profilePhotoUrl === 'string' && profilePhotoUrl.trim().length > 0
      ? profilePhotoUrl
      : undefined) ||
    (typeof safeResume.profilePhotoUrl === 'string' &&
    safeResume.profilePhotoUrl.trim().length > 0
      ? (safeResume.profilePhotoUrl as string)
      : undefined) ||
    attachmentsUrl ||
    null;

  const shouldShowPhoto = !!normalizedProfilePhotoUrl || showProfilePhoto;

  // --- 学歴・職歴（入社〜退社 / 現在に至る のセット） ---
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
    ...(works || []).map((w: any) => {
      const isCurrent =
        w.is_current === true ||
        w.is_current === '現在' ||
        (w.is_current !== false && !(w.end_year || w.end_month)); // end が無ければ基本「現在に至る」

      const hasEnd = !isCurrent && (w.end_year || w.end_month);
      const content = isCurrent ? '現在に至る' : `${w.company_name ?? ''} 退社`;

      return {
        year: hasEnd ? w.end_year : undefined,
        month: hasEnd ? w.end_month : undefined,
        content,
        sort: 3,
        val: hasEnd
          ? ((w.end_year ?? 9999) as number) * 100 + ((w.end_month ?? 12) as number)
          : 999912,
      };
    }),
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
    ? `${safeResume.dob_year}年 ${safeResume.dob_month ?? ''}月 ${safeResume.dob_day ?? ''}日生 (満 ${
        age ?? ''
      }歳)   性別：${safeResume.gender ?? ''}`
    : `性別：${safeResume.gender ?? ''}`;

  const dependentsCountText = toStringSafe(safeResume.dependents_count);
  const spouseText = safeResume.has_spouse ? '有' : '無';
  const spouseObligationText = safeResume.spouse_is_dependent ? '有' : '無';

  const desiredOccupationLine =
    Array.isArray(safeResume.desired_occupations) && safeResume.desired_occupations.length > 0
      ? `希望職種: ${safeResume.desired_occupations.join(', ')}`
      : '';
  const desiredLocationLine =
    Array.isArray(safeResume.desired_locations) && safeResume.desired_locations.length > 0
      ? `希望勤務地: ${safeResume.desired_locations.join(', ')}`
      : '';
  const desiredText =
    [desiredOccupationLine, desiredLocationLine].filter(Boolean).join('\n') || '特になし';

  // ▼ 現住所テキスト：address_* カラムから組み立て
  const addressParts = [
    toStringSafe(safeResume.address_prefecture),
    toStringSafe(safeResume.address_city),
    toStringSafe(safeResume.address_line1),
    toStringSafe(safeResume.address_line2),
  ].filter((p) => p && p.trim().length > 0);
  const addressText = addressParts.join(' ');

  // ▼ 現住所の電話・メール（phone_number を優先して必ず拾う）
  const currentPhoneText =
    toStringSafe(safeResume.phone) || toStringSafe(safeResume.phone_number);
  const currentEmailText = toStringSafe(safeResume.email);

  // ▼ 連絡先入力があるかどうか判定
  const contactAddressRaw = toStringSafe(
    safeResume.contactAddress ?? safeResume.contact_address
  );
  const contactPhoneRaw = toStringSafe(safeResume.contactPhone ?? safeResume.contact_phone);
  const contactEmailRaw = toStringSafe(safeResume.contactEmail ?? safeResume.contact_email);

  const hasContactInput =
    !!contactAddressRaw.trim() ||
    !!contactPhoneRaw.trim() ||
    !!contactEmailRaw.trim();

  // 入力がないときだけ「同上」＋現住所の電話・メールを流用
  const contactAddressText = hasContactInput ? contactAddressRaw : '同上';
  const contactPhoneText = hasContactInput ? contactPhoneRaw : currentPhoneText;
  const contactEmailText = hasContactInput ? contactEmailRaw : currentEmailText;

  const rightHistoryEmptyRows = Array.from({ length: 4 });

  return (
    <Document>
      <Page size="A3" orientation="landscape" style={styles.page}>
        {/* ▼▼▼ 左側カラム ▼▼▼ */}
        <View style={styles.leftColumn}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>履 歴 書</Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>
          <View style={styles.headerSpacer} />

          <View style={{ flexDirection: 'row', marginBottom: 30, alignItems: 'flex-start' }}>
            <View style={{ width: '80%' }}>
              <View style={styles.gridContainer}>
                {/* 氏名・生年月日 */}
                <View style={styles.gridRow}>
                  <View style={[styles.gridCell, styles.labelCell]}>
                    <Text style={styles.label}>ふりがな</Text>
                  </View>
                  <View style={[styles.gridCell, styles.valueCell]}>
                    <Text style={styles.value}>
                      {`${safeResume.last_name_kana ?? ''} ${safeResume.first_name_kana ?? ''}`}
                    </Text>
                  </View>
                </View>
                <View style={[styles.gridRow, { minHeight: 45 }]}>
                  <View style={[styles.gridCell, styles.labelCell]}>
                    <Text style={styles.label}>氏　　名</Text>
                  </View>
                  <View style={[styles.gridCell, styles.valueCell]}>
                    <Text style={styles.nameValue}>
                      {`${safeResume.last_name_kanji ?? ''}　${safeResume.first_name_kanji ?? ''}`}
                    </Text>
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

                {/* 現住所エリア */}
                <View style={styles.addressRowContainer}>
                  <View style={styles.addressLeft}>
                    <View
                      style={[
                        styles.dottedSeparator,
                        { flexDirection: 'row', alignItems: 'center' },
                      ]}
                    >
                      <Text style={styles.furiLabel}>フリガナ</Text>
                      {/* TODO: 住所フリガナがあればここに反映 */}
                      <Text style={styles.furiValue}>ホッカイドウ サッポロシ チュウオウク</Text>
                    </View>
                    <View style={styles.solidArea}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 2,
                        }}
                      >
                        <Text style={{ fontSize: 9, marginRight: 10 }}>現住所</Text>
                        <Text style={{ fontSize: 10 }}>
                          〒 {toStringSafe(safeResume.postal_code) || '000-0000'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>{addressText}</Text>
                    </View>
                  </View>
                  <View style={styles.addressRight}>
                    <View style={styles.dottedSeparator}>
                      <Text style={{ fontSize: 8 }}>電話 {currentPhoneText}</Text>
                    </View>
                    <View style={styles.solidArea}>
                      <Text style={{ fontSize: 8 }}>メール</Text>
                      <Text style={{ fontSize: 8, marginTop: 2 }}>{currentEmailText}</Text>
                    </View>
                  </View>
                </View>

                {/* 連絡先エリア */}
                <View style={styles.addressRowContainer}>
                  <View style={styles.addressLeft}>
                    <View
                      style={[
                        styles.dottedSeparator,
                        { flexDirection: 'row', alignItems: 'center' },
                      ]}
                    >
                      <Text style={styles.furiLabel}>フリガナ</Text>
                      <Text style={styles.furiValue}></Text>
                    </View>
                    <View style={styles.solidArea}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <View style={{ flexDirection: 'row' }}>
                          <Text style={{ fontSize: 9, marginRight: 10 }}>連絡先</Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 7,
                            color: '#666',
                            marginTop: -2,
                          }}
                        >
                          (現住所以外に連絡を希望する場合のみ記入)
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'flex-start',
                          marginTop: 5,
                        }}
                      >
                        <Text style={{ fontSize: 10 }}>{contactAddressText}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.addressRight}>
                    <View style={styles.dottedSeparator}>
                      <Text style={{ fontSize: 8 }}>電話 {contactPhoneText}</Text>
                    </View>
                    <View style={styles.solidArea}>
                      <Text style={{ fontSize: 8 }}>メール</Text>
                      <Text style={{ fontSize: 8, marginTop: 2 }}>{contactEmailText}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 写真枠 */}
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

          {/* 左側 学歴・職歴 */}
          <View style={styles.gridContainer}>
            <View
              style={[
                styles.gridRow,
                { backgroundColor: '#f0f0f0', minHeight: 22 },
              ]}
            >
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
              <HistoryRow
                key={i}
                year={h.year}
                month={h.month}
                content={h.content}
                align={h.align}
              />
            ))}
            {emptyRows.map((_, i) => (
              <HistoryRow key={`emp-${i}`} year="" month="" content="" />
            ))}
          </View>
        </View>

        {/* ▼▼▼ 右側カラム ▼▼▼ */}
        <View style={styles.rightColumn}>
          {/* スペーサー */}
          <View style={{ height: 30 + 24 }} />

          {/* 右側の学歴・職歴欄（規定値4行空挿入） */}
          <View style={[styles.gridContainer, { marginBottom: 5 }]}>
            <View
              style={[
                styles.gridRow,
                { backgroundColor: '#f0f0f0', minHeight: 22 },
              ]}
            >
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
            {rightHistoryEmptyRows.map((_, i) => (
              <HistoryRow key={`right-hist-${i}`} year="" month="" content="" />
            ))}
          </View>

          {/* 免許・資格 */}
          <View style={[styles.gridContainer, { marginBottom: 30 }]}>
            <View
              style={[
                styles.gridRow,
                { backgroundColor: '#f0f0f0', minHeight: 22 },
              ]}
            >
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

          {/* 本人希望記入欄など */}
          <View style={styles.page2Container}>
            <View style={[styles.sectionBox, { minHeight: 235 }]}>
              <Text style={styles.sectionTitle}>本人希望記入欄</Text>
              <Text style={styles.sectionText}>{desiredText}</Text>
            </View>

            <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.gridCell, styles.piLabel]}>
                <Text style={styles.label}>扶養家族数</Text>
              </View>
              <View style={[styles.gridCell, styles.piValue]}>
                <View style={styles.piRow}>
                  <Text style={styles.piInput}>{dependentsCountText}</Text>
                  <Text style={styles.value}>人</Text>
                </View>
              </View>
            </View>
            <View style={[styles.gridRow, { borderTopWidth: 1 }]}>
              <View style={[styles.gridCell, styles.piLabel]}>
                <Text style={styles.label}>配偶者</Text>
              </View>
              <View style={[styles.gridCell, styles.piValue]}>
                <Text style={[styles.value, styles.center]}>{spouseText}</Text>
              </View>
              <View style={[styles.gridCell, styles.piLabel]}>
                <Text style={styles.label}>配偶者の扶養義務</Text>
              </View>
              <View style={[styles.gridCell, styles.piValue]}>
                <Text style={[styles.value, styles.center]}>{spouseObligationText}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
