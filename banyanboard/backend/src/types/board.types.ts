export interface Board {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardDto {
  title: string;
}

export interface UpdateBoardDto {
  title?: string;
}
