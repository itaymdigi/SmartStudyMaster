import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

if (!process.env.SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!process.env.SUPABASE_ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY');

// Drizzle setup
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Quiz types
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: number;
  subject: string;
  gradeLevel: string;
  materials: string;
  questions: QuizQuestion[];
  score: number | null;
  created_at: string;
  timeSpent?: number;
}

export type CreateQuizInput = Omit<Quiz, 'id' | 'created_at' | 'score'> & {
  score?: number | null;
};

export interface DBQuiz {
  id: number;
  subject: string;
  grade_level: string;
  materials: string;
  questions: string;
  score: number | null;
  created_at: string;
}

// Supabase client
export const supabase = createClient<{
  Tables: {
    quizzes: {
      Row: DBQuiz;
      Insert: Omit<DBQuiz, 'id' | 'created_at'>;
      Update: Partial<Omit<DBQuiz, 'id' | 'created_at'>>;
    };
  };
}>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
