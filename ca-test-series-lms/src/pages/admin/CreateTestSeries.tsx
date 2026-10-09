import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Save, ArrowLeft, Menu, Plus, Trash2, Edit, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTestSeriesManagement, MCQQuestion } from "@/hooks/use-test-series";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";

interface TestForm {
  id: string;
  title: string;
  type: "OBJECTIVE" | "SUBJECTIVE" | "";
  subject: string;
  duration: number;
  instructions?: string;
  passingPercentage?: number;
  totalMarks?: number; // For subjective tests
  allowedEvaluatorIds?: string[];
  mcqQuestions: MCQQuestion[];
  subjectiveQuestionPaper?: File;
  suggestedAnswer?: File;
}

const CreateTestSeries = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { createTestSeries, isLoading } = useTestSeriesManagement();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [caLevel, setCaLevel] = useState<
    "FOUNDATION" | "INTERMEDIATE" | "FINAL" | "ALL" | ""
  >("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [tests, setTests] = useState<TestForm[]>([]);
  // validity & attempts state
  const [validityType, setValidityType] = useState<"UNLIMITED" | "DATE">(
    "UNLIMITED"
  );
  const [validityDate, setValidityDate] = useState<Date | undefined>(undefined);
  const [attemptsType, setAttemptsType] = useState<"UNLIMITED" | "LIMITED">(
    "UNLIMITED"
  );
  const [attemptsCount, setAttemptsCount] = useState("");

  // Handle test data coming back from CreateTest page
  useEffect(() => {
    if (location.state?.savedTest || location.state?.formState) {
      const savedTest = location.state.savedTest;
      const isEditing = location.state.isEditing;
      const formState = location.state.formState;

      // Restore form state if it exists
      if (formState) {
        setTitle(formState.title || "");
        setDescription(formState.description || "");
        setOriginalPrice(formState.originalPrice || "");
        setDiscountedPrice(formState.discountedPrice || "");
        setThumbnail(formState.thumbnail || null);
        setCaLevel((prevLevel) => formState.caLevel || prevLevel);
        setValidityType(formState.validityType || "UNLIMITED");
        setValidityDate(formState.validityDate || undefined);
        setAttemptsType(formState.attemptsType || "UNLIMITED");
        setAttemptsCount(formState.attemptsCount || "");

        // Update tests state if there's a saved test
        if (savedTest) {
          if (isEditing) {
            setTests(
              formState.tests.map((test: TestForm) =>
                test.id === savedTest.id ? savedTest : test
              )
            );
          } else {
            setTests([...formState.tests, savedTest]);
          }
        } else {
          // Just restore tests if no saved test (cancel case)
          setTests(formState.tests || []);
        }
      } else if (savedTest) {
        // Fallback to old behavior if no form state but there's a saved test
        if (isEditing) {
          setTests((prevTests) =>
            prevTests.map((test: TestForm) =>
              test.id === savedTest.id ? savedTest : test
            )
          );
        } else {
          setTests((prevTests) => [...prevTests, savedTest]);
        }
      }

      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAddNewTest = () => {
    if (!caLevel) {
      toast({
        title: "Error",
        description: "Please select a CA level first before adding tests.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter the test series title first before adding tests.",
        variant: "destructive",
      });
      return;
    }

    navigate("/admin/create-test", {
      state: {
        caLevel,
        testSeriesTitle: title.trim(), // Pass the test series title
        // Pass current form state to preserve it
        formState: {
          title,
          description,
          originalPrice,
          discountedPrice,
          thumbnail,
          caLevel,
          validityType,
          validityDate,
          attemptsType,
          attemptsCount,
          tests,
        },
      },
    });
  };

  const handleEditTest = (test: TestForm) => {
    navigate("/admin/create-test", {
      state: {
        caLevel,
        testSeriesTitle: title.trim(), // Pass the test series title
        test,
        isEditing: true,
        // Pass current form state to preserve it
        formState: {
          title,
          description,
          originalPrice,
          discountedPrice,
          thumbnail,
          caLevel,
          validityType,
          validityDate,
          attemptsType,
          attemptsCount,
          tests,
        },
      },
    });
  };

  const removeTest = (id: string) => {
    setTests(tests.filter((t) => t.id !== id));
    toast({ title: "Success", description: "Test removed." });
  };

  const handleCaLevelChange = (level: string) => {
    setCaLevel(level as "FOUNDATION" | "INTERMEDIATE" | "FINAL" | "ALL");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required and cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (title.trim().length > 200) {
      toast({
        title: "Error",
        description: "Title must be 200 characters or less.",
        variant: "destructive",
      });
      return;
    }

    const originalPriceNumber = Number(originalPrice);
    const discountedPriceNumber = Number(discountedPrice);
    if (!originalPrice || isNaN(originalPriceNumber) || originalPriceNumber <= 0) {
      toast({
        title: "Error",
        description: "Original price must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    if (!discountedPrice || isNaN(discountedPriceNumber) || discountedPriceNumber <= 0) {
      toast({
        title: "Error",
        description: "Discounted price must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    if (discountedPriceNumber > originalPriceNumber) {
      toast({
        title: "Error",
        description: "Discounted price cannot be greater than original price.",
        variant: "destructive",
      });
      return;
    }

    if (!caLevel) {
      toast({
        title: "Error",
        description: "Please select a CA level.",
        variant: "destructive",
      });
      return;
    }

    if (!["FOUNDATION", "INTERMEDIATE", "FINAL", "ALL"].includes(caLevel)) {
      toast({
        title: "Error",
        description: "Invalid CA level selected.",
        variant: "destructive",
      });
      return;
    }

    if (tests.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one test.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate test titles
    const testTitles = tests.map((t) => t.title.trim().toLowerCase());
    const duplicates = testTitles.filter(
      (title, index) => testTitles.indexOf(title) !== index
    );
    if (duplicates.length > 0) {
      toast({
        title: "Error",
        description:
          "Test titles must be unique. Please ensure each test has a different title.",
        variant: "destructive",
      });
      return;
    }

    // Validate that subjective tests have required PDFs
    const subjectiveTests = tests.filter((t) => t.type === "SUBJECTIVE");
    const testsWithoutPDF = subjectiveTests.filter(
      (t) => !t.subjectiveQuestionPaper
    );
    if (testsWithoutPDF.length > 0) {
      toast({
        title: "Error",
        description: `All subjective tests must have a question paper PDF. Missing PDF for: ${testsWithoutPDF
          .map((t) => t.title)
          .join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validate that objective tests have MCQ questions
    const objectiveTests = tests.filter((t) => t.type === "OBJECTIVE");
    const testsWithoutQuestions = objectiveTests.filter(
      (t) => !t.mcqQuestions || t.mcqQuestions.length === 0
    );
    if (testsWithoutQuestions.length > 0) {
      toast({
        title: "Error",
        description: `All objective tests must have at least one MCQ question. Missing questions for: ${testsWithoutQuestions
          .map((t) => t.title)
          .join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validate PDF file sizes
    for (const test of subjectiveTests) {
      if (test.subjectiveQuestionPaper) {
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (test.subjectiveQuestionPaper.size > maxSize) {
          toast({
            title: "Error",
            description: `Question paper for "${test.title
              }" is too large (${(
                test.subjectiveQuestionPaper.size /
                (1024 * 1024)
              ).toFixed(1)}MB). Maximum size is 20MB.`,
            variant: "destructive",
          });
          return;
        }
      }
      if (test.suggestedAnswer && test.suggestedAnswer.size > 20 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `Suggested answer for "${test.title}" is too large (${(
            test.suggestedAnswer.size /
            (1024 * 1024)
          ).toFixed(1)}MB). Maximum size is 20MB.`,
          variant: "destructive",
        });
        return;
      }
    }

    console.log("Form submission data:", {
      title: title.trim(),
      description: description.trim(),
      originalPrice: originalPriceNumber,
      discountedPrice: discountedPriceNumber,
      caLevel,
      thumbnail,
      validityType,
      validityDate,
      attemptsType,
      attemptsCount,
      testsCount: tests.length,
    });

    const testSeriesData = {
      title: title.trim(),
      description: description.trim(),
      price: discountedPrice,
      originalPrice,
      discountedPrice,
      caLevel,
      thumbnail: thumbnail || undefined,
      validityType,
      validityDate:
        validityType === "DATE" ? validityDate : undefined,
      attemptsType,
      attemptsCount:
        attemptsType === "LIMITED"
          ? Number(attemptsCount) || undefined
          : undefined,
      tests: tests.map((test: TestForm) => ({
        ...test,
        type: test.type as "OBJECTIVE" | "SUBJECTIVE",
      })),
    };

    const result = await createTestSeries(testSeriesData);
    if (result) {
      navigate("/admin/tests");
    }
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
                Create Test Series
              </h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin/tests")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tests
            </Button>
          </div>
        </header>

        <main className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Series Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Original Price (₹) *</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountedPrice">Discounted Price (₹) *</Label>
                    <Input
                      id="discountedPrice"
                      type="number"
                      value={discountedPrice}
                      onChange={(e) => setDiscountedPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnail">Thumbnail Image</Label>
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setThumbnail(e.target.files ? e.target.files[0] : null)
                    }
                  />
                </div>
                <div>
                  <Label>CA Level *</Label>
                  <Select
                    onValueChange={handleCaLevelChange}
                    value={caLevel}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOUNDATION">CA Foundation</SelectItem>
                      <SelectItem value="INTERMEDIATE">
                        CA Intermediate
                      </SelectItem>
                      <SelectItem value="FINAL">CA Final</SelectItem>
                      <SelectItem value="ALL">CA All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Validity & Attempts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Validity</Label>
                    <Select
                      value={validityType}
                      onValueChange={(v) =>
                        setValidityType(v as "UNLIMITED" | "DATE")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                        <SelectItem value="DATE">Until Date</SelectItem>
                      </SelectContent>
                    </Select>
                    {validityType === "DATE" && (
                      <div className="mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !validityDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {validityDate ? (
                                format(validityDate, "PPP")
                              ) : (
                                <span>Pick expiry date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={validityDate}
                              onSelect={setValidityDate}
                              initialFocus
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Attempts</Label>
                    <Select
                      value={attemptsType}
                      onValueChange={(v) =>
                        setAttemptsType(v as "UNLIMITED" | "LIMITED")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                        <SelectItem value="LIMITED">Limited</SelectItem>
                      </SelectContent>
                    </Select>
                    {attemptsType === "LIMITED" && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 3"
                          value={attemptsCount}
                          onChange={(e) => setAttemptsCount(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tests in this Series</CardTitle>
                <Button type="button" onClick={handleAddNewTest}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test
                </Button>
              </CardHeader>
              <CardContent>
                {tests.length > 0 ? (
                  <div className="space-y-2">
                    {tests.map((test: TestForm) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{test.title}</p>
                          <p className="text-sm text-gray-500">
                            <span className="capitalize">
                              {test.type.toLowerCase()}
                            </span>{" "}
                            Test - {test.subject} - {test.duration} mins
                            {test.passingPercentage !== undefined && (
                              <span> - Pass {test.passingPercentage}%</span>
                            )}
                            {test.type === "SUBJECTIVE" && test.totalMarks && (
                              <span> - {test.totalMarks} marks</span>
                            )}
                            {test.type === "SUBJECTIVE" &&
                              (test.allowedEvaluatorIds?.length || 0) > 0 && (
                                <span>
                                  {" "}
                                  - {test.allowedEvaluatorIds?.length} evaluator
                                  {(test.allowedEvaluatorIds?.length || 0) > 1
                                    ? "s"
                                    : ""}
                                </span>
                              )}
                            {test.type === "OBJECTIVE" &&
                              test.mcqQuestions.length > 0 && (
                                <span>
                                  {" "}
                                  -{" "}
                                  {test.mcqQuestions.reduce(
                                    (total, q) => total + (q.marks || 0),
                                    0
                                  )}{" "}
                                  marks (auto)
                                </span>
                              )}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTest(test)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => removeTest(test.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No tests added yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/admin/tests")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  "Saving draft..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateTestSeries;
