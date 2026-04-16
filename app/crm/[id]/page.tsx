import type React from 'react';
import { randomUUID } from 'crypto';
import Link from 'next/link';
import { headers } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import { getResumeBundle } from '@/lib/db/resume';
import { isValidResumeId, normalizeResumeId, normalizeReturnTo } from '@/lib/crm/resume-id';

type SearchParams = {
  from?: string;
};

const getAccessError = async () => {
  const token = process.env.CRM_ACCESS_TOKEN;
  if (!token) return null;
  const provided = (await headers()).get('x-crm-token');
  if (!provided || provided !== token) {
    return 'このページにアクセスするための認証トークンが不足しています。';
  }
  return null;
};

const formatYm = (year?: number, month?: number) => {
  if (!year) return '';
  if (!month) return `${year}年`;
  return `${year}年${month}月`;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-[color-mix(in_oklab,var(--border)_88%,white)] bg-[color-mix(in_oklab,var(--surface-muted)_88%,white)] px-2 py-1 text-xs text-[color-mix(in_oklab,var(--foreground)_74%,var(--nezumi-gray))]">
    {children}
  </span>
);

const toText = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

const toDisplayNumber = (value: unknown, fallback: string) =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : fallback;

export default async function CrmDetailPage({
  params,
  searchParams,
}: {
  params?: Record<string, unknown> | Promise<Record<string, unknown>>;
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const accessError = await getAccessError();
  const resolvedParams = params ? await Promise.resolve(params) : {};
  const paramsRecord = (resolvedParams ?? {}) as Record<string, unknown>;
  const paramKeys = Object.keys(resolvedParams ?? {});
  const fallbackValue =
    paramKeys.length === 1 ? paramsRecord[paramKeys[0]] : undefined;
  const rawParam =
    paramsRecord.id ??
    paramsRecord.resumeId ??
    paramsRecord.resume_id ??
    paramsRecord.slug ??
    fallbackValue;
  const rawValue = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const resumeIdInfo = normalizeResumeId(rawValue);
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const returnTo = normalizeReturnTo(resolvedSearchParams?.from);

  const resumeId = resumeIdInfo.normalized;

  if (!resumeId || !isValidResumeId(resumeId)) {
    const traceId = randomUUID();
    console.warn('CRM invalid resume id', {
      traceId,
      paramKeys,
      rawType: typeof rawValue,
      isArray: Array.isArray(rawParam),
    });
    return (
      <AppShell title="CRM / 応募者詳細">
        <div className="wa-surface border-akane/45 p-4 text-sm text-akane">
          <p>不正なIDが指定されました。</p>
          <p>resume_id (raw): {resumeIdInfo.raw ?? 'undefined'}</p>
          <p>resume_id (normalized): {resumeIdInfo.normalized ?? 'undefined'}</p>
          <p>Trace ID: {traceId}</p>
        </div>
      </AppShell>
    );
  }

  if (accessError) {
    return (
      <AppShell title="CRM / 応募者詳細">
        <div className="wa-surface border-akane/45 p-4 text-sm text-akane">
          {accessError}
        </div>
      </AppShell>
    );
  }

  let bundle;
  try {
    bundle = await getResumeBundle(resumeId);
  } catch (error: unknown) {
    const correlationId = randomUUID();
    const message = error instanceof Error ? error.message : '';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('CRM resume detail error', {
      correlationId,
      message,
      stack,
    });
    return (
      <AppShell title="CRM / 応募者詳細">
        <div className="wa-surface border-akane/45 p-4 text-sm text-akane">
          データ取得中にエラーが発生しました。{message} (Trace ID: {correlationId})
        </div>
      </AppShell>
    );
  }

  if (!bundle) {
    const correlationId = randomUUID();
    console.warn('CRM resume not found', { correlationId, resumeId });
    return (
      <AppShell title="CRM / 応募者詳細">
        <div className="space-y-3">
          <div className="wa-surface p-4 text-sm text-[color-mix(in_oklab,var(--foreground)_74%,var(--nezumi-gray))]">
            <p>応募者が見つかりませんでした。</p>
            <p>resume_id: {resumeId}</p>
            <p>Trace ID: {correlationId}</p>
          </div>
          <Link className="wa-motion-ui text-sm font-medium text-ai hover:text-[color-mix(in_oklab,var(--ai-blue)_80%,black)] focus-visible:wa-focus" href={returnTo}>
            ← 一覧へ戻る
          </Link>
        </div>
      </AppShell>
    );
  }

  const { resume, educations, works } = bundle;
  const nameKanji = [resume.last_name_kanji, resume.first_name_kanji].filter(Boolean).join(' ');
  const updatedAt =
    (resume as { updated_at?: string; updatedAt?: string; created_at?: string }).updated_at ??
    (resume as { updatedAt?: string }).updatedAt ??
    (resume as { created_at?: string }).created_at ??
    resume.createdTime;

  const sortedEducations = [...educations].sort((a, b) => {
    const aYear = toNumber(a.start_year) ?? 0;
    const bYear = toNumber(b.start_year) ?? 0;
    if (aYear !== bYear) return aYear - bYear;
    const aMonth = toNumber(a.start_month) ?? 0;
    const bMonth = toNumber(b.start_month) ?? 0;
    return aMonth - bMonth;
  });

  const sortedWorks = [...works].sort((a, b) => {
    const aYear = toNumber(a.start_year) ?? 0;
    const bYear = toNumber(b.start_year) ?? 0;
    if (aYear !== bYear) return bYear - aYear;
    const aMonth = toNumber(a.start_month) ?? 0;
    const bMonth = toNumber(b.start_month) ?? 0;
    return bMonth - aMonth;
  });

  return (
    <AppShell title="CRM / 応募者詳細">
      <div className="space-y-4 py-4">
        <Link className="wa-motion-ui text-sm font-medium text-ai hover:text-[color-mix(in_oklab,var(--ai-blue)_80%,black)] focus-visible:wa-focus" href={returnTo}>
          ← 一覧へ戻る
        </Link>

        <section className="wa-surface wa-accent-diagonal p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-sumi">{nameKanji || '未入力'}</h1>
              <div className="text-sm text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">
                {resume.contactEmail ?? resume.email ? (
                  <div>メール: {resume.contactEmail ?? resume.email}</div>
                ) : null}
                {resume.contactPhone ?? resume.phone_number ? (
                  <div>電話: {resume.contactPhone ?? resume.phone_number}</div>
                ) : null}
                {resume.contactAddress ? <div>住所: {resume.contactAddress}</div> : null}
              </div>
              {updatedAt ? <p className="text-xs text-[color-mix(in_oklab,var(--foreground)_50%,var(--nezumi-gray))]">更新日: {updatedAt}</p> : null}
            </div>
            {resume.profilePhotoUrl ? (
              <img
                src={resume.profilePhotoUrl}
                alt={`${nameKanji}のプロフィール写真`}
                className="h-24 w-24 rounded-md border border-[color-mix(in_oklab,var(--border)_90%,white)] object-cover"
              />
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {resume.current_status ? <Tag>{resume.current_status}</Tag> : null}
            {resume.desired_occupations?.map((role) => (
              <Tag key={role}>{role}</Tag>
            ))}
            {resume.desired_locations?.map((location) => (
              <Tag key={location}>{location}</Tag>
            ))}
          </div>
        </section>

        <section className="wa-surface p-4">
          <h2 className="text-base font-semibold text-sumi">応募者情報</h2>
          <div className="mt-3 grid gap-4 text-sm text-[color-mix(in_oklab,var(--foreground)_78%,var(--nezumi-gray))] md:grid-cols-2">
            <div>
              <div className="text-sm font-bold text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">転職回数</div>
              <div>{toDisplayNumber(resume.job_change_count, '未入力')}</div>
            </div>
            <div>
              <div className="text-sm font-bold text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">入社希望時期</div>
              <div>{toText(resume.desired_joining_date, '未入力')}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-bold text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">資格・免許</div>
              {resume.licenses_qualifications && resume.licenses_qualifications.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {resume.licenses_qualifications.map((license) => (
                    <Tag key={license}>{license}</Tag>
                  ))}
                </div>
              ) : (
                <div>未入力</div>
              )}
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-bold text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">活かせる経験・スキル</div>
              <p className="whitespace-pre-wrap">
                {toText(resume.transferable_skills, '未入力')}
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-bold text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">自己PR</div>
              <p className="whitespace-pre-wrap">{toText(resume.self_pr, '未入力')}</p>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-bold text-[color-mix(in_oklab,var(--foreground)_72%,var(--nezumi-gray))]">要約</div>
              <p className="whitespace-pre-wrap">{toText(resume.summary, '未入力')}</p>
            </div>
          </div>
        </section>

        <section className="wa-surface p-4">
          <h2 className="text-base font-semibold text-sumi">
            学歴: {sortedEducations.length}件
          </h2>
          <div className="mt-3 space-y-3 text-sm text-[color-mix(in_oklab,var(--foreground)_78%,var(--nezumi-gray))]">
            {sortedEducations.length === 0 ? (
              <p className="wa-muted">学歴情報は登録されていません。</p>
            ) : (
              sortedEducations.map((edu) => {
                const start = formatYm(toNumber(edu.start_year), toNumber(edu.start_month));
                const end = edu.is_current
                  ? '在学中'
                  : formatYm(toNumber(edu.end_year), toNumber(edu.end_month));
                return (
                  <div key={edu.id} className="wa-panel p-3">
                    <div className="font-medium text-sumi">
                      {toText(edu.school_name, '学校名未入力')}
                    </div>
                    <div className="text-xs wa-muted">
                      {toText(edu.department, '学部/学科未入力')}
                    </div>
                    <div className="text-xs wa-muted">
                      {start || '入学時期未入力'} {end ? `〜 ${end}` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="wa-surface p-4">
          <h2 className="text-base font-semibold text-sumi">
            職歴: {sortedWorks.length}件
          </h2>
          <div className="mt-3 space-y-3 text-sm text-[color-mix(in_oklab,var(--foreground)_78%,var(--nezumi-gray))]">
            {sortedWorks.length === 0 ? (
              <p className="wa-muted">職歴情報は登録されていません。</p>
            ) : (
              sortedWorks.map((work) => {
                const start = formatYm(toNumber(work.start_year), toNumber(work.start_month));
                const end = work.is_current
                  ? '在籍中'
                  : formatYm(toNumber(work.end_year), toNumber(work.end_month));
                const tags = [
                  ...(Array.isArray(work.roles) ? work.roles : []),
                  ...(Array.isArray(work.industries) ? work.industries : []),
                ];
                return (
                  <div key={work.id} className="wa-panel p-3">
                    <div className="font-medium text-sumi">
                      {toText(work.company_name, '企業名未入力')}
                    </div>
                    <div className="text-xs wa-muted">
                      {toText(work.department, '部署未入力')} / {toText(work.position, '役職未入力')}
                    </div>
                    <div className="text-xs wa-muted">
                      {start || '開始時期未入力'} {end ? `〜 ${end}` : ''}
                    </div>
                    {tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag: string) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
