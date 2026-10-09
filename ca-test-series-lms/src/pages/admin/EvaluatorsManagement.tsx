import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Menu, UserPlus, Mail, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { evaluatorsApi, EvaluatorListItem } from "@/lib/api";

const EvaluatorsManagement = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [addEvaluatorDialog, setAddEvaluatorDialog] = useState(false);
  const [editEvaluatorDialog, setEditEvaluatorDialog] = useState(false);
  const [evaluatorEmail, setEvaluatorEmail] = useState("");
  const [evaluatorName, setEvaluatorName] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [editingEvaluator, setEditingEvaluator] =
    useState<EvaluatorListItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [evaluators, setEvaluators] = useState<EvaluatorListItem[]>([]);
  const [resendLoadingId, setResendLoadingId] = useState<string | null>(null);
  type AxiosErr = { response?: { data?: { message?: string } } };
  const getErrMsg = useCallback(
    (err: unknown, fallback = "Something went wrong") => {
      const e = err as AxiosErr;
      return e?.response?.data?.message || fallback;
    },
    []
  );

  // initial load: subjects + list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setListLoading(true);
        const [enums, list] = await Promise.all([
          evaluatorsApi.getEnums(),
          evaluatorsApi.list(),
        ]);
        if (!mounted) return;
        setSubjects(enums.subjects);
        setEvaluators(list);
      } catch (e: unknown) {
        if (!mounted) return;
        toast({
          title: "Failed to load data",
          description: getErrMsg(e, "Failed to load evaluators"),
          variant: "destructive",
        });
      } finally {
        if (mounted) setListLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getErrMsg, toast]);

  const totals = useMemo(
    () => ({
      total: evaluators.reduce((sum, e) => sum + (e.stats?.assigned || 0), 0),
      pending: evaluators.reduce((sum, e) => sum + (e.stats?.pending || 0), 0),
      inProgress: evaluators.reduce(
        (sum, e) => sum + (e.stats?.inProgress || 0),
        0
      ),
      completed: evaluators.reduce(
        (sum, e) => sum + (e.stats?.completed || 0),
        0
      ),
    }),
    [evaluators]
  );

  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setSelectedSubjects([...selectedSubjects, subject]);
    } else {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    }
  };

  const handleAddEvaluator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter full name",
        variant: "destructive",
      });
      return;
    }
    if (!evaluatorEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (selectedSubjects.length === 0) {
      toast({
        title: "Subject Required",
        description: "Please select at least one subject",
        variant: "destructive",
      });
      return;
    }

    try {
      await evaluatorsApi.create({
        fullName: evaluatorName.trim(),
        email: evaluatorEmail.trim(),
        password: "Temp#123", // backend requires password; evaluator will set via email link
        caLevel: "FOUNDATION",
        specializations: selectedSubjects,
      });
      const list = await evaluatorsApi.list();
      setEvaluators(list);
      setEvaluatorEmail("");
      setEvaluatorName("");
      setSelectedSubjects([]);
      setAddEvaluatorDialog(false);
      toast({
        title: "Evaluator Added",
        description: "Invitation email sent to evaluator",
      });
    } catch (err: unknown) {
      const e = err as {
        response?: {
          status?: number;
          data?: { code?: string; message?: string };
        };
      };
      if (
        e?.response?.status === 409 &&
        e.response.data?.code === "EMAIL_EXISTS_STUDENT"
      ) {
        const confirmConvert = window.confirm(
          `${evaluatorEmail} belongs to an existing Student. Do you want to convert them to Evaluator and notify them?`
        );
        if (confirmConvert) {
          try {
            await evaluatorsApi.create({
              fullName: evaluatorName.trim(),
              email: evaluatorEmail.trim(),
              password: "Temp#123",
              caLevel: "FOUNDATION",
              specializations: selectedSubjects,
              convertIfStudent: true,
            });
            const list = await evaluatorsApi.list();
            setEvaluators(list);
            setEvaluatorEmail("");
            setEvaluatorName("");
            setSelectedSubjects([]);
            setAddEvaluatorDialog(false);
            toast({
              title: "User converted to Evaluator",
              description: "Notification email sent.",
            });
            return;
          } catch (e2: unknown) {
            toast({
              title: "Conversion failed",
              description: getErrMsg(e2, "Try again"),
              variant: "destructive",
            });
            return;
          }
        }
      }
      toast({
        title: "Failed to add evaluator",
        description: getErrMsg(err, "Try again"),
        variant: "destructive",
      });
    }
  };

  const handleEditEvaluator = (evaluator: EvaluatorListItem) => {
    setEditingEvaluator(evaluator);
    setSelectedSubjects(evaluator.specializations || []);
    setEditEvaluatorDialog(true);
  };

  const handleUpdateEvaluator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSubjects.length === 0) {
      toast({
        title: "Subject Required",
        description: "Please select at least one subject",
        variant: "destructive",
      });
      return;
    }

    if (!editingEvaluator) return;
    try {
      await evaluatorsApi.update(editingEvaluator.id, {
        specializations: selectedSubjects,
      });
      const list = await evaluatorsApi.list();
      setEvaluators(list);
      setEditEvaluatorDialog(false);
      setEditingEvaluator(null);
      setSelectedSubjects([]);
      toast({
        title: "Evaluator Updated",
        description: "Specializations updated successfully",
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to update",
        description: getErrMsg(err, "Try again"),
        variant: "destructive",
      });
    }
  };

  const handleDeactivateEvaluator = async (evaluatorId: string) => {
    try {
      const resp = await evaluatorsApi.toggle(evaluatorId);
      setEvaluators((prev) =>
        prev.map((ev) =>
          ev.id === evaluatorId ? { ...ev, isActive: resp.isActive } : ev
        )
      );
      const ev = evaluators.find((e) => e.id === evaluatorId);
      toast({
        title: resp.isActive ? "Evaluator Activated" : "Evaluator Deactivated",
        description: `${ev?.fullName || "Evaluator"} is now ${
          resp.isActive ? "Active" : "Inactive"
        }`,
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to toggle status",
        description: getErrMsg(err, "Try again"),
        variant: "destructive",
      });
    }
  };

  const handleResendVerification = async (evaluatorId: string) => {
    try {
      setResendLoadingId(evaluatorId);
      const resp = await evaluatorsApi.resendVerification(evaluatorId);
      toast({
        title: "Verification Email Sent",
        description: resp.message || "Email sent",
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to resend",
        description: getErrMsg(err, "Try again"),
        variant: "destructive",
      });
    } finally {
      setResendLoadingId(null);
    }
  };

  // const calculateCompletionRate = (evaluator: EvaluatorListItem) => {
  //   const a = evaluator.stats?.assigned || 0;
  //   const c = evaluator.stats?.completed || 0;
  //   return a > 0 ? Math.round((c / a) * 100) : 0;
  // };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <Sidebar role="admin" />
      <MobileSidebar
        role="admin"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">{/* Added min-w-0 to prevent flex overflow */}
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
                Evaluators Management
              </h1>
            </div>
            <Button onClick={() => setAddEvaluatorDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Evaluator
            </Button>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Evaluation Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card
              className={`cursor-pointer transition-colors ${
                statusFilter === "all" ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setStatusFilter("all")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Evaluations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.total}</div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-colors ${
                statusFilter === "pending" ? "ring-2 ring-orange-500" : ""
              }`}
              onClick={() => setStatusFilter("pending")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {totals.pending}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-colors ${
                statusFilter === "inProgress" ? "ring-2 ring-yellow-500" : ""
              }`}
              onClick={() => setStatusFilter("inProgress")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {totals.inProgress}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-colors ${
                statusFilter === "completed" ? "ring-2 ring-green-500" : ""
              }`}
              onClick={() => setStatusFilter("completed")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totals.completed}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Evaluators List */}
          <Card>
            <CardHeader>
              <CardTitle>All Evaluators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Specialization</th>
                      <th className="text-center p-3">Assigned</th>
                      <th className="text-center p-3">Pending</th>
                      <th className="text-center p-3">In Progress</th>
                      <th className="text-center p-3">Completed</th>
                      <th className="text-center p-3">This Week</th>
                      <th className="text-center p-3">Verified</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="p-4 text-center text-gray-500"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : evaluators.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="p-4 text-center text-gray-500"
                        >
                          No evaluators found
                        </td>
                      </tr>
                    ) : (
                      evaluators.map((evaluator) => (
                        <tr
                          key={evaluator.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium">
                            {evaluator.fullName}
                          </td>
                          <td className="p-3">{evaluator.email}</td>
                          <td className="p-3">
                            {evaluator.specializations &&
                            evaluator.specializations.length > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="cursor-pointer flex items-center">
                                      {evaluator.specializations[0]}
                                      {evaluator.specializations.length > 1 && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2"
                                        >
                                          +
                                          {evaluator.specializations.length - 1}
                                        </Badge>
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {evaluator.specializations.join(", ")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="text-center p-3">
                            {evaluator.stats?.assigned || 0}
                          </td>
                          <td className="text-center p-3 text-orange-600">
                            {evaluator.stats?.pending || 0}
                          </td>
                          <td className="text-center p-3 text-yellow-600">
                            {evaluator.stats?.inProgress || 0}
                          </td>
                          <td className="text-center p-3 text-green-600">
                            {evaluator.stats?.completed || 0}
                          </td>
                          <td className="text-center p-3 text-blue-600">
                            {evaluator.stats?.thisWeek || 0}
                          </td>
                          <td className="text-center p-3">
                            {evaluator.emailVerified ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Yes
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resendLoadingId === evaluator.id}
                                onClick={() =>
                                  handleResendVerification(evaluator.id)
                                }
                              >
                                {resendLoadingId === evaluator.id
                                  ? "Resending..."
                                  : "Resend"}
                              </Button>
                            )}
                          </td>
                          <td className="text-center p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                evaluator.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {evaluator.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-right p-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEvaluator(evaluator)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeactivateEvaluator(evaluator.id)
                                }
                                className={
                                  evaluator.isActive
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {evaluator.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Evaluator Dialog */}
      <Dialog open={addEvaluatorDialog} onOpenChange={setAddEvaluatorDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Add New Evaluator</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvaluator} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evaluatorName">Full Name</Label>
              <Input
                id="evaluatorName"
                placeholder="Rajesh Kumar"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evaluatorEmail">Evaluator Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="evaluatorEmail"
                  type="email"
                  placeholder="evaluator@example.com"
                  value={evaluatorEmail}
                  onChange={(e) => setEvaluatorEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Subjects (Select multiple)</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                {subjects.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={(checked) =>
                        handleSubjectChange(subject, checked as boolean)
                      }
                    />
                    <Label htmlFor={subject} className="text-sm font-normal">
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Select one or more subjects this evaluator can evaluate
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setAddEvaluatorDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Evaluator</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Evaluator Dialog */}
      <Dialog open={editEvaluatorDialog} onOpenChange={setEditEvaluatorDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-left leading-tight">
              <span className="block">Edit Evaluator</span>
              <span className="block text-sm font-medium text-muted-foreground truncate mt-1" title={editingEvaluator?.fullName}>
                {editingEvaluator?.fullName}
              </span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEvaluator} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Subjects (Select multiple)</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                {subjects.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${subject}`}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={(checked) =>
                        handleSubjectChange(subject, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`edit-${subject}`}
                      className="text-sm font-normal"
                    >
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Select one or more subjects this evaluator can evaluate
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditEvaluatorDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Evaluator</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluatorsManagement;
