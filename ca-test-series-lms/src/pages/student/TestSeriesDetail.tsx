import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ArrowLeft,
  Play,
  FileText,
  Download,
  Upload,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { useTestSeries } from "@/hooks/use-test-series";
import { studentsApi } from "@/lib/api/students";

const TestSeriesDetail = () => {
  const { id } = useParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [subjectiveTestDialog, setSubjectiveTestDialog] = useState(false);
  type LocalTest = {
    id: string;
    title: string;
    type: "objective" | "subjective" | "mixed";
    duration?: number;
    totalQuestions?: number;
    marks?: number;
    status?: string;
  } | null;
  const [selectedTest, setSelectedTest] = useState<LocalTest>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { fetchTestSeriesById } = useTestSeries();
  const navigate = useNavigate();
  const [seriesTitle, setSeriesTitle] = useState<string>("Test Series");
  const [seriesDescription, setSeriesDescription] = useState<string>("");
  const [seriesLevel, setSeriesLevel] = useState<string>("");
  const [apiTests, setApiTests] = useState<
    Array<{
      id: string;
      title: string;
      type: "objective" | "subjective" | "mixed";
      duration?: number;
      totalQuestions?: number;
      marks?: number;
      objectiveMarks?: number;
      subjectiveMarks?: number;
      status?: string;
      objectiveCompleted?: boolean;
      subjectiveCompleted?: boolean;
      objectiveScore?: number;
      subject?: string;
      questionPaperUrl?: string | null;
    }>
  >([]);
  // local load flag (if needed later)

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const data = await fetchTestSeriesById(id);
      if (!data) return;
      setSeriesTitle(data.title || "Test Series");
      setSeriesDescription(data.description || "");
      const levelMap: Record<string, string> = {
        FOUNDATION: "Foundation",
        INTERMEDIATE: "Intermediate",
        FINAL: "Final",
      };
      setSeriesLevel(levelMap[data.caLevel] || data.caLevel || "");
      const mapped = (data.tests || []).map((t) => ({
        id: t.id,
        title: t.title,
        type: (t.testType === "OBJECTIVE"
          ? "objective"
          : t.testType === "SUBJECTIVE"
          ? "subjective"
          : "mixed") as "objective" | "subjective" | "mixed",
        duration: t.duration,
        totalQuestions: t.totalQuestions,
        marks: t.totalMarks,
        objectiveMarks: t.objectiveMarks,
        subjectiveMarks: t.subjectiveMarks,
        status: "not_attempted",
        subject: t.subject,
        questionPaperUrl: t.questionPaperUrl ?? null,
      }));
      setApiTests(mapped);
      // fetch statuses to update submission/completed states
      const res = await studentsApi.statuses(id);
      const statusMap = new Map(res.statuses.map((s) => [s.testId, s]));
      setApiTests((prev) =>
        prev.map((t) => {
          const statusInfo = statusMap.get(t.id);
          return {
            ...t,
            status: statusInfo?.status || t.status,
            objectiveCompleted: statusInfo?.objectiveCompleted || false,
            subjectiveCompleted: statusInfo?.subjectiveCompleted || false,
            objectiveScore: statusInfo?.objectiveScore,
          };
        })
      );
    };
    load();
  }, [id, fetchTestSeriesById]);

  const getStatusBadge = (test: {
    type: "objective" | "subjective" | "mixed";
    status?: string;
    objectiveCompleted?: boolean;
    subjectiveCompleted?: boolean;
    objectiveScore?: number;
  }) => {
    if (test.type === "mixed") {
      if (test.objectiveCompleted && test.subjectiveCompleted) {
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 font-medium">
            Completed
          </Badge>
        );
      } else if (test.objectiveCompleted && !test.subjectiveCompleted) {
        return (
          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 font-medium">
            Obj. Complete
          </Badge>
        );
      } else {
        return <Badge variant="outline">Not Attempted</Badge>;
      }
    }

    // For regular objective/subjective tests
    switch (test.status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 font-medium">
            Completed {test.objectiveScore && `(${test.objectiveScore}%)`}
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 font-medium">
            Submitted
          </Badge>
        );
      case "not_attempted":
        return <Badge variant="outline">Not Attempted</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleObjectiveTest = async (test: { title: string; id: string }) => {
    if (!id) return;
    try {
      // Navigate to a new test-taking route carrying series and test ids
      navigate(`/test/${test.id}?series=${encodeURIComponent(id)}`);
    } catch (e) {
      toast({ title: "Failed to start test", variant: "destructive" });
    }
  };

  const handleStartSubjective = (test: {
    id: string;
    title: string;
    questionPaperUrl?: string | null;
  }) => {
    if (test.questionPaperUrl) {
      window.open(test.questionPaperUrl, "_blank");
    }
  };

  const handleViewSuggestedAnswer = async (test: {
    id: string;
    title: string;
  }) => {
    if (!id) return;
    try {
      const { url } = await studentsApi.suggestedAnswer(id, test.id);
      window.open(url, "_blank");
    } catch (e) {
      toast({
        title: "Not available",
        description: "Submit your answer sheet to view suggested answers.",
        variant: "destructive",
      });
    }
  };

  const handleUploadSubjective = (test: LocalTest) => {
    setSelectedTest(test);
    setSubjectiveTestDialog(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files && files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `File size (${(file.size / (1024 * 1024)).toFixed(
            1
          )}MB) exceeds 20MB limit. Please upload a smaller PDF file.`,
          variant: "destructive",
        });
        return;
      }

      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
    }
  };

  const handleSubmitUpload = async () => {
    if (!uploadedFile || !selectedTest || !id) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF before submitting.",
        variant: "destructive",
      });
      return;
    }
    try {
      await studentsApi.submitSubjective(id, selectedTest.id, uploadedFile);
      toast({ title: "Submitted", description: "Answer sheet uploaded." });
      setSubjectiveTestDialog(false);
      setUploadedFile(null);
      setSelectedTest(null);
      // refresh statuses so UI enables View Answer
      try {
        const res = await studentsApi.statuses(id);
        const statusMap = new Map(res.statuses.map((s) => [s.testId, s]));
        setApiTests((prev) =>
          prev.map((t) => {
            const statusInfo = statusMap.get(t.id);
            return {
              ...t,
              status: statusInfo?.status || t.status,
              objectiveCompleted: statusInfo?.objectiveCompleted || false,
              subjectiveCompleted: statusInfo?.subjectiveCompleted || false,
              objectiveScore: statusInfo?.objectiveScore,
            };
          })
        );
      } catch (err) {
        console.warn("Failed to refresh statuses after submission", err);
      }
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleViewResult = (test: { id: string; title: string }) => {
    // Navigate to test history where users can find their results
    navigate("/student/history", {
      state: {
        filterByTest: test.title,
        highlightTest: test.id,
      },
    });
  };

  const renderTestActions = (test: {
    id: string;
    type: "objective" | "subjective" | "mixed";
    status?: string;
    title: string;
    duration?: number;
    totalQuestions?: number;
    marks?: number;
    score?: number;
    questionPaperUrl?: string | null;
    objectiveCompleted?: boolean;
    subjectiveCompleted?: boolean;
  }) => {
    if (test.type === "objective") {
      if (test.status === "completed") {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewResult({ id: test.id, title: test.title })}
            className="hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Result
          </Button>
        );
      }
      return (
        <Button
          onClick={() =>
            handleObjectiveTest({ id: test.id, title: test.title })
          }
          size="sm"
          className="bg-ca-primary hover:bg-ca-primary/90"
        >
          <Play className="h-4 w-4 mr-2" />
          Start Test
        </Button>
      );
    } else if (test.type === "mixed") {
      // For mixed tests, show different actions based on completion status
      const objCompleted = test.objectiveCompleted;
      const subjCompleted = test.subjectiveCompleted;

      return (
        <div className="flex items-center justify-end gap-2">
          {/* Objective Section */}
          <Button
            size="sm"
            disabled={objCompleted}
            onClick={() =>
              handleObjectiveTest({ id: test.id, title: test.title })
            }
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 mr-1" />
            {objCompleted ? "Obj. Done" : "Start Obj."}
          </Button>

          {/* Subjective Section - Start (Download) */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              handleStartSubjective({
                id: test.id,
                title: test.title,
                questionPaperUrl: test.questionPaperUrl,
              })
            }
          >
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>

          {/* Subjective Section - Submit */}
          <Button
            size="sm"
            disabled={subjCompleted || !objCompleted}
            onClick={() =>
              handleUploadSubjective({
                id: test.id,
                title: test.title,
                type: "mixed",
              })
            }
            className="bg-ca-primary hover:bg-ca-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 mr-1" />
            {subjCompleted
              ? "Subj. Done"
              : !objCompleted
              ? "Complete Obj. First"
              : "Submit Subj."}
          </Button>

          {/* View Answer */}
          <Button
            size="sm"
            variant="outline"
            disabled={!subjCompleted}
            onClick={() =>
              handleViewSuggestedAnswer({ id: test.id, title: test.title })
            }
          >
            <FileText className="h-4 w-4 mr-1" /> View Answer
          </Button>
        </div>
      );
    } else {
      // subjective: show Start (Download), Submit (Upload), and View Answer after submission
      const hasSubmitted =
        test.status === "submitted" || test.status === "completed";
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              handleStartSubjective({
                id: test.id,
                title: test.title,
                questionPaperUrl: test.questionPaperUrl,
              })
            }
          >
            <Download className="h-4 w-4 mr-1" /> Start
          </Button>
          <Button
            size="sm"
            disabled={hasSubmitted}
            onClick={() =>
              handleUploadSubjective({
                id: test.id,
                title: test.title,
                type: "subjective",
              })
            }
            className="bg-ca-primary hover:bg-ca-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 mr-1" />
            {hasSubmitted ? "Submitted" : "Submit"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasSubmitted}
            onClick={() =>
              handleViewSuggestedAnswer({ id: test.id, title: test.title })
            }
          >
            <FileText className="h-4 w-4 mr-1" /> View Answer
          </Button>
        </div>
      );
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="student" />
      <MobileSidebar
        role="student"
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
              <Link to="/student/courses">
                <Button variant="ghost" size="sm" className="mr-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">
                {seriesTitle}
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Test Series Info */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{seriesTitle}</CardTitle>
                  <p className="text-gray-600 mt-2">{seriesDescription}</p>
                </div>
                {seriesLevel && (
                  <Badge variant="secondary">{seriesLevel}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Tests:</span>{" "}
                  {apiTests.length}
                </div>
                <div>
                  <span className="font-medium">Completed:</span>{" "}
                  {apiTests.filter((t) => t.status === "completed").length}/
                  {apiTests.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Available Tests</CardTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Here are all the tests included in this series.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%] pl-6">Test Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiTests.map((test) => (
                    <TableRow key={test.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium pl-6">
                        {test.title}
                      </TableCell>
                      <TableCell>{test.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {test.type === "objective" ? (
                            <Play className="h-4 w-4 text-blue-500" />
                          ) : test.type === "mixed" ? (
                            <div className="flex items-center gap-1">
                              <Play className="h-3 w-3 text-blue-500" />
                              <FileText className="h-3 w-3 text-green-500" />
                            </div>
                          ) : (
                            <FileText className="h-4 w-4 text-green-500" />
                          )}
                          <span className="capitalize">{test.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-muted-foreground">
                          {test.type === "mixed" ? (
                            <div>
                              <span>
                                Obj: {test.totalQuestions ?? 0} Questions,{" "}
                                {test.objectiveMarks ?? 0} Marks
                              </span>
                              <br />
                              <span>
                                Subj: {test.subjectiveMarks ?? 0} Marks
                              </span>
                            </div>
                          ) : (
                            <span>
                              {test.totalQuestions ?? 0} Questions,{" "}
                              {test.marks ?? 0} Marks
                            </span>
                          )}
                          {(test.type === "objective" ||
                            test.type === "mixed") &&
                            test.duration && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1.5" />
                                {test.duration} min
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(test)}</TableCell>
                      <TableCell className="text-right pr-6">
                        {renderTestActions(test)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Subjective Test Upload Dialog */}
      <Dialog
        open={subjectiveTestDialog}
        onOpenChange={setSubjectiveTestDialog}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-left leading-tight">
              <span className="block truncate">Upload Answer Sheet</span>
              <span className="block text-sm font-medium text-muted-foreground truncate mt-1">
                {selectedTest?.title}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="answerUpload">
                Upload Answer Sheet (PDF, Max 20MB)
              </Label>
              <Input
                id="answerUpload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
              />
              {uploadedFile && (
                <p className="text-sm text-green-600">
                  ✓ {uploadedFile.name} selected
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSubjectiveTestDialog(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmitUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestSeriesDetail;
