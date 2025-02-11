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
  const prompt = `Generate 5 multiple-choice questions in Hebrew about ${subject} for ${gradeLevel} students.
Study materials: ${materials}

Create questions that:
1. Test understanding of the materials
2. Have exactly 4 answer options
3. Include one correct answer and three plausible but incorrect options
4. Use Hebrew for all text

Format response as a strict JSON object:
{
  "questions": [
    {
      "question": "Question text here",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correctAnswer": 0
    }
  ]
}

Important:
- Use Hebrew for all text
- The correctAnswer must be 0-3 (index of correct option)
- Generate exactly 5 questions`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent({
      contents: [{
        text: prompt
      }]
    });

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      throw new Error("Invalid response format");
    }

    const parsedContent = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsedContent.questions)) {
      throw new Error("Invalid response format: questions array not found");
    }

    return parsedContent.questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    // Return descriptive default questions in Hebrew
    const topics = materials.split(' ').slice(0, 3).join(' ');
    return Array.from({ length: 5 }, (_, i) => ({
      question: `שאלה ${i + 1}: ${topics}...`,
      options: [
        `אפשרות א': תשובה אפשרית לשאלה ${i + 1}`,
        `אפשרות ב': תשובה אפשרית לשאלה ${i + 1}`,
        `אפשרות ג': תשובה אפשרית לשאלה ${i + 1}`,
        `אפשרות ד': תשובה אפשרית לשאלה ${i + 1}`
      ],
      correctAnswer: Math.floor(Math.random() * 4)
    }));
  }
}