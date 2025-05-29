export interface User {
  chat_id: number;
  username?: string;
  type?: UserType;
  ss?: string;
}

export type UserType = 'new' | 'registered';