import { useState, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, Layout, LibrarySquare, RotateCcw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import confetti from 'canvas-confetti';

export default function QuizPage() {
  // All hooks at the top
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentSelection, setCurrentSelection] = useState<string | undefined>();
  const [showFeedback, setShowFeedback] = useState(false);
  const [displayMode, setDisplayMode] = useState<"standard" | "flashcard">("standard");
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState<number[]>([]);
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
      const wrongAnswers = answers.reduce((acc, answer, index) => {
        if (answer !== quiz?.questions[index].correctAnswer) {
          acc.push(index);
        }
        return acc;
      }, [] as number[]);
      setIncorrectQuestions(wrongAnswers);
      setShowFinalScore(true);
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showFinalScore && score >= 85) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      }

      interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { y: 0.6 },
          colors: ['#4263EB', '#34C759', '#FFD60A']
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [showFinalScore]);

  // Handle loading state
  if (isLoading || !quiz) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4263EB]" />
      </div>
    );
  }

  // Derived state calculations
  const isEnglishQuiz = quiz.subject === "אנגלית";
  const correctAnswers = answers.reduce((acc, answer, index) => {
    return acc + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
  }, 0);
  const score = Math.round((correctAnswers / quiz.questions.length) * 100);
  const question = reviewMode
    ? quiz.questions[incorrectQuestions[currentQuestion]]
    : quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / (reviewMode ? incorrectQuestions.length : quiz.questions.length)) * 100;

  const handleAnswer = (value: string) => {
    setCurrentSelection(value);
    const newAnswers = [...answers];
    if (reviewMode) {
      newAnswers[incorrectQuestions[currentQuestion]] = parseInt(value);
    } else {
      newAnswers[currentQuestion] = parseInt(value);
    }
    setAnswers(newAnswers);
    setShowFeedback(true);
  };

  const startReviewMode = () => {
    setReviewMode(true);
    setCurrentQuestion(0);
    setShowFeedback(false);
    setCurrentSelection(undefined);
    setShowFinalScore(false);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setCurrentSelection(undefined);
    if (reviewMode) {
      if (currentQuestion < incorrectQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        setShowFinalScore(true);
        setReviewMode(false);
      }
    } else {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        try {
          mutation.mutate(score);
        } catch (error) {
          console.error("Error calculating score:", error);
          toast({
            title: isEnglishQuiz ? "Error" : "שגיאה",
            description: isEnglishQuiz
              ? "An error occurred while calculating the score. Please try again."
              : "אירעה שגיאה בחישוב הציון. אנא נסה שוב.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handlePrevious = () => {
    setShowFeedback(false);
    setCurrentSelection(undefined);
    setCurrentQuestion(prev => prev - 1);
  };

  const renderQuestionContent = () => {
    if (showFinalScore) {
      return (
        <Card className="border-2 min-h-[300px] flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="text-2xl font-medium leading-normal text-center">
              {isEnglishQuiz ? "Quiz Complete!" : "המבחן הסתיים!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-center">
            <div className="text-4xl font-bold text-[#4263EB] mb-4">{score}%</div>
            <p className="text-lg mb-4">
              {isEnglishQuiz
                ? `You got ${correctAnswers} out of ${quiz.questions.length} questions correct`
                : `ענית נכון על ${correctAnswers} מתוך ${quiz.questions.length} שאלות`}
            </p>
            {incorrectQuestions.length > 0 && (
              <Button
                onClick={startReviewMode}
                variant="outline"
                className="mb-4 w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {isEnglishQuiz
                  ? `Review ${incorrectQuestions.length} Incorrect Questions`
                  : `חזור על ${incorrectQuestions.length} שאלות שגויות`}
              </Button>
            )}
            <Button
              onClick={() => {
                const searchParams = new URLSearchParams({
                  subject: quiz.subject,
                  gradeLevel: quiz.gradeLevel,
                  materials: quiz.materials
                }).toString();
                setLocation(`/?${searchParams}`);
              }}
              className="bg-[#4263EB] hover:bg-[#4263EB]/90 w-full"
            >
              {isEnglishQuiz ? "Start New Quiz" : "התחל מבחן חדש"}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl font-medium leading-normal">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <RadioGroup
            value={currentSelection}
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
                          : answers[reviewMode ? incorrectQuestions[currentQuestion] : currentQuestion] === index
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
              answers[reviewMode ? incorrectQuestions[currentQuestion] : currentQuestion] === question.correctAnswer
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              <p className="font-medium">
                {answers[reviewMode ? incorrectQuestions[currentQuestion] : currentQuestion] === question.correctAnswer
                  ? (isEnglishQuiz ? "Correct!" : "תשובה נכונה!")
                  : (isEnglishQuiz ? "Incorrect" : "תשובה לא נכונה")}
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
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-4">
            <ToggleGroup type="single" value={displayMode} onValueChange={(value) => value && setDisplayMode(value as "standard" | "flashcard")}>
              <ToggleGroupItem value="standard" aria-label="Standard View">
                <Layout className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="flashcard" aria-label="Flashcard View">
                <LibrarySquare className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <span className="text-gray-500">
              {reviewMode && (
                <span className="text-blue-600 mr-2">
                  {isEnglishQuiz ? "Review Mode" : "מצב חזרה"}
                </span>
              )}
              {quiz.subject} - {quiz.gradeLevel}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {correctAnswers}
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {reviewMode ? incorrectQuestions.length : currentQuestion + 1 - correctAnswers}
              </span>
            </div>
            <span className="text-gray-500">
              {isEnglishQuiz
                ? `Question ${currentQuestion + 1} of ${reviewMode ? incorrectQuestions.length : quiz.questions.length}`
                : `שאלה ${currentQuestion + 1} מתוך ${reviewMode ? incorrectQuestions.length : quiz.questions.length}`}
            </span>
          </div>
        </div>

        {renderQuestionContent()}

        {!showFinalScore && (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              {isEnglishQuiz ? "Previous" : "הקודם"}
            </Button>

            <Button
              onClick={handleNext}
              disabled={displayMode === "standard" && (currentSelection === undefined || mutation.isPending)}
              className="bg-[#4263EB] hover:bg-[#4263EB]/90 gap-2"
            >
              {currentQuestion === (reviewMode ? incorrectQuestions.length - 1 : quiz.questions.length - 1) ? (
                mutation.isPending
                  ? (isEnglishQuiz ? "Submitting..." : "שולח...")
                  : (isEnglishQuiz ? "Finish Quiz" : "סיים מבחן")
              ) : (
                <>
                  {isEnglishQuiz ? "Next" : "הבא"}
                  <ChevronLeft className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}