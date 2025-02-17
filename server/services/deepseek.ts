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
  const prompt = `Generate 10 Hebrew questions about ${subject} for ${gradeLevel} level students.

Study materials: ${materials}

Create:
- 5 multiple-choice questions (4 options)
- 3 true/false questions
- 2 fill-in-the-blank questions

Format each question as:
{
  "type": "multiple-choice/true-false/fill-in-blank",
  "question": "question text",
  "options": ["option1", "option2", etc] (for multiple-choice and true/false),
  "correctAnswer": number (0-3 for multiple-choice, 0-1 for true/false) or string (for fill-in-blank),
  "explanation": "explanation text"
}

Use Hebrew for all text content. Keep questions simple and clear.`;

  try {
    console.log("Generating questions for:", subject);

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a quiz generator that creates Hebrew language questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.log("No content in response");
      throw new Error("No content in response");
    }

    console.log("Raw API response:", content);

    try {
      const parsedContent = JSON.parse(content);
      console.log("Parsed content:", parsedContent);

      if (!Array.isArray(parsedContent.questions)) {
        console.log("No questions array in response");
        throw new Error("Invalid response format: questions array not found");
      }

      // Generate default questions if we don't get enough valid ones
      if (parsedContent.questions.length < 5) {
        console.log("Not enough questions in response, using defaults");
        return generateDefaultQuestions(subject);
      }

      return parsedContent.questions;

    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      return generateDefaultQuestions(subject);
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    return generateDefaultQuestions(subject);
  }
}

function generateDefaultQuestions(subject: string): QuizQuestion[] {
  const defaultQuestions: QuizQuestion[] = [];

  // Generate 5 multiple choice questions
  for (let i = 0; i < 5; i++) {
    defaultQuestions.push({
      type: "multiple-choice",
      question: `שאלה ${i + 1} בנושא ${subject}`,
      options: [
        `תשובה א'`,
        `תשובה ב'`,
        `תשובה ג'`,
        `תשובה ד'`
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `הסבר לתשובה הנכונה`
    });
  }

  // Generate 3 true/false questions
  for (let i = 0; i < 3; i++) {
    defaultQuestions.push({
      type: "true-false",
      question: `משפט ${i + 1} לבדיקה: ${subject}`,
      options: ["נכון", "לא נכון"],
      correctAnswer: Math.floor(Math.random() * 2),
      explanation: `הסבר למשפט`
    });
  }

  // Generate 2 fill-in-blank questions
  for (let i = 0; i < 2; i++) {
    defaultQuestions.push({
      type: "fill-in-blank",
      question: `השלם את המשפט: ___ ${subject}`,
      correctAnswer: `תשובה`,
      explanation: `הסבר להשלמת המשפט`
    });
  }

  return defaultQuestions;
}