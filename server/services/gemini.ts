import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

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

The correctAnswer should be the index (0-3) of the correct option.
Generate challenging but fair questions based on the study materials provided.
Return a valid JSON object with an array of questions.`;

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const parsedContent = JSON.parse(text);
      if (!Array.isArray(parsedContent.questions)) {
        throw new Error("Invalid response format: questions array not found");
      }
      return parsedContent.questions;
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      console.error("Raw response:", text);
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
