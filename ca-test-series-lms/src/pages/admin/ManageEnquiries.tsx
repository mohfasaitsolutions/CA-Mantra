import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getApiBaseUrl } from "@/lib/utils";
import {
  Search,
  Eye,
  MessageCircle,
  RefreshCw,
  Trash2,
  Menu,
} from "lucide-react";
import { formatDateTime } from "@/utils/dateUtils";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";

interface Contact {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  message: string;
  subject?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  totalEnquiries: number;
}

const ManageEnquiries = () => {
  const { token } = useAuth();
  const [enquiries, setEnquiries] = useState<Contact[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalEnquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "10",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(
        `${getApiBaseUrl()}/admin/enquiries?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEnquiries(data.enquiries);
        setStatistics(data.statistics);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch enquiries",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching enquiries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, token]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleDeleteEnquiry = async (enquiryId: string) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) {
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/admin/enquiries/${enquiryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Enquiry deleted successfully",
        });
        fetchEnquiries();
        setSelectedEnquiry(null);
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to delete enquiry",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while deleting enquiry",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEnquiries();
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
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-2xl font-bold">Manage Enquiries</h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mt-2">
              View and manage customer enquiries
            </p>
          </div>

          {/* Statistics Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Enquiries
                </CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalEnquiries}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Enquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, mobile, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} variant="outline">
                  Search
                </Button>
                <Button
                  onClick={fetchEnquiries}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enquiries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Enquiries</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : enquiries.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No enquiries found
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enquiry) => (
                    <div
                      key={enquiry.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {enquiry.fullName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {enquiry.email} • {enquiry.mobile}
                          </p>
                          {enquiry.subject && (
                            <p className="text-sm font-medium text-gray-800 mt-1">
                              Subject: {enquiry.subject}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            {enquiry.source}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {enquiry.message}
                      </p>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Created:{" "}
                          {formatDateTime(enquiry.createdAt)}
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedEnquiry(enquiry)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Enquiry Details - {selectedEnquiry?.fullName}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedEnquiry && (
                                <div className="space-y-6">
                                  {/* Contact Information */}
                                  <div>
                                    <h4 className="font-semibold mb-3">
                                      Contact Information
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 text-sm">
                                      <div className="flex justify-between">
                                        <strong>Name:</strong>
                                        <span>{selectedEnquiry.fullName}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <strong>Email:</strong>
                                        <span>{selectedEnquiry.email}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <strong>Mobile:</strong>
                                        <span>{selectedEnquiry.mobile}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <strong>Subject:</strong>
                                        <span>
                                          {selectedEnquiry.subject || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <strong>Source:</strong>
                                        <span>{selectedEnquiry.source}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <strong>Submitted:</strong>
                                        <span>
                                          {formatDateTime(
                                            selectedEnquiry.createdAt
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Message */}
                                  <div>
                                    <h4 className="font-semibold mb-3">
                                      Message
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <p className="text-sm whitespace-pre-wrap">
                                        {selectedEnquiry.message}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteEnquiry(selectedEnquiry.id)
                                      }
                                      className="flex items-center gap-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete Enquiry
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteEnquiry(enquiry.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ManageEnquiries;
