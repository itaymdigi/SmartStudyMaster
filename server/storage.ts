import { supabase } from './db';
import type { Quiz } from './db';

class Storage {
  async createQuiz(data: Omit<Quiz, 'id' | 'created_at'>): Promise<Quiz> {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        subject: data.subject,
        grade_level: data.gradeLevel,
        materials: data.materials,
        questions: data.questions as {
          question: string;
          options: string[];
          correctAnswer: number;
          explanation: string;
        }[],
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapQuizFromDB(quiz);
  }

  async getQuiz(id: number): Promise<Quiz | null> {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Record not found
      throw error;
    }

    return this.mapQuizFromDB(quiz);
  }

  async updateQuizScore(id: number, score: number): Promise<Quiz> {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .update({ score })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapQuizFromDB(quiz);
  }

  private mapQuizFromDB(quiz: any): Quiz {
    return {
      id: quiz.id,
      subject: quiz.subject,
      gradeLevel: quiz.grade_level,
      materials: quiz.materials,
      questions: quiz.questions,
      score: quiz.score,
      created_at: quiz.created_at,
    };
  }
}

export const storage = new Storage();