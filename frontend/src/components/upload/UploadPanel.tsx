import { useState, useCallback } from 'react'
import { uploadDocuments, ApiError } from '../../api/comparisons'

interface UploadPanelProps {
  onUploadSuccess: (comparisonId: string) => void
}

function UploadPanel({ onUploadSuccess }: UploadPanelProps) {
  const [original, setOriginal] = useState<File | null>(null)
  const [revised, setRevised] = useState<File | null>(null)
  const [useOriginalBaseline, setUseOriginalBaseline] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canUpload = original !== null && revised !== null && !isUploading

  const handleUpload = useCallback(async () => {
    if (!original || !revised) return
    setIsUploading(true)
    setError(null)
    try {
      const result = await uploadDocuments(original, revised, useOriginalBaseline)
      onUploadSuccess(result.comparison_id)
    } catch (err) {
      setError(err instanceof ApiError ? `Upload failed: ${err.message}` : 'Could not reach the server. Is the backend running?')
    } finally {
      setIsUploading(false)
    }
  }, [original, revised, useOriginalBaseline, onUploadSuccess])

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DocSlot label="Original" file={original} onSelect={setOriginal} />
        <DocSlot label="Revised" file={revised} onSelect={setRevised} />
      </div>

      <label className="flex items-start gap-2 mb-4 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={useOriginalBaseline}
          onChange={(e) => setUseOriginalBaseline(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          The <strong>original</strong> document has tracked changes — compare from its
          pre-edit state instead of its current edited state.
        </span>
      </label>

      {error && <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!canUpload}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 text-white font-semibold tracking-wide disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {isUploading ? 'Comparing…' : 'Compare documents'}
      </button>
    </div>
  )
}

function DocSlot({
  label, file, onSelect,
}: {
  label: string
  file: File | null
  onSelect: (f: File | null) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputId = `slot-${label.toLowerCase()}`

  const isValidFile = (f: File) => /\.(docx|pdf)$/i.test(f.name)

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && isValidFile(droppedFile)) {
      onSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`block cursor-pointer border-2 border-dashed rounded-xl px-3 py-6 text-center transition-colors ${
          isDragOver
            ? 'border-orange-400 bg-orange-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">{label}</p>
        <p className={`text-sm truncate px-1 ${file ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
          {file ? file.name : isDragOver ? 'Drop it here' : 'Drop or click'}
        </p>
      </label>
      <input
        id={inputId}
        type="file"
        accept=".docx,.pdf"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
    </div>
  )
}

export default UploadPanel