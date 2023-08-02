export type User = {
  username: string;
  id: number;
};

export type UserExtended = User & Record<string, any>;
