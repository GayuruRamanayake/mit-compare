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