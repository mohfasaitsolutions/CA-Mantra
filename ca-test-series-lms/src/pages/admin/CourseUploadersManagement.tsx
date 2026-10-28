import { useCallback, useEffect, useState } from "react";
import {
  Menu,
  UserPlus,
  Mail,
  KeyRound,
  Search,
  Loader2,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import {
  usersApi,
  StaffUser,
  StaffPagination,
  StaffSortField,
} from "@/lib/api/users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";

type AxiosErr = { response?: { data?: { message?: string } } };

const CourseUploadersManagement = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [uploaders, setUploaders] = useState<StaffUser[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // server-driven table state
  const [pagination, setPagination] = useState<StaffPagination | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<StaffSortField>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all"
  );

  // new uploader form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const getErrMsg = useCallback(
    (err: unknown, fallback = "Something went wrong") => {
      const e = err as AxiosErr;
      return e?.response?.data?.message || fallback;
    },
    []
  );

  const load = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await usersApi.listStaff({
        role: "COURSE_UPLOADER",
        q: search.trim() || undefined,
        active: statusFilter === "all" ? undefined : statusFilter === "true",
        page,
        limit: pageSize,
        sortBy,
        sortDir,
      });
      setUploaders(res.data);
      setPagination(res.pagination);
      // e.g. the last row on the last page was filtered away
      if (res.pagination.page > res.pagination.totalPages) {
        setPage(res.pagination.totalPages);
      }
    } catch (err) {
      toast({
        title: "Could not load course uploaders",
        description: getErrMsg(err),
        variant: "destructive",
      });
    } finally {
      setListLoading(false);
    }
  }, [search, statusFilter, page, pageSize, sortBy, sortDir, getErrMsg, toast]);

  // debounce so typing in the search box doesn't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // any change to filters, sort or page size returns to the first page
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize, sortBy, sortDir]);

  const toggleSort = (field: StaffSortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const SortableHead = ({
    field,
    children,
    className,
  }: {
    field: StaffSortField;
    children: React.ReactNode;
    className?: string;
  }) => {
    const active = sortBy === field;
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
          aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        >
          {children}
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>
      </TableHead>
    );
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
  };

  const handleCreate = async () => {
    if (fullName.trim().length < 2) {
      toast({ title: "Enter a full name", variant: "destructive" });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        caLevel: "FOUNDATION",
        role: "COURSE_UPLOADER",
      });
      toast({
        title: "Course uploader created",
        description:
          "They must verify their email before they can sign in. Use Resend verification if it doesn't arrive.",
      });
      setAddDialog(false);
      resetForm();
      load();
    } catch (err) {
      toast({
        title: "Could not create course uploader",
        description: getErrMsg(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (u: StaffUser) => {
    setBusyId(u._id);
    try {
      const res = await usersApi.toggleStaffStatus(u._id);
      setUploaders((prev) =>
        prev.map((x) => (x._id === u._id ? { ...x, isActive: res.isActive } : x))
      );
      toast({
        title: res.isActive ? "Account activated" : "Account deactivated",
      });
    } catch (err) {
      toast({
        title: "Could not change status",
        description: getErrMsg(err),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleResendVerification = async (u: StaffUser) => {
    setBusyId(u._id);
    try {
      const res = await usersApi.resendStaffVerification(u._id);
      toast({ title: res.message || "Verification email resent" });
    } catch (err) {
      toast({
        title: "Could not resend verification",
        description: getErrMsg(err),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleResendInvite = async (u: StaffUser) => {
    setBusyId(u._id);
    try {
      const res = await usersApi.resendStaffInvite(u._id);
      toast({ title: res.message || "Set-password invite resent" });
    } catch (err) {
      toast({
        title: "Could not resend invite",
        description: getErrMsg(err),
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="admin" />
      <MobileSidebar
        role="admin"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 overflow-y-auto">
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
                Course Uploaders
              </h1>
            </div>
            <Button onClick={() => setAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Course Uploader
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <p className="text-sm text-gray-600 mb-4 max-w-3xl">
            Course uploaders manage test series, plans and study materials. They
            cannot open the admin console, see revenue, or delete content.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | "true" | "false")
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="true">Active only</SelectItem>
                <SelectItem value="false">Inactive only</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead field="fullName">Name</SortableHead>
                    <SortableHead field="email">Email</SortableHead>
                    <SortableHead field="isActive">Status</SortableHead>
                    <SortableHead field="createdAt">Added</SortableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : uploaders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-gray-500"
                      >
                        {search || statusFilter !== "all"
                          ? "No course uploaders match these filters."
                          : "No course uploaders yet. Add one to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    uploaders.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-medium">
                          {u.fullName}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={u.isActive ? "default" : "secondary"}
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {!u.emailVerified && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-300"
                              >
                                Email unverified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!u.emailVerified && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Resend verification email"
                                disabled={busyId === u._id}
                                onClick={() => handleResendVerification(u)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Resend set-password invite"
                              disabled={busyId === u._id}
                              onClick={() => handleResendInvite(u)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={u.isActive ? "Deactivate" : "Activate"}
                              disabled={busyId === u._id}
                              onClick={() => handleToggle(u)}
                            >
                              {u.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {pagination && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-sm text-gray-600">
                Showing{" "}
                {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={!pagination.hasPrev || listLoading}
                >
                  Previous
                </Button>
                <span className="text-sm whitespace-nowrap">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, pagination.totalPages))
                  }
                  disabled={!pagination.hasNext || listLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog
        open={addDialog}
        onOpenChange={(open) => {
          setAddDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course Uploader</DialogTitle>
            <DialogDescription>
              They will be able to manage test series, plans and study materials,
              but not the admin console, revenue or deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cu-name">Full name</Label>
              <Input
                id="cu-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-email">Email</Label>
              <Input
                id="cu-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-password">Temporary password</Label>
              <PasswordInput
                id="cu-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
              <p className="text-xs text-gray-500">
                They receive a set-password email and must verify their address
                before signing in.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseUploadersManagement;
