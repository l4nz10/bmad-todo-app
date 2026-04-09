export const todoKeys = {
  all: ['todos'] as const,
  detail: (id: string) => ['todos', id] as const,
};

export const trashKeys = {
  all: ['trash'] as const,
};
