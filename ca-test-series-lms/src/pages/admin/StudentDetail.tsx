import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  FileText,
  Calendar,
  User,
  Mail,
  Book,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// removed unused dialog imports
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { adminStudentsApi } from "@/lib/api/adminStudents";
import { TEXT_COLORS, BG_COLORS } from "@/constants/colors";
import { formatDate } from "@/utils/dateUtils";

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  type UiStudent = {
    id: string;
    name: string;
    email: string;
    caLevel: string;
    registrationDate: string;
    phone?: string;
    testsPurchased?: number;
    profileImage?: string | null;
  } | null;
  type UiTest = {
    id: string;
    submissionId?: string;
    name: string;
    date: string;
    duration: number | null;
    score: number | null;
    maxScore: number | null;
    status: "evaluated" | "pending_evaluation" | "not-attempted";
    feedback: string | null;
    evaluatorName: string | null;
  };
  const [student, setStudent] = useState<UiStudent>(null);
  const [tests, setTests] = useState<UiTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type UiNote = {
    id: string;
    note: string;
    authorId: string | null;
    createdAt: string;
  };
  const [notes, setNotes] = useState<UiNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  type UiPurchase = {
    id: string;
    title: string;
    price: number;
    purchaseDate: string;
    validUntil: string | null;
    status: 'active' | 'expired';
  };
  const [purchases, setPurchases] = useState<UiPurchase[]>([]);

  const fetchSubmissions = useCallback(async (id: string) => {
    const res = await adminStudentsApi.listSubmissions(id, {
      status: "all",
      page: 1,
      pageSize: 100,
    });
    return res.data.map<UiTest>((d) => ({
      id: d.id,
      submissionId: d.submissionId || d.id,
      name: d.testName,
      date: d.date,
      duration: null,
      score: d.score ? d.score.awarded : null,
      maxScore: d.score ? d.score.total : null,
      status:
        d.status === "COMPLETED"
          ? "evaluated"
          : d.status === "IN_PROGRESS"
            ? "pending_evaluation"
            : "not-attempted",
      feedback: null,
      evaluatorName: d.evaluatorName,
    }));
  }, []);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const stu = await adminStudentsApi.getById(id);
        const [subsRes, notesRes, purchasesRes] = await Promise.all([
          fetchSubmissions(id),
          adminStudentsApi.listNotes(id),
          adminStudentsApi.listPurchases(id),
        ]);
        if (!ignore) {
          setStudent(stu);
          setTests(subsRes);
          setNotes(notesRes.data);
          setPurchases(purchasesRes.data || []);
        }
      } catch (e: unknown) {
        let msg = "Failed to load student";
        if (
          typeof e === "object" &&
          e !== null &&
          "message" in (e as { message?: string })
        )
          msg = (e as { message?: string }).message || msg;
        if (!ignore) setError(msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [id, fetchSubmissions]);

  const grantRetake = async (testId: string) => {
    if (!id) return;

    // Determine which test IDs to process
    const testIdsToProcess = testId === "all"
      ? tests.map(t => t.id)
      : [testId];

    if (testIdsToProcess.length === 0) {
      toast({ title: "No tests to reset" });
      return;
    }

    if (!confirm(`Are you sure you want to grant retake for ${testIdsToProcess.length} test(s)? This will delete the existing submission(s).`)) {
      return;
    }

    try {
      // Process all requests in parallel
      await Promise.all(testIdsToProcess.map(tid => {
        const test = tests.find((entry) => entry.id === tid);
        return adminStudentsApi.grantRetake(id, {
          submissionId: test?.submissionId,
          testId: tid,
        });
      }));

      toast({
        title: "Retake Access Granted",
        description: `Successfully reset ${testIdsToProcess.length} test submission(s).`,
      });

      // Refresh the submissions list
      const subsRes = await fetchSubmissions(id);
      setTests(subsRes);
    } catch (e: unknown) {
      console.error("Failed to grant retake:", e);
      let msg = "Failed to grant retake";
      if (
        typeof e === "object" &&
        e !== null &&
        "message" in (e as { message?: string })
      )
        msg = (e as { message?: string }).message || msg;

      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // const downloadResult = (testId: string) => {};

  const onSaveNote = async () => {
    if (!id) return;
    const text = noteText.trim();
    if (!text) {
      toast({
        title: "Note is empty",
        description: "Please write something before saving.",
      });
      return;
    }
    try {
      const created = await adminStudentsApi.addNote(id, text);
      setNotes((prev) => [{ ...created }, ...prev]);
      setNoteText("");
      toast({ title: "Note added" });
    } catch (e: unknown) {
      let msg = "Failed to add note";
      if (typeof e === "object" && e !== null) {
        const err = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        msg = err.response?.data?.message || err.message || msg;
      }
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" />
        <MobileSidebar
          role="admin"
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        <div className="flex-1">
          <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin/students")}
                  className="mr-2 flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  Student Details
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)} className="whitespace-nowrap">
                  <Mail className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Email Student</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">
            {loading && (
              <div className="text-gray-500 mb-4">Loading student…</div>
            )}
            {error && <div className={`${TEXT_COLORS.ERROR} mb-4`}>{error}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                  <CardDescription>
                    Personal details and account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center mb-4">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={student?.profileImage || ""} />
                      <AvatarFallback className="text-xl">
                        {(student?.name || "NA")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-lg sm:text-xl font-semibold text-center break-words max-w-full">
                      {student?.name || "-"}
                    </h2>
                    {student?.caLevel && (
                      <Badge className="mt-2">{student.caLevel}</Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Mail className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="break-all text-sm">{student?.email || "-"}</span>
                    </div>
                    <div className="flex items-start">
                      <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words text-sm">{student?.phone || "-"}</span>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Joined on{" "}
                        {student?.registrationDate
                          ? formatDate(
                            student.registrationDate
                          )
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-3 text-sm sm:text-base">Activity Summary</h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
                        <div className="flex items-center mb-1">
                          <Book className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-primary flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-primary leading-tight">
                            Tests Purchased
                          </span>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold text-primary">
                          {student?.testsPurchased ?? '-'}
                        </p>
                      </div>
                      <div className={`${BG_COLORS.SUCCESS} p-2 sm:p-3 rounded-lg`}>
                        <div className="flex items-center mb-1">
                          <FileText className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${TEXT_COLORS.SUCCESS} flex-shrink-0`} />
                          <span className={`text-xs sm:text-sm ${TEXT_COLORS.SUCCESS} leading-tight`}>
                            Tests Attempted
                          </span>
                        </div>
                        <p className={`text-lg sm:text-xl font-semibold ${TEXT_COLORS.SUCCESS}`}>
                          {tests.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Tests attempted and results</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tests">
                    <TabsList className="mb-4">
                      <TabsTrigger value="tests">Test History</TabsTrigger>
                      <TabsTrigger value="purchases">Purchases</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tests">
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[80px]">
                                    <span className="text-xs sm:text-sm">Test ID</span>
                                  </TableHead>
                                  <TableHead className="min-w-[150px]">
                                    <span className="text-xs sm:text-sm">Test Name</span>
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    <span className="text-xs sm:text-sm">Date</span>
                                  </TableHead>
                                  <TableHead className="min-w-[120px]">
                                    <span className="text-xs sm:text-sm">Evaluator</span>
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    <span className="text-xs sm:text-sm">Status</span>
                                  </TableHead>
                                  <TableHead className="text-right min-w-[80px]">
                                    <span className="text-xs sm:text-sm">Score</span>
                                  </TableHead>
                                  <TableHead className="text-right min-w-[140px]">
                                    <span className="text-xs sm:text-sm">Grant Retake</span>
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tests.map((test) => (
                                  <TableRow key={test.id}>
                                    <TableCell className="font-medium">
                                      <span className="text-xs sm:text-sm break-all">{test.id}</span>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <span className="text-xs sm:text-sm break-words">{test.name}</span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs sm:text-sm whitespace-nowrap">{formatDate(test.date)}</span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs sm:text-sm break-words">{test.evaluatorName || "Not Assigned"}</span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          test.status === "evaluated"
                                            ? "default"
                                            : test.status === "pending_evaluation"
                                              ? "outline"
                                              : "secondary"
                                        }
                                        className="text-xs whitespace-nowrap"
                                      >
                                        {test.status === "evaluated"
                                          ? "Evaluated"
                                          : test.status === "pending_evaluation"
                                            ? "Pending"
                                            : "Not Attempted"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="text-xs sm:text-sm whitespace-nowrap">
                                        {test.score !== null
                                          ? `${test.score}/${test.maxScore}`
                                          : "-"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => grantRetake(test.id)}
                                        className="whitespace-nowrap text-xs sm:text-sm"
                                      >
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Grant Retake</span>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>

                      {tests.length > 0 && (
                        <div className="mt-4 flex justify-end px-4 sm:px-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => grantRetake("all")}
                            className="whitespace-nowrap text-xs sm:text-sm"
                          >
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Grant All Retakes</span>
                            <span className="sm:hidden ml-1">Grant All</span>
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="purchases">
                      {purchases.length === 0 ? (
                        <div className="text-gray-500 p-4">
                          No purchases found.
                        </div>
                      ) : (
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                          <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="min-w-[150px]">Test Series</TableHead>
                                    <TableHead className="min-w-[100px]">Purchase Date</TableHead>
                                    <TableHead className="min-w-[100px]">Valid Until</TableHead>
                                    <TableHead className="min-w-[80px]">Price</TableHead>
                                    <TableHead className="min-w-[80px]">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {purchases.map((p) => (
                                    <TableRow key={p.id}>
                                      <TableCell className="font-medium whitespace-nowrap">{p.title}</TableCell>
                                      <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                                      <TableCell>{p.validUntil ? formatDate(p.validUntil) : '-'}</TableCell>
                                      <TableCell>₹{p.price}</TableCell>
                                      <TableCell>
                                        <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                                          {p.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Add Administrative Note</CardTitle>
                <CardDescription>
                  Internal notes for administrative purposes only (not visible to
                  the student)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about this student..."
                  className="min-h-[100px]"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                  <Button onClick={onSaveNote}>Save Note</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Notes History</CardTitle>
                <CardDescription>Latest notes appear first</CardDescription>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-gray-500">No notes yet.</div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((n) => (
                      <div key={n.id} className="p-3 border rounded-md">
                        <div className="text-xs sm:text-sm text-gray-600 mb-1 break-words">
                          {new Date(n.createdAt).toLocaleString()}{" "}
                          {n.authorId ? `• by ${n.authorId}` : ""}
                        </div>
                        <div className="whitespace-pre-wrap break-words text-sm">{n.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Email Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">To</label>
              <Input value={student?.email || "-"} disabled />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Write your message..."
                className="min-h-[140px]"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setEmailDialogOpen(false)}
              disabled={emailSending}
            >
              Cancel
            </Button>
            <Button
              disabled={emailSending || !emailSubject.trim() || !emailMessage.trim() || !student}
              onClick={async () => {
                if (!id || !student) return;
                const subject = emailSubject.trim();
                const message = emailMessage.trim();
                if (!subject || !message) return;
                setEmailSending(true);
                try {
                  await adminStudentsApi.emailStudent(id, { subject, message });
                  toast({ title: "Email queued" });
                  setEmailDialogOpen(false);
                  setEmailSubject("");
                  setEmailMessage("");
                } catch (e: unknown) {
                  let msg = "Failed to send";
                  if (typeof e === "object" && e !== null) {
                    const err = e as { response?: { data?: { message?: string } }; message?: string };
                    msg = err.response?.data?.message || err.message || msg;
                  }
                  toast({ title: "Error", description: msg, variant: "destructive" });
                } finally {
                  setEmailSending(false);
                }
              }}
            >
              {emailSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentDetail;
