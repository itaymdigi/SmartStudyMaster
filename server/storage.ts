import { Quiz, InsertQuiz } from "@shared/schema";

export interface IStorage {
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  updateQuizScore(id: number, score: number): Promise<Quiz>;
}

export class MemStorage implements IStorage {
  private quizzes: Map<number, Quiz>;
  private currentId: number;

  constructor() {
    this.quizzes = new Map();
    this.currentId = 1;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentId++;
    const quiz: Quiz = { 
      ...insertQuiz, 
      id,
      score: null,
      completed: false
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async updateQuizScore(id: number, score: number): Promise<Quiz> {
    const quiz = this.quizzes.get(id);
    if (!quiz) throw new Error("Quiz not found");
    
    const updatedQuiz = {
      ...quiz,
      score,
      completed: true
    };
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }
}

export const storage = new MemStorage();
