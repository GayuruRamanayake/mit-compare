// import { useEffect, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { getComparisonAnalysis, updateClauseReview, ApiError } from '../api/comparisons'
// import type { AlignedClause } from '../api/types'
// import ClauseText from '../components/comparison/ClauseText'

// const RISK_BORDER: Record<string, string> = {
//   high: 'border-l-red-400 bg-red-50',
//   medium: 'border-l-amber-400 bg-amber-50',
//   low: 'border-l-blue-400 bg-blue-50',
//   cosmetic: 'border-l-gray-300 bg-gray-50',
// }
// const DEFAULT_BORDER = 'border-l-transparent'

// const RISK_BADGE: Record<string, string> = {
//   high: 'bg-red-100 text-red-700',
//   medium: 'bg-amber-100 text-amber-700',
//   low: 'bg-blue-100 text-blue-700',
//   cosmetic: 'bg-gray-100 text-gray-600',
// }

// const STATUS_BADGE: Record<AlignedClause['status'], { label: string; style: string } | null> = {
//   unchanged: null,
//   modified: { label: 'modified', style: 'bg-gray-100 text-gray-600' },
//   added: { label: 'added', style: 'bg-gray-100 text-gray-600' },
//   deleted: { label: 'deleted', style: 'bg-gray-100 text-gray-600' },
// }

// const BADGE_BASE = 'text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap'

// function getCardStyle(c: AlignedClause) {
//   return c.risk_level ? RISK_BORDER[c.risk_level] : DEFAULT_BORDER
// }

// function ComparisonPage() {
//   const { comparisonId } = useParams<{ comparisonId: string }>()
//   const [clauses, setClauses] = useState<AlignedClause[] | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeId, setActiveId] = useState<string | null>(null)

//   useEffect(() => {
//     if (!comparisonId) return
//     const controller = new AbortController()

//     async function load() {
//       if (!comparisonId) return
//       setIsLoading(true)
//       setError(null)
//       try {
//         const data = await getComparisonAnalysis(comparisonId, controller.signal)
//         setClauses(data.clauses)
//         setIsLoading(false)
//       } catch (err) {
//         if (err instanceof DOMException && err.name === 'AbortError') return
//         setError(err instanceof ApiError ? err.message : 'Could not reach the server.')
//         setIsLoading(false)
//       }
//     }
//     load()
//     return () => controller.abort()
//   }, [comparisonId])

//   const jumpTo = (clauseId: string) => {
//     setActiveId(clauseId)
//     document.getElementById(`left-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
//     document.getElementById(`right-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
//     setTimeout(() => setActiveId(null), 1500)
//   }

//   const toggleReviewed = async (clauseId: string, current: boolean) => {
//     if (!comparisonId) return
//     setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, reviewed: !current } : c))
//     try {
//       await updateClauseReview(comparisonId, clauseId, { reviewed: !current })
//     } catch {
//       setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, reviewed: current } : c))
//     }
//   }

//   const toggleFlagged = async (clauseId: string, current: boolean) => {
//     if (!comparisonId) return
//     setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, flagged: !current } : c))
//     try {
//       await updateClauseReview(comparisonId, clauseId, { flagged: !current })
//     } catch {
//       setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, flagged: current } : c))
//     }
//   }

//   if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Analyzing changes…</p></div>
//   if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-red-600">{error}</p></div>
//   if (!clauses) return null

//   const changedList = clauses.filter((c) => c.status !== 'unchanged')
//   const leftPane = clauses.filter((c) => c.original_index !== null).sort((a, b) => a.original_index! - b.original_index!)
//   const rightPane = clauses.filter((c) => c.revised_index !== null).sort((a, b) => a.revised_index! - b.revised_index!)

//   const reviewedCount = changedList.filter((c) => c.reviewed).length
//   const reviewPct = changedList.length > 0 ? Math.round((reviewedCount / changedList.length) * 100) : 0

//   return (
//     <div className="h-screen flex bg-gray-50">
//       {/* Sidebar */}
//       <div className="w-64 border-r bg-white overflow-y-auto p-4 flex-shrink-0">
//         <h1 className="font-bold text-gray-800 text-base mb-4">MIT Compare</h1>

//         <div className="mb-4">
//           <p className="text-sm text-gray-500 mb-2">{reviewedCount} of {changedList.length} reviewed</p>
//           <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
//             <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${reviewPct}%` }} />
//           </div>
//         </div>

