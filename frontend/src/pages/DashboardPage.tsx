


// import { useNavigate } from 'react-router-dom'
// import UploadPanel from '../components/upload/UploadPanel'

// function DashboardPage() {
//   const navigate = useNavigate()

//   const handleUploadSuccess = (comparisonId: string) => {
//     navigate(`/comparison/${comparisonId}`)
//   }

//   return (
//     <div className="min-h-screen bg-ink">
//       {/* Hero */}
//       <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
//         <p className="font-mono text-xs tracking-[0.2em] text-goldenrod uppercase mb-6">
//           Statement of Work &middot; Redline Review
//         </p>
//         <h1 className="font-display text-6xl md:text-7xl text-parchment mb-4">
//           MIT Compare
//         </h1>
//         <p className="text-slate text-lg max-w-md mx-auto mb-14">
//           Two drafts. Every clause that moved, in minutes.
//         </p>

//         {/* Signature redline moment */}
//         <div className="bg-parchment/[0.04] border border-parchment/10 rounded-xl p-8 text-left max-w-xl mx-auto">
//           <p className="font-mono text-[11px] text-slate uppercase tracking-wide mb-3">
//             4. Termination
//           </p>
//           <p className="font-body text-parchment/90 leading-relaxed relative inline">
//             Either party may terminate this agreement with{' '}
//             <span className="relative inline-block">
//               30 days
//               <span className="redline-strike absolute left-0 top-1/2 h-[2px] bg-redline" />
//             </span>{' '}
//             <span className="text-goldenrod fade-up inline">45 days</span>{' '}
//             written notice.
//           </p>
//         </div>
//       </div>

//       {/* Upload panel */}
//       <div className="bg-parchment rounded-t-[2rem] pt-14 pb-24 px-6 min-h-[40vh]">
//         <div className="max-w-xl mx-auto">
//           <h2 className="font-display text-2xl text-ink mb-1 text-center">
//             Start a comparison
//           </h2>
//           <p className="text-slate text-sm text-center mb-8">
//             Upload the original and the returned draft &mdash; .docx or .pdf, up to 50MB each.
//           </p>
//           <UploadPanel onUploadSuccess={handleUploadSuccess} />
//         </div>
//       </div>
//     </div>
//   )
// }

// export default DashboardPage










import { useNavigate } from 'react-router-dom'
import UploadPanel from '../components/upload/UploadPanel'

function DashboardPage() {
  const navigate = useNavigate()
  const handleUploadSuccess = (comparisonId: string) => navigate(`/comparison/${comparisonId}`)

  return (
    <div className="min-h-screen bg-void px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-[11px] tracking-[0.25em] text-mist uppercase text-center mb-4">
          Statement of Work &nbsp;/&nbsp; Redline
        </p>
        <h1 className="font-display font-bold text-5xl text-white text-center mb-3">
          MIT Compare
        </h1>
        <p className="text-mist text-center mb-12">
          Every clause that moved between drafts, found automatically.
        </p>

        {/* Live diff hero */}
        <div className="panel rounded-2xl p-1.5 mb-8">
          <div className="grid grid-cols-[1fr_2px_1fr] rounded-xl overflow-hidden">
            <div className="bg-crimson/[0.05] p-6">
              <p className="font-mono text-[10px] tracking-widest text-crimson uppercase mb-3">Original</p>
              <p className="text-white/70 text-sm leading-relaxed">
                Either party may terminate with{' '}
                <span className="relative inline-block text-white">
                  30 days
                  <span className="strike-in absolute left-0 top-1/2 h-[1.5px] bg-crimson" />
                </span>{' '}
                notice.
              </p>
            </div>
            <div className="relative">
              <div className="seam seam-pulse absolute inset-0 w-full" />
            </div>
            <div className="bg-teal/[0.05] p-6">
              <p className="font-mono text-[10px] tracking-widest text-teal uppercase mb-3">Revised</p>
              <p className="text-white/70 text-sm leading-relaxed">
                Either party may terminate with{' '}
                <span className="rise-in text-teal font-medium">45 days</span> notice.
              </p>
            </div>
          </div>
        </div>

        {/* Upload panel */}
        <div className="panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Upload documents</h2>
            <span className="font-mono text-[10px] tracking-widest uppercase text-mist border border-white/10 rounded-full px-3 py-1">
              docx / pdf &middot; 50mb
            </span>
          </div>
          <UploadPanel onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage