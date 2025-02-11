import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { studyFormSchema } from "@shared/schema";
import { ZodError } from "zod";

export function registerRoutes(app: Express): Server {
  // Create new quiz
  app.post("/api/quizzes", async (req, res) => {
    try {
      const formData = studyFormSchema.parse(req.body);

      // Simulate AI question generation
      const questions = Array.from({ length: 30 }, (_, i) => ({
        question: `Sample question ${i + 1} about ${formData.subject}?`,
        options: [
          `Option A for question ${i + 1}`,
          `Option B for question ${i + 1}`,
          `Option C for question ${i + 1}`,
          `Option D for question ${i + 1}`
        ],
        correctAnswer: Math.floor(Math.random() * 4)
      }));

      const quiz = await storage.createQuiz({
        ...formData,
        questions
      });

      console.log("Created quiz:", quiz); // Add logging
      res.json(quiz);
    } catch (err) {
      console.error("Error creating quiz:", err); // Add error logging
      if (err instanceof ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to create quiz" });
      }
    }
  });

  // Get quiz by id
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(Number(req.params.id));
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (err) {
      console.error("Error fetching quiz:", err); // Add error logging
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Submit quiz score
  app.post("/api/quizzes/:id/score", async (req, res) => {
    try {
      const score = Number(req.body.score);
      if (isNaN(score) || score < 0 || score > 100) {
        return res.status(400).json({ message: "Invalid score" });
      }

      const quiz = await storage.updateQuizScore(Number(req.params.id), score);
      res.json(quiz);
    } catch (err) {
      console.error("Error updating score:", err); // Add error logging
      res.status(500).json({ message: "Failed to update score" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}