//         <div className="space-y-2">
//           {changedList.map((c) => (
//             <button
//               key={c.clause_id}
//               onClick={() => jumpTo(c.clause_id)}
//               className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm"
//             >
//               <div className="flex items-center gap-2 mb-1 flex-wrap">
//                 {c.risk_level && (
//                   <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>
//                 )}
//                 {STATUS_BADGE[c.status] && (
//                   <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>
//                 )}
//                 {c.reviewed && <span className="text-green-600 text-xs">✓</span>}
//                 {c.flagged && <span className="text-red-600 text-xs">⚑</span>}
//               </div>
//               <p className="text-gray-700">{(c.original_text || c.revised_text || '').slice(0, 40)}…</p>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Two panes */}
//       <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
//         <div className="overflow-y-auto p-4">
//           <p className="text-xs font-medium text-gray-400 mb-3 sticky top-0 bg-gray-50">ORIGINAL</p>
//           {leftPane.map((c) => (
//             <div
//               id={`left-${c.clause_id}`}
//               key={c.clause_id}
//               className={`border-l-4 px-3 py-2 mb-2 rounded transition-colors ${getCardStyle(c)} ${activeId === c.clause_id ? 'ring-2 ring-orange-400' : ''}`}
//             >
//               {c.ai_summary && (
//                 <>
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     {c.risk_level && <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>}
//                     {STATUS_BADGE[c.status] && <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>}
//                     <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
//                   </div>
//                   <div className="flex items-center gap-2 mb-2">
//                     <button
//                       onClick={() => toggleReviewed(c.clause_id, c.reviewed)}
//                       className={`text-xs px-2 py-1 rounded border ${c.reviewed ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.reviewed ? '✓ Reviewed' : 'Mark reviewed'}
//                     </button>
//                     <button
//                       onClick={() => toggleFlagged(c.clause_id, c.flagged)}
//                       className={`text-xs px-2 py-1 rounded border ${c.flagged ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.flagged ? '⚑ Flagged' : 'Flag'}
//                     </button>
//                   </div>
//                 </>
//               )}
//               {c.original_text && <ClauseText text={c.original_text} />}
//             </div>
//           ))}
//         </div>

//         <div className="overflow-y-auto p-4">
//           <p className="text-xs font-medium text-gray-400 mb-3 sticky top-0 bg-gray-50">REVISED</p>
//           {rightPane.map((c) => (
//             <div
//               id={`right-${c.clause_id}`}
//               key={c.clause_id}
//               className={`border-l-4 px-3 py-2 mb-2 rounded transition-colors ${getCardStyle(c)} ${activeId === c.clause_id ? 'ring-2 ring-orange-400' : ''}`}
//             >
//               {c.ai_summary && (
//                 <>
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     {c.risk_level && <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>}
//                     {STATUS_BADGE[c.status] && <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>}
//                     <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
//                   </div>
//                   <div className="flex items-center gap-2 mb-2">
//                     <button
//                       onClick={() => toggleReviewed(c.clause_id, c.reviewed)}
//                       className={`text-xs px-2 py-1 rounded border ${c.reviewed ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.reviewed ? '✓ Reviewed' : 'Mark reviewed'}
//                     </button>
//                     <button
//                       onClick={() => toggleFlagged(c.clause_id, c.flagged)}
//                       className={`text-xs px-2 py-1 rounded border ${c.flagged ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.flagged ? '⚑ Flagged' : 'Flag'}
//                     </button>
//                   </div>
//                 </>
//               )}
//               {c.revised_text && <ClauseText text={c.revised_text} />}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default ComparisonPage










// import { useEffect, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { getComparisonAnalysis, updateClauseReview, ApiError } from '../api/comparisons'
// import type { AlignedClause } from '../api/types'
// import ClauseText from '../components/comparison/ClauseText'

// const RISK_BORDER: Record<string, string> = {
//   high: 'border-l-red-400 bg-red-50',
//   medium: 'border-l-amber-400 bg-amber-50',
//   low: 'border-l-blue-400 bg-blue-50',
//   cosmetic: 'border-l-gray-300 bg-gray-50',
// }
// const DEFAULT_BORDER = 'border-l-transparent'

// const RISK_BADGE: Record<string, string> = {
//   high: 'bg-red-100 text-red-700',
//   medium: 'bg-amber-100 text-amber-700',
//   low: 'bg-blue-100 text-blue-700',
//   cosmetic: 'bg-gray-100 text-gray-600',
// }

