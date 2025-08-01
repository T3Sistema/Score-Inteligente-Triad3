
export enum UserRole {
  ADMIN = 'admin',
  COMPANY = 'company',
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface User {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
}

export interface AnswerOption {
  id: string;
  text: string;
  score: number;
}

export interface Question {
  id:string;
  categoryId: string;
  text: string;
  answers: AnswerOption[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Submission {
  id: string;
  userId: string;
  companyName: string;
  categoryId: string;
  categoryName: string;
  answers: { questionId: string; score: number }[];
  totalScore: number;
  maxScore: number;
  date: string;
}

export enum LogType {
  USER_APPROVAL = 'user_approval',
  QUESTIONNAIRE_SUBMISSION = 'questionnaire_submission',
  USER_LOGIN = 'user_login',
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  adminId?: string;
  adminName?: string;
}
