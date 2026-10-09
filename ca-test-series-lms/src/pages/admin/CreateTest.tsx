import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Save, ArrowLeft, Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MCQQuestion } from "@/hooks/use-test-series";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import MCQCreator from "@/components/admin/MCQCreator";
import { evaluatorsApi } from "@/lib/api/evaluators";
import type { EvaluatorListItem } from "@/lib/api/evaluators";

interface TestForm {
  id?: string;
  title: string;
  type: "OBJECTIVE" | "SUBJECTIVE" | "";
  subject: string;
  duration: number;
  instructions?: string;
  passingPercentage?: number;
  totalMarks?: number;
  allowedEvaluatorIds?: string[];
  mcqQuestions: MCQQuestion[];
  subjectiveQuestionPaper?: File;
  suggestedAnswer?: File;
}

const subjectsByLevel = {
  FOUNDATION: [
    "Accounting",
    "Business Laws",
    "Quantitative Aptitude",
    "Business Economics",
    'Combo'
  ],
  INTERMEDIATE: [
    "Advanced Accounting",
    "Corporate and Other Laws",
    "Taxation",
    "Cost and Management Accounting",
    "Auditing and Ethics",
    "Financial Management and Strategic Management",
    'Combo'
  ],
  FINAL: [
    "Financial Reporting",
    "Advanced Financial Management",
    "Advanced Auditing, Assurance and Professional Ethics",
    "Direct Tax Laws and International Taxation",
    "Indirect Tax Laws",
    "Integrated Business Solution",
    "Corporate and Economic Laws",
    "Strategic Cost and Performance Management",
    'Combo'
  ],
  ALL: [
    // CA Foundation
    "Accounting",
    "Business Laws",
    "Quantitative Aptitude",
    "Business Economics",
    // CA Intermediate
    "Advanced Accounting",
    "Corporate and Other Laws",
    "Taxation",
    "Cost and Management Accounting",
    "Auditing and Ethics",
    "Financial Management and Strategic Management",
    // CA Final
    "Financial Reporting",
    "Advanced Financial Management",
    "Advanced Auditing, Assurance and Professional Ethics",
    "Direct Tax Laws and International Taxation",
    "Indirect Tax Laws",
    "Integrated Business Solution",
    "Corporate and Economic Laws",
    "Strategic Cost and Performance Management",
    'Combo'
  ],
};

