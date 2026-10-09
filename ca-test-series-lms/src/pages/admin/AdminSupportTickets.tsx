import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  User,
  Calendar,
  ArrowUpDown,
  Mail,
  Eye,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { formatDate } from "@/utils/dateUtils";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  useAdminSupportTickets,
  SupportTicketWithDetails,
} from "@/hooks/use-admin-support-tickets";

const AdminSupportTickets = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicketWithDetails | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Response form data
  const [responseData, setResponseData] = useState({
    message: "",
    status: "",
  });
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, role } = useAuth();

  const {
    tickets,
    loading,
    error,
    pagination,
    summary,
    getTicketDetails,
    respondToTicket,
    updateTicketStatus,
    refetch,
  } = useAdminSupportTickets({
    status: statusFilter,
    category: categoryFilter,
    priority: priorityFilter,
    sortBy,
    sortOrder,
    page: 1,
    pageSize: 20,
  });

  // Check authentication
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    if (role !== "ADMIN") {
      navigate("/");
      return;
    }
  }, [isLoggedIn, role, navigate]);

  const handleViewTicket = async (ticket: SupportTicketWithDetails) => {
    try {
      const details = await getTicketDetails(ticket.ticketId);
      setSelectedTicket(details);
    } catch (err) {
      console.error("Error fetching ticket details:", err);
    }
  };

  const handleRespondToTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseData.message.trim() || !selectedTicket) {
      return;
    }

    try {
      setIsSubmittingResponse(true);
      await respondToTicket(
        selectedTicket.ticketId,
        responseData.message,
        responseData.status === "keep-current"
          ? undefined
          : responseData.status || undefined
      );

      // Reset form and close dialogs
      setResponseData({ message: "", status: "" });
      setIsResponseDialogOpen(false);
      setSelectedTicket(null);
    } catch (err) {
      console.error("Error responding to ticket:", err);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      if (selectedTicket && selectedTicket.ticketId === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating ticket status:", err);
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
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.student?.fullName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (ticket.student?.email || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" />
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
      <Sidebar role="admin" />
      <MobileSidebar
        role="admin"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Ticket className="h-6 w-6" />
                Support Tickets
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and respond to student support requests
              </p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {summary.totalTickets}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.openTickets}
                </div>
                <div className="text-sm text-gray-600">Open</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.inProgressTickets}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.resolvedTickets}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {summary.closedTickets}
                </div>
                <div className="text-sm text-gray-600">Closed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {summary.urgentTickets}
                </div>
                <div className="text-sm text-gray-600">Urgent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.highPriorityTickets}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.needsAttention}
                </div>
                <div className="text-sm text-gray-600">Needs Attention</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tickets, students, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
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

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="priority-desc">Priority High</SelectItem>
                  <SelectItem value="priority-asc">Priority Low</SelectItem>
                  <SelectItem value="status-asc">Status A-Z</SelectItem>
                  <SelectItem value="status-desc">Status Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tickets found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    categoryFilter !== "all" ||
                    priorityFilter !== "all"
                      ? "No tickets match your current filters."
                      : "No support tickets have been created yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <Card
                  key={ticket._id}
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
                          <Badge variant="outline">{ticket.category}</Badge>
                          {ticket.needsAdminResponse && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Needs Response
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mb-1">
                          {ticket.subject}
                        </CardTitle>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ticket.student?.fullName || "Unknown Student"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {ticket.student?.email || "No email"}
                          </span>
                          <span>{ticket.student?.caLevel || "N/A"}</span>
                          {ticket.category === "EVALUATION" &&
                            ticket.testId && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {ticket.testSeries
                                  ? `Test: ${ticket.testSeries.title}`
                                  : `Test ID: ${ticket.testId}`}
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {ticket.needsAdminResponse && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsResponseDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Respond
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created{" "}
                          {ticket.createdAt
                            ? formatDate(ticket.createdAt)
                            : "Date unavailable"}
                        </span>
                        {ticket.updatedAt !== ticket.createdAt && (
                          <span>
                            Updated{" "}
                            {ticket.updatedAt
                              ? formatDate(ticket.updatedAt)
                              : "Date unavailable"}
                          </span>
                        )}
                      </div>
                      {ticket.adminResponse && (
                        <span className="text-green-600">
                          Responded{" "}
                          {ticket.adminResponse.respondedAt
                            ? formatDate(
                                ticket.adminResponse.respondedAt
                              )
                            : "Date unavailable"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Ticket Details Dialog */}
          {selectedTicket && !isResponseDialogOpen && (
            <Dialog
              open={!!selectedTicket}
              onOpenChange={() => setSelectedTicket(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Ticket #{selectedTicket.ticketId}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {getStatusIcon(selectedTicket.status)}
                      <span className="ml-1">{selectedTicket.status}</span>
                    </Badge>
                    <Badge
                      className={getPriorityColor(selectedTicket.priority)}
                    >
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline">{selectedTicket.category}</Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedTicket.subject}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Student Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>{" "}
                        {selectedTicket.student?.fullName || "Unknown Student"}
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>{" "}
                        {selectedTicket.student?.email || "No email"}
                      </div>
                      <div>
                        <span className="text-gray-500">CA Level:</span>{" "}
                        {selectedTicket.student?.caLevel || "N/A"}
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>{" "}
                        {selectedTicket.createdAt
                          ? new Date(selectedTicket.createdAt).toLocaleString()
                          : "Date unavailable"}
                      </div>
                      {selectedTicket.category === "EVALUATION" &&
                        selectedTicket.testId && (
                          <>
                            <div>
                              <span className="text-gray-500">Test ID:</span>{" "}
                              {selectedTicket.testId}
                            </div>
                            {selectedTicket.testSeries && (
                              <>
                                <div>
                                  <span className="text-gray-500">
                                    Test Title:
                                  </span>{" "}
                                  {selectedTicket.testSeries.title}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Subject:
                                  </span>{" "}
                                  {selectedTicket.testSeries.subject}
                                </div>
                              </>
                            )}
                          </>
                        )}
                    </div>
                  </div>

                  {selectedTicket.adminResponse && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Admin Response</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedTicket.adminResponse.message}
                        </p>
                        <div className="text-sm text-gray-500 mt-2">
                          Responded by{" "}
                          {selectedTicket.adminResponse.respondedBy?.fullName ||
                            "Admin"}{" "}
                          on{" "}
                          {selectedTicket.adminResponse.respondedAt
                            ? new Date(
                                selectedTicket.adminResponse.respondedAt
                              ).toLocaleString()
                            : "Date unavailable"}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsResponseDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {selectedTicket.adminResponse
                        ? "Update Response"
                        : "Respond"}
                    </Button>

                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) =>
                        handleStatusUpdate(selectedTicket.ticketId, value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Response Dialog */}
          <Dialog
            open={isResponseDialogOpen}
            onOpenChange={setIsResponseDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Respond to Ticket #{selectedTicket?.ticketId}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRespondToTicket} className="space-y-4">
                <div>
                  <Label htmlFor="response">Response Message</Label>
                  <Textarea
                    id="response"
                    value={responseData.message}
                    onChange={(e) =>
                      setResponseData({
                        ...responseData,
                        message: e.target.value,
                      })
                    }
                    placeholder="Type your response to the student..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Update Status (Optional)</Label>
                  <Select
                    value={responseData.status}
                    onValueChange={(value) =>
                      setResponseData({ ...responseData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-current">
                        Keep current status
                      </SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsResponseDialogOpen(false)}
                    disabled={isSubmittingResponse}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingResponse}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmittingResponse ? "Sending..." : "Send Response"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

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

export default AdminSupportTickets;
