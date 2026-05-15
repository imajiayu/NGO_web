'use client'

import { useState, useTransition } from 'react'

import { getAnalyticsSummary } from '@/app/actions/admin'
import type {
  AnalyticsFunnelRow,
  AnalyticsSummary,
  AnalyticsTimeRange,
} from '@/app/actions/admin/analytics'

interface AnalyticsDashboardProps {
  initial: AnalyticsSummary
}

const TIME_RANGE_OPTIONS: ReadonlyArray<{ value: AnalyticsTimeRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
]

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '—'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function totalsOf(rows: AnalyticsFunnelRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc.views += r.views
      acc.viewsDeduped += r.viewsDeduped
      acc.ctaClicks += r.ctaClicks
      acc.successCount += r.successCount
      return acc
    },
    { views: 0, viewsDeduped: 0, ctaClicks: 0, successCount: 0 }
  )
}

export default function AnalyticsDashboard({ initial }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsSummary>(initial)
  const [range, setRange] = useState<AnalyticsTimeRange>(initial.timeRange)
  const [deduped, setDeduped] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleRangeChange = (next: AnalyticsTimeRange) => {
    setRange(next)
    setError(null)
    startTransition(async () => {
      try {
        const fresh = await getAnalyticsSummary(next)
        setData(fresh)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analytics')
      }
    })
  }

  const projectTotals = totalsOf(data.projects)
  const marketTotals = totalsOf(data.marketItems)

  const grandViews =
    (deduped ? data.home.viewsDeduped : data.home.views) +
    (deduped ? data.marketList.viewsDeduped : data.marketList.views) +
    (deduped ? projectTotals.viewsDeduped : projectTotals.views) +
    (deduped ? marketTotals.viewsDeduped : marketTotals.views)
  const grandCtaClicks = projectTotals.ctaClicks + marketTotals.ctaClicks
  const grandSuccesses = projectTotals.successCount + marketTotals.successCount

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Range:</label>
          <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRangeChange(opt.value)}
                disabled={isPending}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  range === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">View counts:</label>
          <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setDeduped(true)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                deduped ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Deduped (per session)
            </button>
            <button
              type="button"
              onClick={() => setDeduped(false)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                !deduped ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Raw
            </button>
          </div>
        </div>

        <div className="ml-auto text-xs text-gray-500">
          Generated {new Date(data.generatedAt).toLocaleString('en-US')}
          {isPending && <span className="ml-2 text-blue-600">refreshing…</span>}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total page views" value={formatNumber(grandViews)} hint={deduped ? 'per session' : 'raw'} />
        <KpiCard label="Total CTA clicks" value={formatNumber(grandCtaClicks)} hint="donation submit + buy now" />
        <KpiCard
          label="Total successes"
          value={formatNumber(grandSuccesses)}
          hint="paid / shipped / completed"
        />
      </div>

      {/* Projects funnel */}
      <FunnelTable
        title="Projects"
        emptyMessage="No project events in this range."
        rows={data.projects}
        deduped={deduped}
      />

      {/* Market items funnel */}
      <FunnelTable
        title="Market items"
        emptyMessage="No market item events in this range."
        rows={data.marketItems}
        deduped={deduped}
      />

      {/* Static-route pages (no CTA / success concept) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Other pages</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SimpleViewRow
            label="Home"
            views={deduped ? data.home.viewsDeduped : data.home.views}
          />
          <SimpleViewRow
            label="Market list"
            views={deduped ? data.marketList.viewsDeduped : data.marketList.views}
          />
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-1 font-mono text-3xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </div>
  )
}

function SimpleViewRow({ label, views }: { label: string; views: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="font-mono text-base font-semibold text-gray-900">{formatNumber(views)}</span>
    </div>
  )
}

interface FunnelTableProps {
  title: string
  emptyMessage: string
  rows: AnalyticsFunnelRow[]
  deduped: boolean
}

function FunnelTable({ title, emptyMessage, rows, deduped }: FunnelTableProps) {
  const totals = totalsOf(rows)
  const totalViews = deduped ? totals.viewsDeduped : totals.views

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th className="text-left">Name</Th>
                <Th>Views</Th>
                <Th>CTA Clicks</Th>
                <Th>Successes</Th>
                <Th>View → CTA</Th>
                <Th>CTA → Success</Th>
                <Th>Overall</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row) => {
                const v = deduped ? row.viewsDeduped : row.views
                return (
                  <tr key={row.entity_id} className="hover:bg-gray-50">
                    <Td className="text-left">
                      <span className="font-medium text-gray-900">{row.name}</span>
                      <span className="ml-2 text-xs text-gray-400">#{row.entity_id}</span>
                    </Td>
                    <Td>{formatNumber(v)}</Td>
                    <Td>{formatNumber(row.ctaClicks)}</Td>
                    <Td>{formatNumber(row.successCount)}</Td>
                    <Td>{pct(row.ctaClicks, v)}</Td>
                    <Td>{pct(row.successCount, row.ctaClicks)}</Td>
                    <Td>{pct(row.successCount, v)}</Td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-semibold">
                <Td className="text-left text-gray-700">Total</Td>
                <Td>{formatNumber(totalViews)}</Td>
                <Td>{formatNumber(totals.ctaClicks)}</Td>
                <Td>{formatNumber(totals.successCount)}</Td>
                <Td>{pct(totals.ctaClicks, totalViews)}</Td>
                <Td>{pct(totals.successCount, totals.ctaClicks)}</Td>
                <Td>{pct(totals.successCount, totalViews)}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 ${className}`}
    >
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2 text-right font-mono text-sm text-gray-700 ${className}`}>
      {children}
    </td>
  )
}
