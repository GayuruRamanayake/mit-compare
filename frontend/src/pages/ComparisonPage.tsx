import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getComparisonAnalysis, ApiError } from '../api/comparisons'
import type { AlignedClause } from '../api/types'
import ClauseText from '../components/comparison/ClauseText'

const STATUS_ACCENT: Record<AlignedClause['status'], string> = {
  unchanged: 'border-l-transparent',
  modified: 'border-l-amber-400 bg-amber-50',
  added: 'border-l-green-400 bg-green-50',
  deleted: 'border-l-red-400 bg-red-50',
}

const RISK_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
  cosmetic: 'bg-gray-100 text-gray-600',
}

function ComparisonPage() {
  const { comparisonId } = useParams<{ comparisonId: string }>()
  const [clauses, setClauses] = useState<AlignedClause[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!comparisonId) return
    let cancelled = false

    async function load() {
      if (!comparisonId) return
      setIsLoading(true)
      setError(null)
      try {
        const data = await getComparisonAnalysis(comparisonId)
        if (!cancelled) setClauses(data.clauses)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Could not reach the server.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [comparisonId])

  const jumpTo = (clauseId: string) => {
    setActiveId(clauseId)
    document.getElementById(`left-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.getElementById(`right-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => setActiveId(null), 1500)
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Analyzing changes…</p></div>
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-red-600">{error}</p></div>
  if (!clauses) return null

  const changedList = clauses.filter((c) => c.status !== 'unchanged')
  const leftPane = clauses.filter((c) => c.original_index !== null).sort((a, b) => a.original_index! - b.original_index!)
  const rightPane = clauses.filter((c) => c.revised_index !== null).sort((a, b) => a.revised_index! - b.revised_index!)

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white overflow-y-auto p-4 flex-shrink-0">
        <p className="text-sm text-gray-500 mb-4">{changedList.length} changes found</p>
        <div className="space-y-2">
          {changedList.map((c) => (
            <button
              key={c.clause_id}
              onClick={() => jumpTo(c.clause_id)}
              className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                  c.status === 'modified' ? 'bg-amber-400' : c.status === 'added' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                {c.risk_level && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${RISK_STYLES[c.risk_level]}`}>
                    {c.risk_level}
                  </span>
                )}
              </div>
              <p className="text-gray-700">{(c.original_text || c.revised_text || '').slice(0, 40)}…</p>
            </button>
          ))}
        </div>
      </div>

      {/* Two panes */}
      <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
        <div className="overflow-y-auto p-4">
          <p className="text-xs font-medium text-gray-400 mb-3 sticky top-0 bg-gray-50">ORIGINAL</p>
          {leftPane.map((c) => (
            <div
              id={`left-${c.clause_id}`}
              key={c.clause_id}
              className={`border-l-4 px-3 py-2 mb-2 rounded transition-colors ${STATUS_ACCENT[c.status]} ${activeId === c.clause_id ? 'ring-2 ring-blue-400' : ''}`}
            >
              {c.ai_summary && (
                <div className="flex items-center gap-2 mb-1">
                  {c.risk_level && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${RISK_STYLES[c.risk_level]}`}>
                      {c.risk_level}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
                </div>
              )}
              {c.original_text && <ClauseText text={c.original_text} />}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto p-4">
          <p className="text-xs font-medium text-gray-400 mb-3 sticky top-0 bg-gray-50">REVISED</p>
          {rightPane.map((c) => (
            <div
              id={`right-${c.clause_id}`}
              key={c.clause_id}
              className={`border-l-4 px-3 py-2 mb-2 rounded transition-colors ${STATUS_ACCENT[c.status]} ${activeId === c.clause_id ? 'ring-2 ring-blue-400' : ''}`}
            >
              {c.ai_summary && (
                <div className="flex items-center gap-2 mb-1">
                  {c.risk_level && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${RISK_STYLES[c.risk_level]}`}>
                      {c.risk_level}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
                </div>
              )}
              {c.revised_text && <ClauseText text={c.revised_text} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ComparisonPage