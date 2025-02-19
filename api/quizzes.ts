import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { studyFormSchema } from '../shared/schema';
import { ZodError } from 'zod';
import { generateQuizQuestions } from '../server/services/deepseek';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      try {
        const formData = studyFormSchema.parse(req.body);
        const questions = await generateQuizQuestions(
          formData.subject,
          formData.gradeLevel,
          formData.materials
        );

        const quiz = await storage.createQuiz({
          ...formData,
          questions
        });

        res.status(200).json(quiz);
      } catch (err) {
        console.error('Error creating quiz:', err);
        if (err instanceof ZodError) {
          res.status(400).json({ message: err.errors[0].message });
        } else {
          res.status(500).json({ message: 'Failed to create quiz' });
        }
      }
      break;

    case 'GET':
      try {
        const { id } = req.query;
        const quiz = await storage.getQuiz(Number(id));
        if (!quiz) {
          return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        res.status(500).json({ message: 'Failed to fetch quiz' });
      }
      break;

    default:
      res.setHeader('Allow', ['POST', 'GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 