// const STATUS_BADGE: Record<AlignedClause['status'], { label: string; style: string } | null> = {
//   unchanged: null,
//   modified: { label: 'modified', style: 'bg-gray-100 text-gray-600' },
//   added: { label: 'added', style: 'bg-gray-100 text-gray-600' },
//   deleted: { label: 'deleted', style: 'bg-gray-100 text-gray-600' },
// }

// const BADGE_BASE = 'text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap'

// const LOADING_STEPS = [
//   'Parsing documents…',
//   'Aligning clauses…',
//   'Checking for reworded clauses…',
//   'Analyzing changes with AI…',
//   'Almost done…',
// ]

// function getCardStyle(c: AlignedClause) {
//   return c.risk_level ? RISK_BORDER[c.risk_level] : DEFAULT_BORDER
// }

// function useLoadingProgress(isLoading: boolean) {
//   const [stepIndex, setStepIndex] = useState(0)
//   const [elapsed, setElapsed] = useState(0)

//   useEffect(() => {
//     if (!isLoading) {
//       setStepIndex(0)
//       setElapsed(0)
//       return
//     }
//     const stepTimer = setInterval(() => {
//       setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1))
//     }, 4000)
//     const clock = setInterval(() => setElapsed((e) => e + 1), 1000)
//     return () => {
//       clearInterval(stepTimer)
//       clearInterval(clock)
//     }
//   }, [isLoading])

//   return { step: LOADING_STEPS[stepIndex], elapsed }
// }

// function ComparisonPage() {
//   const { comparisonId } = useParams<{ comparisonId: string }>()
//   const [clauses, setClauses] = useState<AlignedClause[] | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeId, setActiveId] = useState<string | null>(null)
//   const { step, elapsed } = useLoadingProgress(isLoading)

//   useEffect(() => {
//     if (!comparisonId) return
//     const controller = new AbortController()

//     async function load() {
//       if (!comparisonId) return
//       setIsLoading(true)
//       setError(null)
//       try {
//         const data = await getComparisonAnalysis(comparisonId, controller.signal)
//         setClauses(data.clauses)
//         setIsLoading(false)
//       } catch (err) {
//         if (err instanceof DOMException && err.name === 'AbortError') return
//         setError(err instanceof ApiError ? err.message : 'Could not reach the server.')
//         setIsLoading(false)
//       }
//     }
//     load()
//     return () => controller.abort()
//   }, [comparisonId])

//   const jumpTo = (clauseId: string) => {
//     setActiveId(clauseId)
//     document.getElementById(`left-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
//     document.getElementById(`right-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
//     setTimeout(() => setActiveId(null), 1500)
//   }

//   const toggleReviewed = async (clauseId: string, current: boolean) => {
//     if (!comparisonId) return
//     setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, reviewed: !current } : c))
//     try {
//       await updateClauseReview(comparisonId, clauseId, { reviewed: !current })
//     } catch {
//       setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, reviewed: current } : c))
//     }
//   }

//   const toggleFlagged = async (clauseId: string, current: boolean) => {
//     if (!comparisonId) return
//     setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, flagged: !current } : c))
//     try {
//       await updateClauseReview(comparisonId, clauseId, { flagged: !current })
//     } catch {
//       setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, flagged: current } : c))
//     }
//   }

//   if (isLoading) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="text-center">
//         <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-gray-200 border-t-orange-500 animate-spin" />
//         <p className="text-gray-600 font-medium mb-1">{step}</p>
//         <p className="text-gray-400 text-xs font-mono">{elapsed}s elapsed</p>
//       </div>
//     </div>
//   )
//   if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-red-600">{error}</p></div>
//   if (!clauses) return null

//   const changedList = clauses.filter((c) => c.status !== 'unchanged')
//   const leftPane = clauses.filter((c) => c.original_index !== null).sort((a, b) => a.original_index! - b.original_index!)
//   const rightPane = clauses.filter((c) => c.revised_index !== null).sort((a, b) => a.revised_index! - b.revised_index!)

//   const reviewedCount = changedList.filter((c) => c.reviewed).length
//   const reviewPct = changedList.length > 0 ? Math.round((reviewedCount / changedList.length) * 100) : 0

//   return (
//     <div className="h-screen flex bg-gray-50">
//       {/* Sidebar */}
//       <div className="w-64 border-r bg-white overflow-y-auto p-4 flex-shrink-0">
//         <h1 className="font-bold text-gray-800 text-base mb-4">MIT Compare</h1>

