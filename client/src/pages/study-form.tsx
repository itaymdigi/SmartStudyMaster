import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudyForm, studyFormSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function StudyFormPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);

  const form = useForm<StudyForm>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: {
      subject: params.get("subject") || "",
      gradeLevel: params.get("gradeLevel") || "",
      materials: params.get("materials") || ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: StudyForm) => {
      const res = await apiRequest("POST", "/api/quizzes", data);
      const json = await res.json();
      if (!json.id) {
        throw new Error("Invalid response from server");
      }
      return json;
    },
    onSuccess: (data) => {
      if (data.id) {
        setLocation(`/quiz/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Error creating quiz:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת המבחן. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  });

  // Simulate progress while generating questions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mutation.isPending) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [mutation.isPending]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#4263EB]" />
            <CardTitle>Prepare for Your Exam</CardTitle>
          </div>
          <CardDescription>
            Enter your study details to generate a personalized practice test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mathematics, History" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 9th Grade, College" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Materials</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the topics or materials you want to be tested on..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mutation.isPending && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-gray-500">
                    Preparing your personalized quiz... {progress}%
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#4263EB] hover:bg-[#4263EB]/90"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מכין מבחן...
                  </div>
                ) : (
                  "התחל מבחן"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}