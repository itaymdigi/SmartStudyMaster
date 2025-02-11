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
  const prompt = `You are a professional teacher creating a quiz about "${subject}" for ${gradeLevel} students.
Based on these study materials: "${materials}"

Create 5 multiple-choice questions that:
1. Test understanding of the materials
2. Are written in the same language as the study materials
3. Have exactly 4 answer options each
4. Include clear explanations

Format the response as a strict JSON object:
{
  "questions": [
    {
      "question": "Question text here?",
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
- Keep all text in the same language as the input
- The correctAnswer must be 0-3 (index of correct option)
- Generate exactly 5 questions
- Questions must directly relate to the study materials`;

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    // Generate content
    const result = await model.generateContent([
      {
        role: "user",
        parts: [{
          text: prompt
        }]
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle potential text wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      throw new Error("Invalid response format");
    }

    const parsedContent = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsedContent.questions)) {
      console.error("Invalid response structure:", parsedContent);
      throw new Error("Invalid response format: questions array not found");
    }

    // Validate each question
    const validQuestions = parsedContent.questions.filter((q: any) => 
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
  } catch (error) {
    console.error("Error generating questions:", error);
    // Return default questions in Hebrew if the API fails
    return Array.from({ length: 5 }, (_, i) => ({
      question: `שאלה לדוגמה ${i + 1} ב${subject}: ${materials.split(' ').slice(0, 3).join(' ')}...`,
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