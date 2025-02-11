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
  "questions": [
    {
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": 0
    }
  ]
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    try {
      const parsedContent = JSON.parse(content);
      if (!Array.isArray(parsedContent.questions)) {
        throw new Error("Invalid response format: questions array not found");
      }
      return parsedContent.questions;
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Failed to parse quiz questions");
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    // Return some default questions if the API fails
    return Array.from({ length: 5 }, (_, i) => ({
      question: `Sample question ${i + 1} about ${subject}?`,
      options: [
        `Option A for question ${i + 1}`,
        `Option B for question ${i + 1}`,
        `Option C for question ${i + 1}`,
        `Option D for question ${i + 1}`
      ],
      correctAnswer: Math.floor(Math.random() * 4)
    }));
  }
}