import { useState, useCallback } from 'react'
import { uploadDocuments, ApiError } from '../../api/comparisons'

interface UploadPanelProps {
  onUploadSuccess: (comparisonId: string) => void
}

function UploadPanel({ onUploadSuccess }: UploadPanelProps) {
  const [original, setOriginal] = useState<File | null>(null)
  const [revised, setRevised] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canUpload = original !== null && revised !== null && !isUploading

  const handleUpload = useCallback(async () => {
    if (!original || !revised) return

    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadDocuments(original, revised)
      onUploadSuccess(result.comparison_id)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Upload failed: ${err.message}`)
      } else {
        setError('Could not reach the server. Is the backend running?')
      }
    } finally {
      setIsUploading(false)
    }
  }, [original, revised, onUploadSuccess])

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 bg-white rounded-lg shadow-sm">
      <div>
        <label htmlFor="original-file" className="block text-sm font-medium text-gray-700 mb-1">
          Original document
        </label>
        <input
          id="original-file"
          type="file"
          accept=".docx,.pdf"
          onChange={(e) => setOriginal(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600"
        />
      </div>

      <div>
        <label htmlFor="revised-file" className="block text-sm font-medium text-gray-700 mb-1">
          Revised document
        </label>
        <input
          id="revised-file"
          type="file"
          accept=".docx,.pdf"
          onChange={(e) => setRevised(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!canUpload}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading…' : 'Compare documents'}
      </button>
    </div>
  )
}

export default UploadPanel