const CreateTest = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get data from navigation state or URL params
  const caLevel = searchParams.get("caLevel") || location.state?.caLevel || "";
  const isEditing =
    searchParams.get("edit") === "true" || location.state?.isEditing;
  const existingTest = location.state?.test;
  const formState = location.state?.formState;

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"OBJECTIVE" | "SUBJECTIVE" | "">("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("60");
  const [instructions, setInstructions] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [passingPercentage, setPassingPercentage] = useState("40");
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [subjectiveQuestionPaper, setSubjectiveQuestionPaper] =
    useState<File | null>(null);
  const [suggestedAnswer, setSuggestedAnswer] = useState<File | null>(null);
  const [availableEvaluators, setAvailableEvaluators] = useState<
    EvaluatorListItem[]
  >([]);
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>(
    []
  );
  const [isLoadingEvaluators, setIsLoadingEvaluators] = useState(false);

  // Loading state to prevent double submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form if editing or restoring form state
  useEffect(() => {
    if (isEditing && existingTest) {
      setTitle(existingTest.title);
      setType(existingTest.type);
      setSubject(existingTest.subject);
      setDuration(existingTest.duration.toString());
      setInstructions(existingTest.instructions || "");
      setTotalMarks(existingTest.totalMarks?.toString() || "");
      setPassingPercentage(existingTest.passingPercentage?.toString() || "40");
      setMcqQuestions(existingTest.mcqQuestions || []);
      setSubjectiveQuestionPaper(existingTest.subjectiveQuestionPaper || null);
      setSuggestedAnswer(existingTest.suggestedAnswer || null);
      setSelectedEvaluatorIds(existingTest.allowedEvaluatorIds || []);
    }
    // Note: formState is NOT used to prefill the form for a new test
    // It's only passed to preserve the test series data when navigating back
  }, [isEditing, existingTest]);

  useEffect(() => {
    let isMounted = true;

    const loadEvaluators = async () => {
      setIsLoadingEvaluators(true);
      try {
        const evaluators = await evaluatorsApi.list({ active: true });
        if (isMounted) {
          setAvailableEvaluators(evaluators);
        }
      } catch (error) {
        console.error("Failed to load evaluators", error);
        if (isMounted) {
          toast({
            title: "Evaluator list unavailable",
            description:
              "Tests can still be saved, but evaluator login assignment could not be loaded right now.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingEvaluators(false);
        }
      }
    };

    loadEvaluators();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const toggleEvaluatorSelection = (evaluatorId: string, checked: boolean) => {
    setSelectedEvaluatorIds((prev) => {
      if (checked) {
        return prev.includes(evaluatorId) ? prev : [...prev, evaluatorId];
      }

      return prev.filter((id) => id !== evaluatorId);
    });
  };

  const eligibleEvaluators = [...availableEvaluators].sort((left, right) => {
    if (!subject) return 0;

    const leftMatches = left.specializations?.includes(subject) ? 1 : 0;
    const rightMatches = right.specializations?.includes(subject) ? 1 : 0;

    return rightMatches - leftMatches;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    if (!title || !type || !subject || !duration) {
      toast({
        title: "Error",
        description: "Test title, type, subject, and duration are required.",
        variant: "destructive",
      });
      return;
    }

    // Validate total marks for subjective tests
    if (type === "SUBJECTIVE") {
      if (!totalMarks || parseInt(totalMarks) <= 0) {
        toast({
          title: "Error",
          description:
            "Total marks are required for subjective tests and must be greater than 0.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate MCQ questions for objective tests
    if (type === "OBJECTIVE" && mcqQuestions.length === 0) {
      toast({
        title: "Error",
        description:
          "Please add at least one MCQ question for objective tests.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const testData: TestForm = {
      id: existingTest?.id || Date.now().toString(),
      title,
      type,
      subject,
      duration: parseInt(duration),
      instructions,
      passingPercentage: parseInt(passingPercentage) || 40,
      totalMarks: type === "SUBJECTIVE" ? parseInt(totalMarks) : undefined,
      allowedEvaluatorIds:
        type === "SUBJECTIVE" ? selectedEvaluatorIds : undefined,
      mcqQuestions: type === "OBJECTIVE" ? mcqQuestions : [],
      subjectiveQuestionPaper:
        type === "SUBJECTIVE"
          ? subjectiveQuestionPaper || existingTest?.subjectiveQuestionPaper
          : undefined,
      suggestedAnswer:
        type === "SUBJECTIVE"
          ? suggestedAnswer || existingTest?.suggestedAnswer
          : undefined,
    };

    // Navigate back with the test data
    navigate("/admin/tests/create", {
      state: {
        savedTest: testData,
        isEditing: isEditing,
        formState: formState, // Pass back the original form state
      },
      replace: true, // Replace current history entry
    });

    toast({
      title: "Success",
      description: isEditing
        ? "Test updated successfully!"
        : "Test created successfully!",
    });

    // Reset submitting state after navigation
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    navigate("/admin/tests/create", {
      state: {
        formState: formState, // Pass back the original form state
      },
      replace: true, // Replace current history entry
    });
  };

  const calculateTotalMarks = () => {
    if (type === "OBJECTIVE" && mcqQuestions.length > 0) {
      return mcqQuestions.reduce((total, q) => total + (q.marks || 0), 0);
    }
    return type === "SUBJECTIVE" ? parseInt(totalMarks) || 0 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="admin" />
      <MobileSidebar
        role="admin"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">
                {isEditing ? "Edit Test" : "Create New Test"}
              </h1>
            </div>
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Test Series
            </Button>
          </div>
        </header>

        <main className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Chapter 1: Accounting Fundamentals - Objective"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Give each test a unique, descriptive title
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Test Type *</Label>
                  <RadioGroup
                    value={type}
                    onValueChange={(v) =>
                      setType(v as "OBJECTIVE" | "SUBJECTIVE")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="OBJECTIVE" id="objective" />
                      <Label htmlFor="objective">Objective (MCQ)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SUBJECTIVE" id="subjective" />
                      <Label htmlFor="subjective">Subjective (Written)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select
                    onValueChange={(value) => {
                      setSubject(value);
                    }}
                    value={subject}
                  >
                    <SelectTrigger disabled={!caLevel}>
                      <SelectValue
                        placeholder={
                          caLevel ? "Select subject" : "CA level not specified"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {caLevel &&
                        subjectsByLevel[
                          caLevel as keyof typeof subjectsByLevel
                        ]?.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g. 180"
                      value={duration}
                      onChange={(e) =>
                        setDuration(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
                    <Input
                      id="passingPercentage"
                      type="number"
                      placeholder="e.g. 40"
                      value={passingPercentage}
                      onChange={(e) =>
                        setPassingPercentage(e.target.value)
                      }
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  {type === "SUBJECTIVE" && (
                    <div className="space-y-2">
                      <Label htmlFor="totalMarks">Total Marks *</Label>
                      <Input
                        id="totalMarks"
                        type="number"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        placeholder="e.g., 100"
                        min="1"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Total marks for this subjective test
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter test instructions for students..."
                    rows={3}
                  />
                </div>

                {type === "SUBJECTIVE" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>Evaluator Logins</Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Select one or more evaluator logins for this test. If
                          none are selected, any eligible evaluator can access
                          it.
                        </p>
                      </div>
                      {selectedEvaluatorIds.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvaluatorIds([])}
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-md border p-3 space-y-3">
                      {isLoadingEvaluators ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading evaluator logins...
                        </div>
                      ) : eligibleEvaluators.length > 0 ? (
                        eligibleEvaluators.map((evaluator) => (
                          <div
                            key={evaluator.id}
                            className="flex items-start space-x-3"
                          >
                            <Checkbox
                              id={`evaluator-${evaluator.id}`}
                              checked={selectedEvaluatorIds.includes(
                                evaluator.id
                              )}
                              onCheckedChange={(checked) =>
                                toggleEvaluatorSelection(
                                  evaluator.id,
                                  checked === true
                                )
                              }
                            />
                            <Label
                              htmlFor={`evaluator-${evaluator.id}`}
                              className="text-sm font-normal leading-5"
                            >
                              <span className="block font-medium text-gray-900">
                                {evaluator.fullName}
                              </span>
                              <span className="block text-gray-500">
                                {evaluator.email}
                              </span>
                              {evaluator.specializations?.length > 0 && (
                                <span className="block text-xs text-gray-500 mt-1">
                                  Subjects:{" "}
                                  {evaluator.specializations.join(", ")}
                                </span>
                              )}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No active evaluator logins are available for the
                          selected subject yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MCQ Questions Section */}
            {type === "OBJECTIVE" && (
              <Card>
                <CardHeader>
                  <CardTitle>MCQ Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <MCQCreator
                    questions={mcqQuestions}
                    setQuestions={setMcqQuestions}
                  />
                  {mcqQuestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Total Questions:</strong> {mcqQuestions.length}
                        <br />
                        <strong>Total Marks (Auto-calculated):</strong>{" "}
                        {calculateTotalMarks()} marks
                        <br />
                        <span className="text-xs">
                          Total marks are automatically calculated from MCQ
                          question marks.
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subjective Questions Section */}
            {type === "SUBJECTIVE" && (
              <Card>
                <CardHeader>
                  <CardTitle>Subjective Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="questionPdf">
                      Upload Question Paper (PDF)
                    </Label>
                    <Input
                      id="questionPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setSubjectiveQuestionPaper(
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                    />
                    {existingTest?.subjectiveQuestionPaper &&
                      !subjectiveQuestionPaper && (
                        <p className="text-xs text-green-600 mt-1">
                          Existing question paper will be preserved if no new
                          file is uploaded
                        </p>
                      )}
                  </div>
                  <div>
                    <Label htmlFor="answerPdf">
                      Upload Suggested Answer (PDF)
                    </Label>
                    <Input
                      id="answerPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setSuggestedAnswer(
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                    />
                    {existingTest?.suggestedAnswer && !suggestedAnswer && (
                      <p className="text-xs text-green-600 mt-1">
                        Existing suggested answer will be preserved if no new
                        file is uploaded
                      </p>
                    )}
                  </div>
                  {totalMarks && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        <strong>Total Marks:</strong> {totalMarks} marks
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Test"
                    : "Save Test"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateTest;
