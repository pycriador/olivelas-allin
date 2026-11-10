export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  parentId: string | null;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  authorAvatarType: string;
  content: string;
  emojis: string[];
  isResolved: boolean;
  resolvedBy: string | null;
  editedAt: string | null;
  createdAt: string;
  replies?: Comment[];
  mentions?: string[];
}

export interface CommentMention {
  commentId: string;
  userId: string;
}
