export interface Comment {
  id: string;
  cardId: string;
  body: string;
  createdAt: Date;
}

export interface CreateCommentDto {
  body: string;
}
