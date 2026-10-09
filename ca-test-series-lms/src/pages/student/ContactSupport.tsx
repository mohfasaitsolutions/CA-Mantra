import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDate } from "@/utils/dateUtils";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useAuth } from "@/hooks/use-auth";
import { useSupportTickets } from "@/hooks/use-support-tickets";
import { studentsApi, TestHistoryItem } from "@/lib/api/students";

const ContactSupport = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form data for creating new ticket
  const [formData, setFormData] = useState({
    subject: "",
    category: "GENERAL",
    priority: "MEDIUM",
    description: "",
    testId: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, role } = useAuth();

  const { tickets, loading, error, pagination, createTicket, refetch } =
    useSupportTickets({
      status: statusFilter,
      category: categoryFilter,
      page: 1,
      pageSize: 20,
    });

  // Check authentication
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    if (role !== "STUDENTS") {
      navigate("/");
      return;
    }
  }, [isLoggedIn, role, navigate]);

  // Fetch test history for dropdown
  useEffect(() => {
    const fetchTestHistory = async () => {
      try {
        setLoadingTests(true);
        const response = await studentsApi.history({ page: 1, pageSize: 50 });
        setTestHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch test history:", error);
      } finally {
        setLoadingTests(false);
      }
    };

    if (isLoggedIn && role === "STUDENTS") {
      fetchTestHistory();
    }
  }, [isLoggedIn, role]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (formData.subject.length < 5)
      errors.subject = "Subject must be at least 5 characters";
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (formData.description.length < 10)
      errors.description = "Description must be at least 10 characters";

    // Require test ID for evaluation category
    if (formData.category === "EVALUATION" && !formData.testId.trim()) {
      errors.testId = "Test ID is required for evaluation-related tickets";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await createTicket(formData);

      // Reset form and close dialog
      setFormData({
        subject: "",
        category: "GENERAL",
        priority: "MEDIUM",
        description: "",
        testId: "",
      });
      setIsCreateDialogOpen(false);
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : "Failed to create ticket",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "CLOSED":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-orange-100 text-orange-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="student" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading support tickets...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Contact Support
              </h1>
              <p className="text-gray-600 mt-1">
                Get help with your queries and issues
              </p>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-left">
                    Create Support Ticket
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENERAL">General</SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="PAYMENT">Payment</SelectItem>
                          <SelectItem value="EVALUATION">Evaluation</SelectItem>
                          <SelectItem value="ACCOUNT">Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Test ID field - show when category is EVALUATION */}
                  {formData.category === "EVALUATION" && (
                    <div>
                      <Label htmlFor="testId">
                        Test ID <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.testId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, testId: value })
                        }
                      >
                        <SelectTrigger
                          className={formErrors.testId ? "border-red-500" : ""}
                        >
                          <SelectValue
                            placeholder={
                              loadingTests
                                ? "Loading tests..."
                                : "Select a test"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingTests ? (
                            <SelectItem value="" disabled>
                              Loading tests...
                            </SelectItem>
                          ) : testHistory.length === 0 ? (
                            <SelectItem value="" disabled>
                              No tests found
                            </SelectItem>
                          ) : (
                            testHistory.map((test) => (
                              <SelectItem key={test.id} value={test.id}>
                                {test.testName} - {test.subject} ({test.status})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {formErrors.testId && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.testId}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="Brief description of your issue"
                      className={formErrors.subject ? "border-red-500" : ""}
                    />
                    {formErrors.subject && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Please provide detailed information about your issue..."
                      rows={4}
                      className={formErrors.description ? "border-red-500" : ""}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  {formErrors.submit && (
                    <div className="text-red-500 text-sm">
                      {formErrors.submit}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="p-6">
          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-sm text-gray-600 mb-4">Get help via email</p>
                <p className="text-sm font-medium">support@camantraa.com</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-sm text-gray-600 mb-4">Call us directly</p>
                <p className="text-sm font-medium">+91 98765 43210</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Response Time</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We typically respond within
                </p>
                <p className="text-sm font-medium">24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="EVALUATION">Evaluation</SelectItem>
                <SelectItem value="ACCOUNT">Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tickets found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    categoryFilter !== "all"
                      ? "No tickets match your current filters."
                      : "You haven't created any support tickets yet."}
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-mono text-gray-500">
                            #{ticket.ticketId}
                          </span>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{ticket.status}</span>
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          {ticket.hasUnreadResponse && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              New Response
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mb-1">
                          {ticket.subject}
                        </CardTitle>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Admin Response Section - Show prominently if exists */}
                    {ticket.adminResponse && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-blue-800">
                                Admin Response
                              </span>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {ticket.adminResponse.respondedAt
                                  ? formatDateTime(
                                      ticket.adminResponse.respondedAt
                                    )
                                  : "Date unavailable"}
                              </Badge>
                            </div>
                            <div className="bg-white border border-blue-200 rounded p-3">
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {ticket.adminResponse.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created{" "}
                          {ticket.createdAt
                            ? formatDate(ticket.createdAt)
                            : "Date unavailable"}
                        </span>
                        <span>Category: {ticket.category}</span>
                        {ticket.testId && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Test ID: {ticket.testId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket.adminResponse && (
                          <span className="text-green-600 text-xs">
                            Response received
                          </span>
                        )}
                        {ticket.updatedAt !== ticket.createdAt && (
                          <span className="text-gray-400 text-xs">
                            Updated{" "}
                            {ticket.updatedAt
                              ? formatDate(ticket.updatedAt)
                              : "Date unavailable"}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ContactSupport;
