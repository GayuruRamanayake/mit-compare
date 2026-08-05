import { useParams } from 'react-router-dom'

function ComparisonPage() {
  const { comparisonId } = useParams<{ comparisonId: string }>()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h1 className="text-xl font-semibold text-gray-800">
        Comparison {comparisonId}
      </h1>
      <p className="text-sm text-gray-500 mt-2">
        Clause review UI goes here — next step is fetching parsed clauses for this comparison.
      </p>
    </div>
  )
}

export default ComparisonPage