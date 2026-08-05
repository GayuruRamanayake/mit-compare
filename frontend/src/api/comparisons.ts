import type { UploadResponse } from './types'

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