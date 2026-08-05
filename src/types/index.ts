// Shared type stubs — will be expanded per feature

export type UserId = string;
export type ISODateString = string;

export interface User {
  id: UserId;
  name: string;
  email: string;
  createdAt: ISODateString;
}

export interface DailyRecord {
  id: string;
  userId: UserId;
  date: ISODateString;
  pefValue?: number;
  notes?: string;
  createdAt: ISODateString;
}
