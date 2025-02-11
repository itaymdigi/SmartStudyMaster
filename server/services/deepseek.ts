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
  explanation?: string;
}

export async function generateQuizQuestions(
  subject: string,
  gradeLevel: string,
  materials: string
): Promise<QuizQuestion[]> {
  const prompt = `Generate 5 challenging multiple-choice questions in Hebrew about ${subject} for ${gradeLevel} students.
Study materials: ${materials}

Create questions that:
1. Test deep understanding and critical thinking about the materials
2. Have exactly 4 answer options
3. Include one correct answer and three plausible but incorrect options
4. Use Hebrew for all text
5. Are at an appropriate difficulty level for ${gradeLevel}
6. Include a brief explanation for the correct answer

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
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is the correct answer"
    }
  ]
}

Important guidelines:
- Use Hebrew for all text including explanations
- Each question must have exactly 4 options
- The correctAnswer must be 0-3 (index of correct option)
- Generate exactly 5 questions
- Make questions progressively more challenging
- Ensure questions test different aspects of the material
- Add clear, concise explanations that help students learn`;

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
      const validQuestions = parsedContent.questions.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        typeof q.correctAnswer === 'number' && 
        q.correctAnswer >= 0 && 
        q.correctAnswer <= 3 &&
        typeof q.explanation === 'string'
      );

      if (validQuestions.length === 0) {
        throw new Error("No valid questions generated");
      }

      return validQuestions;
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Failed to parse quiz questions");
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    // Return default questions in Hebrew if the API fails
    return Array.from({ length: 5 }, (_, i) => ({
      question: `שאלה ${i + 1} בנושא ${subject}: ${materials.split(' ').slice(0, 3).join(' ')}...`,
      options: [
        `תשובה א' לשאלה ${i + 1}`,
        `תשובה ב' לשאלה ${i + 1}`,
        `תשובה ג' לשאלה ${i + 1}`,
        `תשובה ד' לשאלה ${i + 1}`
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `הסבר לתשובה הנכונה לשאלה ${i + 1}`
    }));
  }
}