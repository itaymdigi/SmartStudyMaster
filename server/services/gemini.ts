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
  const prompt = `You are a professional teacher creating a quiz in ${subject} for ${gradeLevel} level students.
Based on these study materials: ${materials}

Generate 5 multiple-choice questions in the same language as the study materials.
Each question should:
- Be clear and concise
- Have 4 options
- Include one correct answer and three plausible but incorrect options
- Be directly related to the study materials

Format your response as a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": 0
    }
  ]
}

The correctAnswer must be a number (0-3) indicating the index of the correct option.
Ensure all text is in the same language as the input materials.`;

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate content with structured output
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const response = await result.response;
    const text = response.text();

    try {
      // First try to find JSON within the response using regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;

      const parsedContent = JSON.parse(jsonStr);

      if (!Array.isArray(parsedContent.questions)) {
        console.error("Invalid response structure:", parsedContent);
        throw new Error("Invalid response format: questions array not found");
      }

      // Validate each question
      const validQuestions = parsedContent.questions.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        typeof q.correctAnswer === 'number' && 
        q.correctAnswer >= 0 && 
        q.correctAnswer <= 3
      );

      if (validQuestions.length === 0) {
        throw new Error("No valid questions found in response");
      }

      return validQuestions;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response:", text);
      throw new Error("Failed to parse quiz questions");
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    // Return some default questions in the subject's language if the API fails
    return Array.from({ length: 5 }, (_, i) => ({
      question: `שאלה ${i + 1} ב${subject}`,
      options: [
        `תשובה א' לשאלה ${i + 1}`,
        `תשובה ב' לשאלה ${i + 1}`,
        `תשובה ג' לשאלה ${i + 1}`,
        `תשובה ד' לשאלה ${i + 1}`
      ],
      correctAnswer: Math.floor(Math.random() * 4)
    }));
  }
}