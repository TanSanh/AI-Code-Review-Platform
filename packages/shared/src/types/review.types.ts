export interface Review {
  id: string;
  title: string;
  description?: string;
  language: string;
  fileName: string;
  originalCode: string;
  status: ReviewStatus;
  score?: number;
  authorId: string;
  createdAt: Date;
  completedAt?: Date;
}

export type ReviewStatus = 'PENDING' | 'REVIEWING' | 'COMPLETED' | 'FAILED';

export interface CreateReviewRequest {
  title: string;
  description?: string;
  language: string;
  fileName: string;
  code: string;
}

export interface Issue {
  id: string;
  severity: Severity;
  category: Category;
  line: number;
  column?: number;
  endLine?: number;
  message: string;
  suggestion?: string;
  confidence: number;
  aiModel: 'static' | 'security' | 'llm';
  isResolved: boolean;
  createdAt: Date;
}

export type Severity = 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION';
export type Category = 'BUG' | 'SECURITY' | 'PERFORMANCE' | 'MAINTAINABILITY' | 'STYLE';

export interface Comment {
  id: string;
  content: string;
  lineRef?: number;
  isBot: boolean;
  authorId: string;
  reviewId: string;
  parentId?: string;
  createdAt: Date;
}
