// import { useState, useCallback } from 'react'
// import { uploadDocuments, ApiError } from '../../api/comparisons'

// interface UploadPanelProps {
//   onUploadSuccess: (comparisonId: string) => void
// }

// function UploadPanel({ onUploadSuccess }: UploadPanelProps) {
//   const [original, setOriginal] = useState<File | null>(null)
//   const [revised, setRevised] = useState<File | null>(null)
//   const [isUploading, setIsUploading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const canUpload = original !== null && revised !== null && !isUploading

//   const handleUpload = useCallback(async () => {
//     if (!original || !revised) return

//     setIsUploading(true)
//     setError(null)

//     try {
//       const result = await uploadDocuments(original, revised)
//       onUploadSuccess(result.comparison_id)
//     } catch (err) {
//       if (err instanceof ApiError) {
//         setError(`Upload failed: ${err.message}`)
//       } else {
//         setError('Could not reach the server. Is the backend running?')
//       }
//     } finally {
//       setIsUploading(false)
//     }
//   }, [original, revised, onUploadSuccess])

//   return (
//     <div className="max-w-md mx-auto p-6 space-y-4 bg-white rounded-lg shadow-sm">
//       <div>
//         <label htmlFor="original-file" className="block text-sm font-medium text-gray-700 mb-1">
//           Original document
//         </label>
//         <input
//           id="original-file"
//           type="file"
//           accept=".docx,.pdf"
//           onChange={(e) => setOriginal(e.target.files?.[0] ?? null)}
//           className="block w-full text-sm text-gray-600"
//         />
//       </div>

//       <div>
//         <label htmlFor="revised-file" className="block text-sm font-medium text-gray-700 mb-1">
//           Revised document
//         </label>
//         <input
//           id="revised-file"
//           type="file"
//           accept=".docx,.pdf"
//           onChange={(e) => setRevised(e.target.files?.[0] ?? null)}
//           className="block w-full text-sm text-gray-600"
//         />
//       </div>

//       {error && (
//         <p role="alert" className="text-sm text-red-600">
//           {error}
//         </p>
//       )}

//       <button
//         type="button"
//         onClick={handleUpload}
//         disabled={!canUpload}
//         className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
//       >
//         {isUploading ? 'Uploading…' : 'Compare documents'}
//       </button>
//     </div>
//   )
// }

// export default UploadPanel







// import { useState, useCallback } from 'react'
// import { uploadDocuments, ApiError } from '../../api/comparisons'

// interface UploadPanelProps {
//   onUploadSuccess: (comparisonId: string) => void
// }

// function UploadPanel({ onUploadSuccess }: UploadPanelProps) {
//   const [original, setOriginal] = useState<File | null>(null)
//   const [revised, setRevised] = useState<File | null>(null)
//   const [isUploading, setIsUploading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const canUpload = original !== null && revised !== null && !isUploading

//   const handleUpload = useCallback(async () => {
//     if (!original || !revised) return
//     setIsUploading(true)
//     setError(null)
//     try {
//       const result = await uploadDocuments(original, revised)
//       onUploadSuccess(result.comparison_id)
//     } catch (err) {
//       if (err instanceof ApiError) {
//         setError(`Upload failed: ${err.message}`)
//       } else {
//         setError('Could not reach the server. Is the backend running?')
//       }
//     } finally {
//       setIsUploading(false)
//     }
//   }, [original, revised, onUploadSuccess])

//   return (
//     <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(20,25,43,0.06),0_8px_24px_rgba(20,25,43,0.06)] p-6">
//       <div className="grid grid-cols-2 gap-4 mb-5">
//         <DocSlot label="Original" file={original} onSelect={setOriginal} />
//         <DocSlot label="Revised" file={revised} onSelect={setRevised} />
//       </div>

//       {error && (
//         <p role="alert" className="text-sm text-redline mb-4">
//           {error}
//         </p>
//       )}

//       <button
//         type="button"
//         onClick={handleUpload}
//         disabled={!canUpload}
//         className="w-full py-3 rounded-lg bg-ink text-parchment font-medium tracking-wide disabled:bg-slate/30 disabled:text-slate disabled:cursor-not-allowed hover:bg-ink/90 transition-colors"
//       >
//         {isUploading ? 'Comparing…' : 'Compare documents'}
//       </button>
//     </div>
//   )
// }

// function DocSlot({
//   label,
//   file,
//   onSelect,
// }: {
//   label: string
//   file: File | null
//   onSelect: (f: File | null) => void
// }) {
//   const inputId = `slot-${label.toLowerCase()}`
//   return (
//     <div>
//       <label
//         htmlFor={inputId}
//         className={`block cursor-pointer border-2 border-dashed rounded-xl px-3 py-6 text-center transition-colors ${
//           file ? 'border-sage bg-sage/5' : 'border-slate/25 hover:border-slate/40'
//         }`}
//       >
//         <p className="font-mono text-[10px] uppercase tracking-wider text-slate mb-2">
//           {label}
//         </p>
//         <p className={`text-sm truncate px-1 ${file ? 'text-ink font-medium' : 'text-slate/70'}`}>
//           {file ? file.name : 'Drop or click'}
//         </p>
//       </label>
//       <input
//         id={inputId}
//         type="file"
//         accept=".docx,.pdf"
//         onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
//         className="sr-only"
//       />
//     </div>
//   )
// }

// export default UploadPanel



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
      setError(err instanceof ApiError ? `Upload failed: ${err.message}` : 'Could not reach the server. Is the backend running?')
    } finally {
      setIsUploading(false)
    }
  }, [original, revised, onUploadSuccess])

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0 mb-5">
        <DocSlot label="Original" accent="crimson" file={original} onSelect={setOriginal} />
        <div className="w-px h-16 bg-white/10 mx-2" />
        <DocSlot label="Revised" accent="teal" file={revised} onSelect={setRevised} />
      </div>

      {error && <p role="alert" className="text-sm text-crimson mb-4">{error}</p>}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!canUpload}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold tracking-wide disabled:bg-white/[0.06] disabled:from-transparent disabled:to-transparent disabled:text-mist disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {isUploading ? 'Comparing…' : 'Compare documents'}
      </button>
    </div>
  )
}

function DocSlot({
  label, accent, file, onSelect,
}: {
  label: string
  accent: 'crimson' | 'teal'
  file: File | null
  onSelect: (f: File | null) => void
}) {
  const inputId = `slot-${label.toLowerCase()}`
  const border = accent === 'crimson' ? 'border-crimson/40 bg-crimson/[0.06]' : 'border-teal/40 bg-teal/[0.06]'
  return (
    <div>
      <label
        htmlFor={inputId}
        className={`block cursor-pointer border rounded-xl px-3 py-6 text-center transition-colors ${
          file ? border : 'border-white/10 hover:border-white/20'
        }`}
      >
        <p className={`font-mono text-[10px] uppercase tracking-widest mb-2 ${accent === 'crimson' ? 'text-crimson' : 'text-teal'}`}>
          {label}
        </p>
        <p className={`text-sm truncate px-1 ${file ? 'text-white font-medium' : 'text-mist/70'}`}>
          {file ? file.name : 'Drop or click'}
        </p>
      </label>
      <input id={inputId} type="file" accept=".docx,.pdf" onChange={(e) => onSelect(e.target.files?.[0] ?? null)} className="sr-only" />
    </div>
  )
}

export default UploadPanel