//         <div className="mb-4">
//           <p className="text-sm text-gray-500 mb-2">{reviewedCount} of {changedList.length} reviewed</p>
//           <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
//             <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${reviewPct}%` }} />
//           </div>
//         </div>

//         <div className="space-y-2">
//           {changedList.map((c) => (
//             <button
//               key={c.clause_id}
//               onClick={() => jumpTo(c.clause_id)}
//               className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm"
//             >
//               <div className="flex items-center gap-2 mb-1 flex-wrap">
//                 {c.risk_level && (
//                   <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>
//                 )}
//                 {STATUS_BADGE[c.status] && (
//                   <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>
//                 )}
//                 {c.reviewed && <span className="text-green-600 text-xs">✓</span>}
//                 {c.flagged && <span className="text-red-600 text-xs">⚑</span>}
//               </div>
//               <p className="text-gray-700">{(c.original_text || c.revised_text || '').slice(0, 40)}…</p>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Two panes */}
//       <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
//         <div className="overflow-y-auto p-4">
//           <p className="text-xs font-medium text-gray-400 mb-3 sticky top-0 bg-gray-50">ORIGINAL</p>
//           {leftPane.map((c) => (
//             <div
//               id={`left-${c.clause_id}`}
//               key={c.clause_id}
//               className={`border-l-4 px-3 py-2 mb-2 rounded transition-colors ${getCardStyle(c)} ${activeId === c.clause_id ? 'ring-2 ring-orange-400' : ''}`}
//             >
//               {c.ai_summary && (
//                 <>
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     {c.risk_level && <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>}
//                     {STATUS_BADGE[c.status] && <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>}
//                     <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
//                   </div>
//                   <div className="flex items-center gap-2 mb-2">
//                     <button
//                       onClick={() => toggleReviewed(c.clause_id, c.reviewed)}
//                       className={`text-xs px-2 py-1 rounded border ${c.reviewed ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.reviewed ? '✓ Reviewed' : 'Mark reviewed'}
//                     </button>
//                     <button
//                       onClick={() => toggleFlagged(c.clause_id, c.flagged)}
//                       className={`text-xs px-2 py-1 rounded border ${c.flagged ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.flagged ? '⚑ Flagged' : 'Flag'}
//                     </button>
//                   </div>
//                 </>
//               )}
//               {c.original_text && <ClauseText text={c.original_text} />}
//             </div>
//           ))}
//         </div>

//         <div className="overflow-y-auto p-4">
//           <p className="text-xs font-medium text-gray-400 mb-3 sticky top-0 bg-gray-50">REVISED</p>
//           {rightPane.map((c) => (
//             <div
//               id={`right-${c.clause_id}`}
//               key={c.clause_id}
//               className={`border-l-4 px-3 py-2 mb-2 rounded transition-colors ${getCardStyle(c)} ${activeId === c.clause_id ? 'ring-2 ring-orange-400' : ''}`}
//             >
//               {c.ai_summary && (
//                 <>
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     {c.risk_level && <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>}
//                     {STATUS_BADGE[c.status] && <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>}
//                     <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
//                   </div>
//                   <div className="flex items-center gap-2 mb-2">
//                     <button
//                       onClick={() => toggleReviewed(c.clause_id, c.reviewed)}
//                       className={`text-xs px-2 py-1 rounded border ${c.reviewed ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.reviewed ? '✓ Reviewed' : 'Mark reviewed'}
//                     </button>
//                     <button
//                       onClick={() => toggleFlagged(c.clause_id, c.flagged)}
//                       className={`text-xs px-2 py-1 rounded border ${c.flagged ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
//                     >
//                       {c.flagged ? '⚑ Flagged' : 'Flag'}
//                     </button>
//                   </div>
//                 </>
//               )}
//               {c.revised_text && <ClauseText text={c.revised_text} />}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default ComparisonPage





import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getComparisonAnalysis, updateClauseReview, ApiError, API_BASE_URL } from '../api/comparisons'
import type { AlignedClause } from '../api/types'
import ClauseText from '../components/comparison/ClauseText'




const RISK_BORDER: Record<string, string> = {
  high: 'border-l-red-400 bg-red-50',
  medium: 'border-l-amber-400 bg-amber-50',
  low: 'border-l-blue-400 bg-blue-50',
  cosmetic: 'border-l-gray-300 bg-gray-50',
}
// const DEFAULT_BORDER = 'border-l-transparent'
const DEFAULT_BORDER = 'border-l-transparent bg-white'

