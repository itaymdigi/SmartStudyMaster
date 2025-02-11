import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Quiz } from "@shared/schema";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function QuizPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
  });

  const mutation = useMutation({
    mutationFn: async (score: number) => {
      const res = await apiRequest("POST", `/api/quizzes/${id}/score`, { score });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
      setLocation(`/results/${id}`);
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהגשת המבחן. אנא נסה שוב.",
        variant: "destructive",
      });
      console.error("Error submitting quiz:", error);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4263EB]" />
      </div>
    );
  }

  if (!quiz) {
    console.error("No quiz data found for id:", id);
    return null;
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = parseInt(value);
    setAnswers(newAnswers);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate score
      const correctAnswers = answers.reduce((acc, answer, index) => {
        return acc + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
      }, 0);
      const score = Math.round((correctAnswers / quiz.questions.length) * 100);

      try {
        mutation.mutate(score);
      } catch (error) {
        console.error("Error calculating score:", error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בחישוב הציון. אנא נסה שוב.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <Progress value={progress} className="h-2" />

        <div className="flex justify-between text-sm text-gray-500">
          <span>{quiz.subject} - {quiz.gradeLevel}</span>
          <span>שאלה {currentQuestion + 1} מתוך {quiz.questions.length}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <RadioGroup
              value={answers[currentQuestion]?.toString()}
              onValueChange={handleAnswer}
              className="space-y-4"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <div className="flex items-center">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className={`mr-2 cursor-pointer select-none ${
                        showFeedback
                          ? index === question.correctAnswer
                            ? "text-green-600 font-medium"
                            : answers[currentQuestion] === index
                            ? "text-red-600"
                            : ""
                          : ""
                      }`}
                    >
                      {option}
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>

            {showFeedback && answers[currentQuestion] !== question.correctAnswer && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                <p className="font-medium">תשובה לא נכונה</p>
                <p className="text-sm mt-1">
                  התשובה הנכונה היא: {question.options[question.correctAnswer]}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setShowFeedback(false);
              setCurrentQuestion(prev => prev - 1);
            }}
            disabled={currentQuestion === 0}
          >
            <ChevronRight className="w-4 h-4 ml-1" /> הקודם
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            התחל מחדש
          </Button>

          <Button
            onClick={handleNext}
            disabled={answers[currentQuestion] === undefined || mutation.isPending}
            className="bg-[#4263EB] hover:bg-[#4263EB]/90"
          >
            {currentQuestion === quiz.questions.length - 1 ? (
              mutation.isPending ? "שולח..." : "סיים מבחן"
            ) : (
              <>הבא <ChevronLeft className="w-4 h-4 mr-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}