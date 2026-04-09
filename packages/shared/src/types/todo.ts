export interface Todo {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  id: string;
  text: string;
}

export interface UpdateTodoRequest {
  completed?: boolean;
  text?: string;
}