const RISK_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
  cosmetic: 'bg-gray-100 text-gray-600',
}

const STATUS_BADGE: Record<AlignedClause['status'], { label: string; style: string } | null> = {
  unchanged: null,
  modified: { label: 'modified', style: 'bg-gray-100 text-gray-600' },
  added: { label: 'added', style: 'bg-gray-100 text-gray-600' },
  deleted: { label: 'deleted', style: 'bg-gray-100 text-gray-600' },
}

const BADGE_BASE = 'text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap'

const LOADING_STEPS = [
  'Parsing documents…',
  'Aligning clauses…',
  'Checking for reworded clauses…',
  'Analyzing changes with AI…',
  'Almost done…',
]

function getCardStyle(c: AlignedClause) {
  return c.risk_level ? RISK_BORDER[c.risk_level] : DEFAULT_BORDER
}

function useLoadingProgress(isLoading: boolean) {
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setStepIndex(0)
      setElapsed(0)
      return
    }
    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1))
    }, 4000)
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => {
      clearInterval(stepTimer)
      clearInterval(clock)
    }
  }, [isLoading])

  return { step: LOADING_STEPS[stepIndex], elapsed }
}

function ComparisonPage() {
  const { comparisonId } = useParams<{ comparisonId: string }>()
  const [clauses, setClauses] = useState<AlignedClause[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'clauses' | 'document'>('clauses')
  const { step, elapsed } = useLoadingProgress(isLoading)
  const [fileType, setFileType] = useState<{ original: 'pdf' | 'docx' | null; revised: 'pdf' | 'docx' | null }>({ original: null, revised: null })



  const [docPreviewError, setDocPreviewError] = useState<{ original: boolean; revised: boolean }>({ original: false, revised: false })

  
  useEffect(() => {
    if (viewMode !== 'document' || !comparisonId) return

    async function detectTypes() {
      for (const side of ['original', 'revised'] as const) {
        try {
          const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/file/${side}`, { method: 'HEAD' })
          const contentType = res.headers.get('content-type') || ''
          const type = contentType.includes('pdf') ? 'pdf' : contentType.includes('wordprocessingml') ? 'docx' : null
          setFileType((prev) => ({ ...prev, [side]: type }))
        } catch {
          setFileType((prev) => ({ ...prev, [side]: null }))
        }
      }
    }
    detectTypes()
  }, [viewMode, comparisonId])


  useEffect(() => {
    if (!comparisonId) return
    const controller = new AbortController()

    async function load() {
      if (!comparisonId) return
      setIsLoading(true)
      setError(null)
      try {
        const data = await getComparisonAnalysis(comparisonId, controller.signal)
        setClauses(data.clauses)
        setIsLoading(false)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Could not reach the server.')
        setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [comparisonId])

  const jumpTo = (clauseId: string) => {
    setActiveId(clauseId)
    document.getElementById(`left-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.getElementById(`right-${clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => setActiveId(null), 1500)
  }

  const toggleReviewed = async (clauseId: string, current: boolean) => {
    if (!comparisonId) return
    setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, reviewed: !current } : c))
    try {
      await updateClauseReview(comparisonId, clauseId, { reviewed: !current })
    } catch {
      setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, reviewed: current } : c))
    }
  }

  const toggleFlagged = async (clauseId: string, current: boolean) => {
    if (!comparisonId) return
    setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, flagged: !current } : c))
    try {
      await updateClauseReview(comparisonId, clauseId, { flagged: !current })
    } catch {
      setClauses((prev) => prev && prev.map((c) => c.clause_id === clauseId ? { ...c, flagged: current } : c))
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-gray-200 border-t-orange-500 animate-spin" />
        <p className="text-gray-600 font-medium mb-1">{step}</p>
        <p className="text-gray-400 text-xs font-mono">{elapsed}s elapsed</p>
      </div>
    </div>
  )
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-red-600">{error}</p></div>
  if (!clauses) return null

  const changedList = clauses.filter((c) => c.status !== 'unchanged')
  const leftPane = clauses.filter((c) => c.original_index !== null).sort((a, b) => a.original_index! - b.original_index!)
  const rightPane = clauses.filter((c) => c.revised_index !== null).sort((a, b) => a.revised_index! - b.revised_index!)

  const reviewedCount = changedList.filter((c) => c.reviewed).length
  const reviewPct = changedList.length > 0 ? Math.round((reviewedCount / changedList.length) * 100) : 0

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white overflow-y-auto p-4 flex-shrink-0">
        <h1 className="font-bold text-gray-800 text-base mb-4">MIT Compare</h1>

        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('clauses')}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${viewMode === 'clauses' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            Clauses
          </button>
          <button
            onClick={() => setViewMode('document')}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${viewMode === 'document' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            Document
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">{reviewedCount} of {changedList.length} reviewed</p>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${reviewPct}%` }} />
          </div>
        </div>

        <div className="space-y-2">
          {changedList.map((c) => (
            <button
              key={c.clause_id}
              onClick={() => { setViewMode('clauses'); jumpTo(c.clause_id) }}
              className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {c.risk_level && (
                  <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>
                )}
                {STATUS_BADGE[c.status] && (
                  <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>
                )}
                {c.reviewed && <span className="text-green-600 text-xs">✓</span>}
                {c.flagged && <span className="text-red-600 text-xs">⚑</span>}
              </div>
              <p className="text-gray-700">{(c.original_text || c.revised_text || '').slice(0, 40)}…</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      {viewMode === 'clauses' ? (
        <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
          <div className="overflow-y-auto p-4">
            <p className="text-xs font-medium text-gray-400 mb-3 sticky top-0 bg-gray-50">ORIGINAL</p>
            {leftPane.map((c) => (
              <div
                id={`left-${c.clause_id}`}
                key={c.clause_id}
                className={`border-l-4 px-6 py-5 mb-3 rounded-sm shadow-sm transition-colors ${getCardStyle(c)} ${activeId === c.clause_id ? 'ring-2 ring-orange-400' : ''}`}
              >
                {c.ai_summary && (
                  <>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {c.risk_level && <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>}
                      {STATUS_BADGE[c.status] && <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>}
                      <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleReviewed(c.clause_id, c.reviewed)}
                        className={`text-xs px-2 py-1 rounded border ${c.reviewed ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {c.reviewed ? '✓ Reviewed' : 'Mark reviewed'}
                      </button>
                      <button
                        onClick={() => toggleFlagged(c.clause_id, c.flagged)}
                        className={`text-xs px-2 py-1 rounded border ${c.flagged ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {c.flagged ? '⚑ Flagged' : 'Flag'}
                      </button>
                    </div>
                  </>
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
                className={`border-l-4 px-6 py-5 mb-3 rounded-sm shadow-sm transition-colors ${getCardStyle(c)} ${activeId === c.clause_id ? 'ring-2 ring-orange-400' : ''}`}
              >
                {c.ai_summary && (
                  <>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {c.risk_level && <span className={`${BADGE_BASE} ${RISK_BADGE[c.risk_level]}`}>{c.risk_level}</span>}
                      {STATUS_BADGE[c.status] && <span className={`${BADGE_BASE} ${STATUS_BADGE[c.status]!.style}`}>{STATUS_BADGE[c.status]!.label}</span>}
                      <p className="text-xs text-gray-500 italic">{c.ai_summary}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleReviewed(c.clause_id, c.reviewed)}
                        className={`text-xs px-2 py-1 rounded border ${c.reviewed ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {c.reviewed ? '✓ Reviewed' : 'Mark reviewed'}
                      </button>
                      <button
                        onClick={() => toggleFlagged(c.clause_id, c.flagged)}
                        className={`text-xs px-2 py-1 rounded border ${c.flagged ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {c.flagged ? '⚑ Flagged' : 'Flag'}
                      </button>
                    </div>
                  </>
                )}
                {c.revised_text && <ClauseText text={c.revised_text} />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
          <div className="h-full flex flex-col">
            <p className="text-xs font-medium text-gray-400 px-4 py-2 bg-gray-50 border-b">ORIGINAL</p>
            {fileType.original === 'pdf' ? (
              <iframe src={`${API_BASE_URL}/comparisons/${comparisonId}/file/original`} className="w-full flex-1 border-0" title="Original document" />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-400 px-6 text-center">Document preview is only available for PDF uploads.</p>
              </div>
            )}
          </div>
          <div className="h-full flex flex-col">
            <p className="text-xs font-medium text-gray-400 px-4 py-2 bg-gray-50 border-b">REVISED</p>
            {fileType.revised === 'pdf' ? (
              <iframe src={`${API_BASE_URL}/comparisons/${comparisonId}/file/revised`} className="w-full flex-1 border-0" title="Revised document" />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-400 px-6 text-center">Document preview is only available for PDF uploads.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparisonPage