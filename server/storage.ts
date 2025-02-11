import { Quiz, InsertQuiz } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { quizzes } from "@shared/schema";

export interface IStorage {
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  updateQuizScore(id: number, score: number, timeSpent?: number): Promise<Quiz>;
  getQuizHistory(subject: string): Promise<Quiz[]>;
}

export class DatabaseStorage implements IStorage {
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values({
      subject: insertQuiz.subject,
      gradeLevel: insertQuiz.gradeLevel,
      materials: insertQuiz.materials,
      questions: insertQuiz.questions,
      score: null,
      completed: false,
      studyMode: insertQuiz.studyMode || false
    }).returning();
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id));
    return quiz;
  }

  async updateQuizScore(id: number, score: number, timeSpent?: number): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set({ 
        score, 
        completed: true,
        timeSpent: timeSpent || null 
      })
      .where(eq(quizzes.id, id))
      .returning();

    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }

  async getQuizHistory(subject: string): Promise<Quiz[]> {
    return db
      .select()
      .from(quizzes)
      .where(eq(quizzes.subject, subject))
      .orderBy(quizzes.createdAt);
  }
}

export const storage = new DatabaseStorage();