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
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";

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

  const correctAnswers = answers.reduce((acc, answer, index) => {
    return acc + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
  }, 0);

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

  const handleStartOver = async () => {
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{quiz.subject} - {quiz.gradeLevel}</span>
            <div className="flex items-center gap-2">
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {correctAnswers}
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {currentQuestion + 1 - correctAnswers}
              </span>
              <span className="text-gray-500">
                שאלה {currentQuestion + 1} מתוך {quiz.questions.length}
              </span>
            </div>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl font-medium leading-normal">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <RadioGroup
              value={answers[currentQuestion]?.toString()}
              onValueChange={handleAnswer}
              className="space-y-4"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <div className="flex items-center w-full">
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                      className="ml-2"
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className={`flex-1 py-2 px-3 rounded-md cursor-pointer select-none transition-colors ${
                        showFeedback
                          ? index === question.correctAnswer
                            ? "bg-green-50 text-green-700 font-medium"
                            : answers[currentQuestion] === index
                            ? "bg-red-50 text-red-700"
                            : "hover:bg-gray-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>

            {showFeedback && (
              <div className={`mt-4 p-4 rounded-md ${
                answers[currentQuestion] === question.correctAnswer
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}>
                <p className="font-medium">
                  {answers[currentQuestion] === question.correctAnswer
                    ? "תשובה נכונה!"
                    : "תשובה לא נכונה"}
                </p>
                {question.explanation && (
                  <p className="mt-2 text-sm">
                    {question.explanation}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => {
              setShowFeedback(false);
              setCurrentQuestion(prev => prev - 1);
            }}
            disabled={currentQuestion === 0}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            הקודם
          </Button>

          <Button
            variant="outline"
            onClick={handleStartOver}
          >
            התחל מחדש
          </Button>

          <Button
            onClick={handleNext}
            disabled={answers[currentQuestion] === undefined || mutation.isPending}
            className="bg-[#4263EB] hover:bg-[#4263EB]/90 gap-2"
          >
            {currentQuestion === quiz.questions.length - 1 ? (
              mutation.isPending ? "שולח..." : "סיים מבחן"
            ) : (
              <>
                הבא
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}