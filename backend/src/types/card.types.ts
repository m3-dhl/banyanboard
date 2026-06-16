import { LabelSummary } from './label.types';

export type CardColumnId = 'todo' | 'in-progress' | 'done';

export interface Card {
  id: string;
  title: string;
  columnId: CardColumnId;
  createdAt: Date;
  labels?: LabelSummary[];
}

export interface CreateCardDto {
  title: string;
  columnId: CardColumnId;
}
