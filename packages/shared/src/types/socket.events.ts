export interface ClientToServerEvents {
  'join:review': (data: { reviewId: string }) => void;
  'leave:review': (data: { reviewId: string }) => void;
  'typing:start': (data: { reviewId: string }) => void;
  'typing:stop': (data: { reviewId: string }) => void;
  'join:community': (data: { postId: string }) => void;
  'leave:community': (data: { postId: string }) => void;
  'join:user': (data: { userId: string }) => void;
}

export interface ServerToClientEvents {
  'comment:created': (comment: CommentEvent) => void;
  'issue:updated': (issue: IssueEvent) => void;
  'review:completed': (review: ReviewEvent) => void;
  'user:typing': (data: { userId: string; isTyping: boolean }) => void;
  'community:comment:created': (comment: CommunityCommentEvent) => void;
  'community:comment:deleted': (data: { postId: string; commentId: string }) => void;
  'notification:created': (notification: NotificationEvent) => void;
  'notification:count': (count: number) => void;
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

export interface CommunityCommentEvent {
  id: string;
  content: string;
  parentId: string | null;
  postId: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  actor: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}
