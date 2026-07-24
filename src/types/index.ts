export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'done';
  category_id: string | null;
  due_date: string | null;
  created_at: string;
}

export interface TaskWithStarred extends Task {
  starred: boolean;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: 'open' | 'done';
  category_id?: string | null;
  due_date?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'open' | 'done';
  category_id?: string | null;
  due_date?: string | null;
}

export interface CreateCategoryInput {
  name: string;
}
