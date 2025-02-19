export type Database = {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: number;
          subject: string;
          grade_level: string;
          materials: string;
          questions: {
            question: string;
            options: string[];
            correctAnswer: number;
            explanation: string;
          }[];
          score: number | null;
          created_at: string;
        };
        Insert: {
          subject: string;
          grade_level: string;
          materials: string;
          questions: {
            question: string;
            options: string[];
            correctAnswer: number;
            explanation: string;
          }[];
          score?: number;
        };
        Update: {
          score?: number;
        };
      };
    };
  };
}; 