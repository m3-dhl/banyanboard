export interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt: Date;
}

export interface LabelSummary {
  id: string;
  name: string;
  color: string;
}

export interface CreateLabelDto {
  name: string;
  color: string;
  boardId: string;
}
