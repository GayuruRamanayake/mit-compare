import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import ComparisonPage from './pages/ComparisonPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/comparison/:comparisonId" element={<ComparisonPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App