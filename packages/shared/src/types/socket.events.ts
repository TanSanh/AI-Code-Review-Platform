export interface ClientToServerEvents {
  'join:review': (data: { reviewId: string }) => void;
  'leave:review': (data: { reviewId: string }) => void;
  'typing:start': (data: { reviewId: string }) => void;
  'typing:stop': (data: { reviewId: string }) => void;
}

export interface ServerToClientEvents {
  'comment:created': (comment: CommentEvent) => void;
  'issue:updated': (issue: IssueEvent) => void;
  'review:completed': (review: ReviewEvent) => void;
  'user:typing': (data: { userId: string; isTyping: boolean }) => void;
}

export interface CommentEvent {
  id: string;
  content: string;
  lineRef?: number;
  isBot: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export interface IssueEvent {
  id: string;
  severity: string;
  category: string;
  line: number;
  message: string;
  isResolved: boolean;
}

export interface ReviewEvent {
  id: string;
  status: string;
  score?: number;
  issuesCount: number;
}
