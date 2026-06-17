import { LabelSummary } from './label.types';

export type CardColumnId = 'todo' | 'in-progress' | 'done';

export interface Card {
  id: string;
  title: string;
  columnId: CardColumnId;
  position: number;
  createdAt: Date;
  labels?: LabelSummary[];
}

export interface CreateCardDto {
  title: string;
  columnId: CardColumnId;
}

export interface ReorderCardDto {
  position: number;
}
