import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1"
});

export interface QuizQuestion {
  type: "multiple-choice" | "true-false" | "fill-in-blank";
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function generateQuizQuestions(
  subject: string,
  gradeLevel: string,
  materials: string
): Promise<QuizQuestion[]> {
  const prompt = `Generate 12 questions in Hebrew about ${subject} for ${gradeLevel} students, using different question types.
Study materials: ${materials}

Create a mix of:
1. Multiple-choice questions (6 questions)
   - 4 answer options each
   - One correct answer and three plausible but incorrect options
2. True/False questions (3 questions)
   - Clear statements that test understanding
3. Fill-in-the-blank questions (3 questions)
   - Single word or short phrase answers
   - Clear context that leads to one correct answer

All questions should:
1. Test deep understanding of the materials
2. Use Hebrew for all text
3. Be at an appropriate difficulty level for ${gradeLevel}
4. Include brief explanations for correct answers

Format response as a strict JSON object:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text here",
      "options": ["First", "Second", "Third", "Fourth"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    },
    {
      "type": "true-false",
      "question": "Statement to evaluate",
      "options": ["נכון", "לא נכון"],
      "correctAnswer": 0,
      "explanation": "Why true/false"
    },
    {
      "type": "fill-in-blank",
      "question": "Complete this sentence: ___",
      "correctAnswer": "correct word/phrase",
      "explanation": "Why this is the answer"
    }
  ]
}`;

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert Hebrew teacher who creates engaging, thought-provoking questions that promote deep learning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    try {
      const parsedContent = JSON.parse(content);
      if (!Array.isArray(parsedContent.questions)) {
        throw new Error("Invalid response format: questions array not found");
      }

      // Validate the questions
      const validQuestions: QuizQuestion[] = parsedContent.questions.filter((q: any) => {
        if (!q.type || !q.question || !q.correctAnswer || !q.explanation) {
          return false;
        }

        switch (q.type) {
          case "multiple-choice":
            return Array.isArray(q.options) && q.options.length === 4 && 
                   typeof q.correctAnswer === 'number' && 
                   q.correctAnswer >= 0 && q.correctAnswer <= 3;
          case "true-false":
            return Array.isArray(q.options) && q.options.length === 2 && 
                   typeof q.correctAnswer === 'number' && 
                   q.correctAnswer >= 0 && q.correctAnswer <= 1;
          case "fill-in-blank":
            return typeof q.correctAnswer === 'string' && q.correctAnswer.length > 0;
          default:
            return false;
        }
      });

      if (validQuestions.length < 10) {
        throw new Error("Not enough valid questions generated");
      }

      // Shuffle and select 10 questions
      return shuffleArray(validQuestions).slice(0, 10);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Failed to parse quiz questions");
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    // Return default questions in Hebrew if the API fails
    const defaultQuestions: QuizQuestion[] = [];

    // Generate 5 multiple choice questions
    for (let i = 0; i < 5; i++) {
      defaultQuestions.push({
        type: "multiple-choice",
        question: `שאלה ${i + 1} בנושא ${subject}: ${materials.split(' ').slice(0, 3).join(' ')}...`,
        options: [
          `תשובה א' לשאלה ${i + 1}`,
          `תשובה ב' לשאלה ${i + 1}`,
          `תשובה ג' לשאלה ${i + 1}`,
          `תשובה ד' לשאלה ${i + 1}`
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `הסבר לתשובה הנכונה לשאלה ${i + 1}`
      });
    }

    // Generate 3 true/false questions
    for (let i = 0; i < 3; i++) {
      defaultQuestions.push({
        type: "true-false",
        question: `משפט ${i + 1} לבדיקה בנושא ${subject}`,
        options: ["נכון", "לא נכון"],
        correctAnswer: Math.floor(Math.random() * 2),
        explanation: `הסבר למשפט ${i + 1}`
      });
    }

    // Generate 2 fill-in-blank questions
    for (let i = 0; i < 2; i++) {
      defaultQuestions.push({
        type: "fill-in-blank",
        question: `השלם את המשפט ${i + 1}: ___ בנושא ${subject}`,
        correctAnswer: `תשובה ${i + 1}`,
        explanation: `הסבר להשלמת המשפט ${i + 1}`
      });
    }

    return defaultQuestions;
  }
}