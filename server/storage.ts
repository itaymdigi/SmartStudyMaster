import { Quiz, InsertQuiz } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { quizzes } from "@shared/schema";

export interface IStorage {
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  updateQuizScore(id: number, score: number): Promise<Quiz>;
}

export class DatabaseStorage implements IStorage {
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values(insertQuiz)
      .returning();
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id));
    return quiz;
  }

  async updateQuizScore(id: number, score: number): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set({ score, completed: true })
      .where(eq(quizzes.id, id))
      .returning();

    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }
}

export const storage = new DatabaseStorage();