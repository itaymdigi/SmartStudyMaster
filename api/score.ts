import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  const { score } = req.body;

  try {
    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ message: 'Invalid score' });
    }

    const quiz = await storage.updateQuizScore(Number(id), numericScore);
    res.status(200).json(quiz);
  } catch (err) {
    console.error('Error updating score:', err);
    res.status(500).json({ message: 'Failed to update score' });
  }
} 