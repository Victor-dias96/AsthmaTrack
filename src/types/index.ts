// Shared type stubs — will be expanded per feature

export type UserId = string;
export type ISODateString = string;

export interface User {
  id: UserId;
  name: string;
  email: string;
  createdAt: ISODateString;
}

export type {
  DailyRecord,
  DailyRecordInsert,
  DailyRecordUpdate,
  SymptomSeverity,
} from "./daily-record";
