export type CardColumnId = 'todo' | 'in-progress' | 'done';

export interface Card {
  id: string;
  title: string;
  columnId: CardColumnId;
  createdAt: Date;
}

export interface CreateCardDto {
  title: string;
  columnId: CardColumnId;
}
