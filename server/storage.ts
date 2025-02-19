import { supabase } from './db';
import type { Quiz, DBQuiz, CreateQuizInput, QuizQuestion } from './db';

class Storage {
  async createQuiz(data: CreateQuizInput): Promise<Quiz> {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        subject: data.subject,
        grade_level: data.gradeLevel,
        materials: data.materials,
        questions: JSON.stringify(data.questions),
        score: data.score ?? null,
      } as Partial<DBQuiz>)
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

  private mapQuizFromDB(quiz: DBQuiz): Quiz {
    return {
      id: quiz.id,
      subject: quiz.subject,
      gradeLevel: quiz.grade_level,
      materials: quiz.materials,
      questions: JSON.parse(quiz.questions) as QuizQuestion[],
      score: quiz.score,
      created_at: quiz.created_at,
    };
  }
}

export const storage = new Storage();