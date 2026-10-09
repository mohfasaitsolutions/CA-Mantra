import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Trash2,
  Pencil,
  Search,
  ToggleLeft,
  ToggleRight,
  Menu,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { formatDate } from "@/utils/dateUtils";
import { Badge } from "@/components/ui/badge";
import {
  useTestSeries,
  useTestSeriesManagement,
} from "@/hooks/use-test-series";
import { TestSeriesResponse } from "@/lib/api/testSeries";

const TestSeriesManagement = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [caLevelFilter, setCaLevelFilter] = useState<
    "FOUNDATION" | "INTERMEDIATE" | "FINAL" | ""
  >("");

  const navigate = useNavigate();

  // Use the hooks for API integration
  const {
    testSeries,
    pagination,
    isLoading: fetchLoading,
    fetchTestSeries,
  } = useTestSeries();
  const {
    deleteTestSeries,
    updateTestSeries,
    publishTestSeries,
    isLoading: actionLoading,
  } = useTestSeriesManagement();

  // Memoize the fetch function to prevent endless calls
  const memoizedFetchTestSeries = useCallback(
    (params?: {
      page?: number;
      limit?: number;
      caLevel?: "FOUNDATION" | "INTERMEDIATE" | "FINAL" | "ALL";
      search?: string;
    }) => {
      fetchTestSeries(params, true);
    },
    [fetchTestSeries]
  );

  // Fetch test series on component mount and when filters change
  useEffect(() => {
    if (!searchQuery) {
      memoizedFetchTestSeries({
        page: currentPage,
        limit: 10,
        caLevel: caLevelFilter || undefined,
        search: undefined,
      });
    }
  }, [currentPage, caLevelFilter, memoizedFetchTestSeries, searchQuery]);

  // Debounce search query
  useEffect(() => {
    if (!searchQuery) return;

    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      memoizedFetchTestSeries({
        page: 1,
        limit: 10,
        caLevel: caLevelFilter || undefined,
        search: searchQuery,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, caLevelFilter, memoizedFetchTestSeries]);

  const handleDelete = async (id: string) => {
    console.log("Deleting test series with ID:", id);
    if (!id || id === "undefined") {
      console.error("Invalid ID provided for deletion:", id);
      return;
    }

    const success = await deleteTestSeries(id);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedTest(null);
      // Refresh the list
      fetchTestSeries({
        page: currentPage,
        limit: 10,
        caLevel: caLevelFilter || undefined,
        search: searchQuery || undefined,
      }, true);
    }
  };

  const toggleTestStatus = async (id: string, currentStatus: boolean) => {
    const success = await updateTestSeries(id, { isActive: !currentStatus });
    if (success) {
      // Refresh the list
      fetchTestSeries({
        page: currentPage,
        limit: 10,
        caLevel: caLevelFilter || undefined,
        search: searchQuery || undefined,
      }, true);
    }
  };

  const handlePublish = async (id: string) => {
    const success = await publishTestSeries(id);
    if (success) {
      fetchTestSeries({
        page: currentPage,
        limit: 10,
        caLevel: caLevelFilter || undefined,
        search: searchQuery || undefined,
      }, true);
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
                Test Series Management
              </h1>
            </div>
            <Button onClick={() => navigate("/admin/tests/create")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Test Series
            </Button>
          </div>
        </header>

        <main className="p-6">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search test series..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={caLevelFilter}
                    onChange={(e) =>
                      setCaLevelFilter(
                        e.target.value as
                        | "FOUNDATION"
                        | "INTERMEDIATE"
                        | "FINAL"
                        | ""
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Levels</option>
                    <option value="FOUNDATION">Foundation</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {fetchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading test series...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Price (₹)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testSeries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No test series found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        testSeries.map((test: TestSeriesResponse) => {
                          // Debug: Log the test object structure
                          console.log("Test object:", test);

                          return (
                            <TableRow key={test.id}>
                              <TableCell className="font-medium">
                                {test.title}
                              </TableCell>
                              <TableCell>
                                {test.caLevel === "FOUNDATION"
                                  ? "Foundation"
                                  : test.caLevel === "INTERMEDIATE"
                                    ? "Intermediate"
                                    : test.caLevel === "FINAL"
                                      ? "Final"
                                      : test.caLevel}
                              </TableCell>
                              <TableCell>₹{test.price}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant={test.status === "PUBLISHED" ? "default" : "outline"}>
                                    {test.status === "PUBLISHED" ? "Published" : "Draft"}
                                  </Badge>
                                  <Badge variant={test.isActive ? "secondary" : "destructive"}>
                                    {test.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {test.createdAt ? formatDate(test.createdAt) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePublish(String(test.id))}
                                    disabled={actionLoading || test.status === "PUBLISHED"}
                                    title="Publish test series"
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    {test.status === "PUBLISHED" ? "Published" : "Publish"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      toggleTestStatus(String(test.id), test.isActive)
                                    }
                                    title={
                                      test.isActive ? "Deactivate" : "Activate"
                                    }
                                    disabled={actionLoading}
                                  >
                                    {test.isActive ? (
                                      <ToggleRight className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <ToggleLeft className="h-4 w-4 text-gray-500" />
                                    )}
                                  </Button>
                                  <Dialog
                                    open={
                                      deleteDialogOpen &&
                                      selectedTest === test.id
                                    }
                                    onOpenChange={(open) => {
                                      setDeleteDialogOpen(open);
                                      if (!open) setSelectedTest(null);
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          console.log(
                                            "Setting selected test for deletion:",
                                            test.id
                                          );
                                          setSelectedTest(String(test.id));
                                          setDeleteDialogOpen(true);
                                        }}
                                        disabled={actionLoading}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                        <span className="sr-only">Delete</span>
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Confirm Deletion
                                        </DialogTitle>
                                      </DialogHeader>
                                      <p>
                                        Are you sure you want to delete "
                                        {test.title}"? This action cannot be
                                        undone.
                                      </p>
                                      <DialogFooter>
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setDeleteDialogOpen(false);
                                            setSelectedTest(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => {
                                            // Use the explicit id from this row to avoid undefined
                                            console.log(
                                              "Deleting test series (row id):",
                                              test.id
                                            );
                                            handleDelete(String(test.id));
                                          }}
                                          disabled={actionLoading}
                                        >
                                          {actionLoading
                                            ? "Deleting..."
                                            : "Delete"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      navigate(`/admin/tests/edit/${test.id}`)
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">
                                      Edit Test Series
                                    </span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Pagination */}
              {!fetchLoading && testSeries.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <div className="text-sm text-gray-500 text-center sm:text-left">
                    Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
                    of {pagination.total} entries
                  </div>
                  <div className="flex items-center gap-2">
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
                    <span className="text-sm">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, pagination.totalPages)
                        )
                      }
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default TestSeriesManagement;
