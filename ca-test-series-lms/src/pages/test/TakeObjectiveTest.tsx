import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { studentsApi } from "@/lib/api/students";
import { useToast } from "@/hooks/use-toast";
import { Clock, Flag, X, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MathText from "@/components/shared/MathText";

type Question = {
  index: number;
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  marks: number;
  negativeMarks?: number;
};

export default function TakeObjectiveTest() {
  const { id: testId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const seriesId = new URLSearchParams(location.search).get("series") || "";

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [subject, setSubject] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const submittedRef = useRef(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [current, setCurrent] = useState<number>(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [showExitDialog, setShowExitDialog] = useState(false);

  const storageKey = useMemo(
    () => (seriesId && testId ? `obj:${seriesId}:${testId}` : ""),
    [seriesId, testId]
  );

  useEffect(() => {
    const load = async () => {
      if (!seriesId || !testId) return;
      try {
        // First check if test is already submitted
        const statusRes = await studentsApi.statuses(seriesId);
        const testStatus = statusRes.statuses.find((s: { testId: string; status: string }) => s.testId === testId);

        if (testStatus && (testStatus.status === 'submitted' || testStatus.status === 'completed')) {
          toast({
            title: "Test Already Submitted",
            description: "You have already completed this test.",
            variant: "destructive"
          });
          navigate(`/student/history`);
          return;
        }

        const res = await studentsApi.getTestDetail(seriesId, testId);
        const { test } = res;
        if (test.testType !== "OBJECTIVE") {
          navigate(`/student/test-series/${seriesId}`);
          return;
        }

        setTitle(test.title);
        setDuration(test.duration);
        setSubject(test.subject || "");
        setQuestions(test.mcqQuestions || []);

        // Clear any previous cached state for this test when starting fresh
        if (storageKey) {
          window.localStorage.removeItem(storageKey);
        }

        // Reset all state to initial values
        setAnswers({});
        setMarked(new Set());
        setVisited(new Set());
        setCurrent(0);

        if (test.duration && test.duration > 0) {
          setRemainingSec(test.duration * 60);
        } else {
          setRemainingSec(null);
        }

      } catch (e) {
        toast({ title: "Unable to start test", variant: "destructive" });
      }
    };
    load();
  }, [seriesId, testId, navigate, toast, storageKey]);

  // Countdown timer effect
  useEffect(() => {
    if (remainingSec === null || submittedRef.current) return;
    if (remainingSec <= 0) {
      // Auto submit once
      (async () => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setIsTestSubmitted(true);
        try {
          const payload = questions.map((q) => ({
            questionIndex: q.index,
            answer: answers[q.index],
          }));
          const result = await studentsApi.submitObjective(
            seriesId,
            testId!,
            payload
          );
          toast({
            title: "Time's up!",
            description: `Your answers were submitted. Score: ${result.score}/${result.totalMarks}`,
          });
          // Clear cached progress
          if (storageKey) window.localStorage.removeItem(storageKey);
          // Prevent going back after submission
          window.history.pushState(null, "", window.location.href);
          window.history.pushState(null, "", window.location.href);
          // Navigate to analysis page (uses submissionId as :id param)
          navigate(`/test/${result.submissionId}/analysis`, { replace: true });
        } catch {
          toast({ title: "Auto-submission failed", variant: "destructive" });
        }
      })();
      return;
    }
    const id = window.setInterval(() => {
      setRemainingSec((s) => (s === null ? s : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [remainingSec, answers, questions, seriesId, testId, navigate, toast, storageKey]);

  // Persist progress
  useEffect(() => {
    if (!storageKey) return;
    try {
      const payload = {
        answers,
        marked: Array.from(marked),
        visited: Array.from(visited),
        remainingSec,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      // ignore persistence errors
      void err;
    }
  }, [answers, marked, visited, remainingSec, storageKey]);

  // Block accidental navigation (back/refresh/close)
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    // Ensure a history entry so back triggers popstate
    const pushSentinel = () => {
      try {
        window.history.pushState(null, "", window.location.href);
      } catch (err) {
        // ignore
        void err;
      }
    };
    pushSentinel();

    const onPopState = () => {
      // If test is submitted, prevent going back
      if (isTestSubmitted || submittedRef.current) {
        pushSentinel();
        return;
      }

      // Immediately negate the back and ask user
      pushSentinel();
      setShowExitDialog(true);
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [answers, questions, navigate, seriesId, testId, storageKey, isTestSubmitted]);

  // Allow partial submission; we don't force all answered.

  const handleSubmit = async () => {
    if (!seriesId || !testId) return;
    setSubmitting(true);
    setIsTestSubmitted(true);
    try {
      const payload = questions.map((q) => ({
        questionIndex: q.index,
        answer: answers[q.index],
      }));
      const result = await studentsApi.submitObjective(
        seriesId,
        testId,
        payload
      );
      toast({
        title: "Test Submitted Successfully!",
        description: `Score: ${result.score}/${result.totalMarks} - Instantly evaluated!`,
      });
      if (storageKey) window.localStorage.removeItem(storageKey);
      // Prevent going back after submission
      window.history.pushState(null, "", window.location.href);
      window.history.pushState(null, "", window.location.href);
      // Navigate to analysis page to show results immediately (submissionId param)
      navigate(`/test/${result.submissionId}/analysis`, { replace: true });
    } catch (e) {
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec: number) => {
    const s = Math.max(0, sec);
    const hh = Math.floor(s / 3600)
      .toString()
      .padStart(2, "0");
    const mm = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const onBackClick = () => {
    if (isTestSubmitted || submittedRef.current) {
      toast({
        title: "Test Already Submitted",
        description: "You cannot exit after submitting the test.",
        variant: "destructive"
      });
      return;
    }

    setShowExitDialog(true);
  };

  const handleExitConfirm = async () => {
    setShowExitDialog(false);
    // Submit then exit to history page
    if (!submittedRef.current) {
      submittedRef.current = true;
      setIsTestSubmitted(true);
      try {
        const payload = questions.map((q) => ({
          questionIndex: q.index,
          answer: answers[q.index],
        }));
        const result = await studentsApi.submitObjective(seriesId, testId!, payload);
        toast({
          title: "Test Submitted Successfully!",
          description: `Your test has been submitted. Score: ${result.score}/${result.totalMarks}`,
        });
        if (storageKey) window.localStorage.removeItem(storageKey);
        // Prevent going back after submission
        window.history.pushState(null, "", window.location.href);
        // Navigate to analysis page (uses submissionId)
        navigate(`/test/${result.submissionId}/analysis`, {
          replace: true,
        });
      } catch (error) {
        toast({
          title: "Submission Failed",
          description: "Failed to submit your test. Redirecting to history.",
          variant: "destructive"
        });
        navigate("/student/history", { replace: true });
      }
    } else {
      navigate("/student/history", { replace: true });
    }
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
  };

  const currentQuestion = questions[current];
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[Number(k)]).length,
    [answers]
  );

  const paletteBtnClass = (idx: number) => {
    const isCurrent = current === idx;
    const isAnswered = Boolean(answers[idx]);
    const isMarked = marked.has(idx);
    const isVisited = visited.has(idx);
    if (isCurrent) return "border-2 border-ca-primary bg-white text-ca-primary";
    if (isMarked) return "bg-purple-600 text-white hover:bg-purple-600/90";
    if (isAnswered) return "bg-emerald-600 text-white hover:bg-emerald-600/90";
    if (isVisited) return "bg-amber-500 text-white hover:bg-amber-500/90";
    return "bg-gray-200 text-gray-700 hover:bg-gray-300";
  };

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setVisited((v) => new Set(v).add(idx));
    setCurrent(idx);
  };

  const markToggle = (idx: number) => {
    setMarked((m) => {
      const n = new Set(m);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  const clearResponse = (idx: number) => {
    setAnswers((prev) => {
      const n = { ...prev };
      delete n[idx];
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Exam Bar */}
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-semibold leading-5">
              {title || "Objective Test"}
            </span>
            <span className="text-xs text-muted-foreground">{subject}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-md bg-gray-100 text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {remainingSec !== null ? (
                <span className="tabular-nums">
                  Time Left: {formatTime(remainingSec)}
                </span>
              ) : duration ? (
                <span>Duration: {duration} min</span>
              ) : (
                <span>No time limit</span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={onBackClick}
              disabled={isTestSubmitted || submittedRef.current}
            >
              Exit
            </Button>
            <Button
              disabled={submitting || isTestSubmitted}
              onClick={handleSubmit}
              className="bg-ca-primary hover:bg-ca-primary/90"
            >
              {isTestSubmitted ? "Submitted" : "Submit"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Exam Layout */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 xl:grid-cols-[320px_1fr_320px] gap-4">
        {/* Left Palette */}
        <aside className="xl:col-start-1 xl:col-end-2 border rounded-lg p-4 h-max sticky top-20">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Questions</div>
            <div className="text-xs text-muted-foreground">
              {answeredCount}/{questions.length} answered
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.index}
                className={`h-9 rounded-md text-xs font-semibold ${paletteBtnClass(
                  idx
                )} ${isTestSubmitted ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => !isTestSubmitted && goTo(idx)}
                disabled={isTestSubmitted}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-emerald-600 inline-block" />{" "}
              Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-amber-500 inline-block" />{" "}
              Not Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-purple-600 inline-block" />{" "}
              Marked
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-gray-300 inline-block" />{" "}
              Not Visited
            </div>
          </div>
        </aside>

        {/* Question Panel */}
        <section className="xl:col-start-2 xl:col-end-3 border rounded-lg p-5 bg-white shadow-sm">
          {currentQuestion ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Question {current + 1} of {questions.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markToggle(current)}
                    disabled={isTestSubmitted}
                  >
                    <Flag className="h-4 w-4 mr-1" />{" "}
                    {marked.has(current) ? "Unmark" : "Mark for review"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearResponse(current)}
                    disabled={isTestSubmitted}
                  >
                    <X className="h-4 w-4 mr-1" /> Clear Response
                  </Button>
                </div>
              </div>

              <div className="text-base sm:text-lg font-medium leading-relaxed mb-2">
                <MathText text={currentQuestion.questionText} />
              </div>
              <div className="flex gap-3 mb-4 text-xs">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                  +{currentQuestion.marks} marks
                </span>
                {(currentQuestion.negativeMarks ?? 0) > 0 && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                    -{currentQuestion.negativeMarks} marks (wrong)
                  </span>
                )}
              </div>
              <RadioGroup
                value={answers[current] ?? ""}
                onValueChange={(v: "A" | "B" | "C" | "D") => {
                  if (isTestSubmitted) return;
                  setAnswers((prev) => ({ ...prev, [current]: v }));
                  setVisited((vst) => new Set(vst).add(current));
                }}
                disabled={isTestSubmitted}
              >
                {(["A", "B", "C", "D"] as const).map((opt) => (
                  <label
                    key={opt}
                    htmlFor={`q${current}-${opt}`}
                    className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer mb-2"
                  >
                    <RadioGroupItem id={`q${current}-${opt}`} value={opt} />
                    <div className="font-medium">
                      {opt}. <MathText text={currentQuestion.options[opt]} />
                    </div>
                  </label>
                ))}
              </RadioGroup>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => goTo(current - 1)}
                  disabled={current === 0 || isTestSubmitted}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => markToggle(current)}
                    disabled={isTestSubmitted}
                  >
                    <Flag className="h-4 w-4 mr-1" />{" "}
                    {marked.has(current) ? "Unmark" : "Mark"}
                  </Button>
                  {current < questions.length - 1 ? (
                    <Button
                      onClick={() => goTo(current + 1)}
                      disabled={isTestSubmitted}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || isTestSubmitted}
                      className="bg-ca-primary hover:bg-ca-primary/90"
                    >
                      {isTestSubmitted ? "Test Submitted" : "Submit Test"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Loading questions…
            </div>
          )}
        </section>

        {/* Right Info Panel */}
        <aside className="hidden xl:block xl:col-start-3 xl:col-end-4 border rounded-lg p-5 h-max sticky top-20 bg-white shadow-sm">
          <div className="text-sm font-semibold mb-2">Test Info</div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              Title: <span className="text-foreground">{title || "-"}</span>
            </div>
            <div>
              Subject: <span className="text-foreground">{subject || "-"}</span>
            </div>
            <div>
              Total Questions:{" "}
              <span className="text-foreground">{questions.length}</span>
            </div>
            <div>
              Answered: <span className="text-foreground">{answeredCount}</span>
            </div>
            <div>
              Marked for Review:{" "}
              <span className="text-foreground">{marked.size}</span>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting || isTestSubmitted}
              className="w-full bg-ca-primary hover:bg-ca-primary/90"
            >
              {isTestSubmitted ? "Test Submitted" : "Submit Test"}
            </Button>
          </div>
        </aside>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-left">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <span className="truncate">Exit Test Confirmation</span>
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed">
              <div className="space-y-2">
                <p className="break-words">
                  You are currently taking a test. If you exit now, your test will be automatically
                  submitted with your current answers.
                </p>
                <p className="font-semibold text-amber-700">
                  This action cannot be undone.
                </p>
                <p className="break-words">
                  Are you sure you want to submit and exit the test?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleExitCancel}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Continue Test
            </Button>
            <Button
              onClick={handleExitConfirm}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 order-1 sm:order-2"
            >
              Submit & Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
