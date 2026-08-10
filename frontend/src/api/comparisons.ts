// import type { UploadResponse } from './types'
// import type { ClausesResponse } from './types'

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// // After (works with erasableSyntaxOnly)
// export class ApiError extends Error {
//   status: number

//   constructor(message: string, status: number) {
//     super(message)
//     this.status = status
//     this.name = 'ApiError'
//   }
// }

// export async function uploadDocuments(
//   original: File,
//   revised: File,
// ): Promise<UploadResponse> {
//   const formData = new FormData()
//   formData.append('original', original)
//   formData.append('revised', revised)

//   const res = await fetch(`${API_BASE_URL}/comparisons/upload`, {
//     method: 'POST',
//     body: formData,
//   })

//   if (!res.ok) {
//     throw new ApiError(`Upload failed with status ${res.status}`, res.status)
//   }

//   return res.json()
// }


// export async function getComparisonClauses(comparisonId: string): Promise<ClausesResponse> {
//   const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/clauses`)

//   if (!res.ok) {
//     throw new ApiError(`Failed to fetch clauses`, res.status)
//   }

//   return res.json()
// }


// export async function getComparisonAnalysis(comparisonId: string, signal?: AbortSignal): Promise<ClausesResponse> {
//   const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/analysis`, { signal })
//   if (!res.ok) throw new ApiError(`Failed to fetch analysis`, res.status)
//   return res.json()
// }

// export async function updateClauseReview(
//   comparisonId: string,
//   clauseId: string,
//   update: { reviewed?: boolean; flagged?: boolean }
// ): Promise<{ clause_id: string; reviewed: boolean; flagged: boolean }> {
//   const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/clauses/${clauseId}`, {
//     method: 'PATCH',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(update),
//   })
//   if (!res.ok) {
//     throw new ApiError(`Failed to update clause`, res.status)
//   }
//   return res.json()
// }







import type { UploadResponse } from './types'
import type { ClausesResponse } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// After (works with erasableSyntaxOnly)
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function uploadDocuments(
  original: File,
  revised: File,
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('original', original)
  formData.append('revised', revised)

  const res = await fetch(`${API_BASE_URL}/comparisons/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new ApiError(`Upload failed with status ${res.status}`, res.status)
  }

  return res.json()
}


export async function getComparisonClauses(comparisonId: string): Promise<ClausesResponse> {
  const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/clauses`)

  if (!res.ok) {
    throw new ApiError(`Failed to fetch clauses`, res.status)
  }

  return res.json()
}


export async function getComparisonAnalysis(comparisonId: string, signal?: AbortSignal): Promise<ClausesResponse> {
  const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/analysis`, { signal })
  if (!res.ok) throw new ApiError(`Failed to fetch analysis`, res.status)
  return res.json()
}

export async function updateClauseReview(
  comparisonId: string,
  clauseId: string,
  update: { reviewed?: boolean; flagged?: boolean }
): Promise<{ clause_id: string; reviewed: boolean; flagged: boolean }> {
  const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/clauses/${clauseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
  if (!res.ok) {
    throw new ApiError(`Failed to update clause`, res.status)
  }
  return res.json()
}


export function getReportDownloadUrl(comparisonId: string): string {
  return `${API_BASE_URL}/comparisons/${comparisonId}/report`
}