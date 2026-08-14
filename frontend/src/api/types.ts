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

export interface Comment {
  author: string
  date: string
  text: string
}

export interface AlignedClause {
  clause_id: string
  status: 'unchanged' | 'modified' | 'added' | 'deleted'
  original_text: string | null
  revised_text: string | null
  original_index: number | null
  revised_index: number | null
  similarity: number
  match_method: string | null
  ai_summary: string | null
  risk_level: 'high' | 'medium' | 'low' | 'cosmetic' | null
  reviewed: boolean
  flagged: boolean
  authors_original: string[]
  authors_revised: string[]
  comments_original: Comment[]
  comments_revised: Comment[]
}

export interface ClausesResponse {
  comparison_id: string
  clauses: AlignedClause[]
}