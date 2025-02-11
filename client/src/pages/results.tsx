import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import confetti from 'canvas-confetti';
import { Trophy, Home } from "lucide-react";

export default function ResultsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: quiz } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", id],
  });

  useEffect(() => {
    if (quiz?.score && quiz.score >= 85) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [quiz?.score]);

  if (!quiz?.completed) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {quiz.score >= 85 ? (
              <Trophy className="w-16 h-16 text-[#FCC419]" />
            ) : (
              <Trophy className="w-16 h-16 text-[#4263EB]" />
            )}
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>
            {quiz.subject} - {quiz.gradeLevel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-4xl font-bold">
            {quiz.score}%
          </div>
          
          <div className="text-gray-600">
            {quiz.score >= 85 ? (
              "Excellent work! You've mastered this subject!"
            ) : quiz.score >= 70 ? (
              "Good job! Keep practicing to improve your score."
            ) : (
              "Keep studying! Practice makes perfect."
            )}
          </div>

          <Button
            onClick={() => setLocation("/")}
            className="bg-[#4263EB] hover:bg-[#4263EB]/90"
          >
            <Home className="w-4 h-4 mr-2" />
            Try Another Quiz
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
