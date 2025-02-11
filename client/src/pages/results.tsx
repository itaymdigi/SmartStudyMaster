import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import confetti from 'canvas-confetti';
import { Trophy, Home, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ResultsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: quiz } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
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

  const handleRetry = async () => {
    if (!quiz) return;

    try {
      // Create a new quiz with the same subject and grade level
      const res = await apiRequest("POST", "/api/quizzes", {
        subject: quiz.subject,
        gradeLevel: quiz.gradeLevel,
        materials: quiz.materials
      });
      const newQuiz = await res.json();
      setLocation(`/quiz/${newQuiz.id}`);
    } catch (error) {
      console.error("Error creating new quiz:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת מבחן חדש. אנא נסה שוב.",
        variant: "destructive",
      });
    }
  };

  if (!quiz?.completed) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {quiz.score >= 85 ? (
              <Trophy className="w-16 h-16 text-[#FCC419]" />
            ) : (
              <Trophy className="w-16 h-16 text-[#4263EB]" />
            )}
          </div>
          <CardTitle className="text-2xl">המבחן הושלם!</CardTitle>
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
              "כל הכבוד! שליטה מצוינת בחומר!"
            ) : quiz.score >= 70 ? (
              "עבודה טובה! המשך לתרגל כדי להשתפר."
            ) : (
              "המשך ללמוד! התרגול עושה את ההבדל."
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleRetry}
              className="bg-[#4263EB] hover:bg-[#4263EB]/90"
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              נסה שוב באותו נושא
            </Button>

            <Button
              onClick={() => setLocation("/")}
              variant="outline"
            >
              <Home className="w-4 h-4 ml-2" />
              חזור לדף הבית
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}