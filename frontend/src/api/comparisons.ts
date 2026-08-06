import type { UploadResponse } from './types'
import type { ClausesResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

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


export async function getComparisonAnalysis(comparisonId: string): Promise<ClausesResponse> {
  const res = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}/analysis`)
  if (!res.ok) {
    throw new ApiError(`Failed to fetch analysis`, res.status)
  }
  return res.json()
}