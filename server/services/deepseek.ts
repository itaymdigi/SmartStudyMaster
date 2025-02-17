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
  const prompt = `Using your expertise as a quiz generator, create 10 diverse Hebrew questions about ${subject} suitable for ${gradeLevel} level students.

Use these materials as context: ${materials}

Generate a mix of question types:
- 5 multiple-choice questions (4 options each)
- 3 true/false questions
- 2 fill-in-the-blank questions

Each question should:
- Test understanding of key concepts
- Use clear, grade-appropriate Hebrew language
- Include a brief but helpful explanation for the correct answer

Format requirements:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "[question text]",
      "options": ["[option 1]", "[option 2]", "[option 3]", "[option 4]"],
      "correctAnswer": [0-3],
      "explanation": "[explanation]"
    },
    {
      "type": "true-false",
      "question": "[statement]",
      "options": ["נכון", "לא נכון"],
      "correctAnswer": [0-1],
      "explanation": "[explanation]"
    },
    {
      "type": "fill-in-blank",
      "question": "[text with ___]",
      "correctAnswer": "[answer]",
      "explanation": "[explanation]"
    }
  ]
}

Note: All content should be in Hebrew except for the JSON structure.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a specialized educational quiz generator that creates high-quality Hebrew questions."
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
          console.log("Invalid question format:", q);
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
            console.log("Invalid question type:", q.type);
            return false;
        }
      });

      if (validQuestions.length < 10) {
        throw new Error("Not enough valid questions generated");
      }

      return validQuestions;

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
}