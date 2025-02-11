import OpenAI from "openai";

// Initialize the Deepseek client
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1"
});

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export async function generateQuizQuestions(
  subject: string,
  gradeLevel: string,
  materials: string
): Promise<QuizQuestion[]> {
  const prompt = `Generate 10 multiple-choice questions for a ${gradeLevel} level quiz about ${subject}.
Study materials: ${materials}

Format each question as a JSON object with the following structure:
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": index of correct option (0-3)
}

Return an array of these question objects.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert quiz generator. Generate challenging but fair questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate quiz questions");
  }
}
