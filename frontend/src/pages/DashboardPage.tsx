import { useNavigate } from 'react-router-dom'
import UploadPanel from '../components/upload/UploadPanel'

function DashboardPage() {
  const navigate = useNavigate()

  const handleUploadSuccess = (comparisonId: string) => {
    navigate(`/comparison/${comparisonId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">
        Contract comparison
      </h1>
      <UploadPanel onUploadSuccess={handleUploadSuccess} />
    </div>
  )
}

export default DashboardPage