export interface Clause {
  clause_id: string
  title: string
  status: 'unchanged' | 'modified' | 'added' | 'deleted'
  original_text: string
  revised_text: string
  risk_level: 'high' | 'medium' | 'low' | 'cosmetic'
  ai_summary: string
}

export interface ComparisonResult {
  comparison_id: string
  clauses: Clause[]
}

export interface UploadResponse {
  comparison_id: string
  original_filename: string
  original_size: number
  revised_filename: string
  revised_size: number
}