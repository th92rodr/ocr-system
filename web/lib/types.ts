export type AuthResponse = {
  token: string;
};

export type Document = {
  id: string;
  fileName: string;
};

export type Message = {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
};
