import React, { useState, useEffect } from "react";
import {
  Menu,
  File,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/utils";
import { formatDate } from "@/utils/dateUtils";
import {
  useScheduleManagement,
  Schedule,
} from "@/hooks/use-schedule-management";

const ManageSchedule = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("all");
  const [examSessionFilter, setExamSessionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    examType: "ALL",
    examSession: "May",
    examYear: new Date().getFullYear(),
    tags: [] as string[],
    priority: 0,
    file: null as File | null,
  });
  const [tagInput, setTagInput] = useState("");

  const { toast } = useToast();

  const {
    schedules,
    pagination,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useScheduleManagement();

  // Fetch schedules on component mount and when filters change
  useEffect(() => {
    const filters = {
      search: searchQuery || undefined,
      examType: examTypeFilter === "all" ? undefined : examTypeFilter,
      examSession: examSessionFilter === "all" ? undefined : examSessionFilter,
      page: currentPage,
      pageSize: 10,
    };
    fetchSchedules(filters);
  }, [
    searchQuery,
    examTypeFilter,
    examSessionFilter,
    currentPage,
    fetchSchedules,
  ]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      examType: "ALL",
      examSession: "May",
      examYear: new Date().getFullYear(),
      tags: [],
      priority: 0,
      file: null,
    });
    setTagInput("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "application/pdf") {
        setFormData((prev) => ({ ...prev, file }));
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
        });
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleCreate = async () => {
    try {
      if (!formData.title.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Title is required.",
        });
        return;
      }

      if (!formData.file) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Schedule file is required.",
        });
        return;
      }

      await createSchedule({
        title: formData.title.trim(),
        description: formData.description.trim(),
        examType: formData.examType,
        examSession: formData.examSession,
        examYear: formData.examYear,
        tags: formData.tags,
        priority: formData.priority,
        file: formData.file,
      });

      toast({
        title: "Success",
        description: "Schedule created successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || (error instanceof Error ? error.message : "Failed to create schedule"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      title: schedule.title,
      description: schedule.description || "",
      examType: schedule.examType,
      examSession: schedule.examSession,
      examYear: schedule.examYear,
      tags: schedule.tags || [],
      priority: schedule.priority || 0,
      file: null, // File not needed for updates
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedSchedule) return;

      if (!formData.title.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Title is required.",
        });
        return;
      }

      await updateSchedule(selectedSchedule.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        examType: formData.examType,
        examSession: formData.examSession,
        examYear: formData.examYear,
        tags: formData.tags,
        priority: formData.priority,
      });

      toast({
        title: "Success",
        description: "Schedule updated successfully.",
      });

      setIsEditDialogOpen(false);
      setSelectedSchedule(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || (error instanceof Error ? error.message : "Failed to update schedule"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    if (
      window.confirm(`Are you sure you want to delete "${schedule.title}"?`)
    ) {
      try {
        await deleteSchedule(schedule.id);
        toast({
          title: "Success",
          description: "Schedule deleted successfully.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete schedule",
        });
      }
    }
  };

  const handleDownload = (schedule: Schedule) => {
    window.open(
      `${getApiBaseUrl()}/schedules/${schedule.id}/download`,
      "_blank"
    );
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case "FOUNDATION":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-primary/10 text-primary";
      case "FINAL":
        return "bg-accent/10 text-accent";
      case "ALL":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionColor = (session: string) => {
    switch (session) {
      case "Jan":
        return "bg-blue-100 text-blue-800";
      case "May":
        return "bg-orange-100 text-orange-800";
      case "September":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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
                Manage Schedules
              </h1>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Search schedules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Exam Type</Label>
                  <Select
                    value={examTypeFilter}
                    onValueChange={setExamTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="FOUNDATION">Foundation</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="FINAL">Final</SelectItem>
                      <SelectItem value="ALL">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Session</Label>
                  <Select
                    value={examSessionFilter}
                    onValueChange={setExamSessionFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="January">January</SelectItem>
                      <SelectItem value="May">May</SelectItem>
                      <SelectItem value="September">September</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSchedules()}
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedules List */}
          {loading && schedules.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading schedules...</p>
                </div>
              </CardContent>
            </Card>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No schedules found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get started by creating your first schedule.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={getExamTypeColor(schedule.examType)}
                          >
                            {schedule.examType}
                          </Badge>
                          <Badge
                            className={getSessionColor(schedule.examSession)}
                          >
                            {schedule.examSession} {schedule.examYear}
                          </Badge>
                          <Badge
                            variant={
                              schedule.isActive ? "default" : "secondary"
                            }
                          >
                            {schedule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-semibold mb-1">
                          {schedule.title}
                        </h3>
                        {schedule.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {schedule.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <File className="h-3 w-3" />
                            {schedule.fileName}
                          </span>
                          <span>{schedule.readableFileSize}</span>
                          <span>Downloaded {schedule.downloadCount} times</span>
                          <span>
                            Created:{" "}
                            {formatDate(schedule.createdAt)}
                          </span>
                        </div>

                        {schedule.tags && schedule.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {schedule.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Uploaded by: {schedule.uploadedBy.fullName} (
                          {schedule.uploadedBy.email})
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(schedule)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(schedule)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setCurrentPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Schedule Dialog */}
      {/* Create Schedule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Upload a new exam schedule for students to download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter schedule title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter schedule description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Type</Label>
                <Select
                  value={formData.examType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, examType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="FOUNDATION">Foundation</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Session</Label>
                <Select
                  value={formData.examSession}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, examSession: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jan">Jan</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Year</Label>
              <Input
                type="number"
                value={formData.examYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    examYear: parseInt(e.target.value),
                  }))
                }
                min={2020}
                max={2030}
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter tag and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="file">Schedule File (PDF) *</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              {formData.file && (
                <div className="flex items-center p-2 border rounded-md bg-gray-50 mt-2">
                  <File className="h-5 w-5 mr-3 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {formData.file.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update the schedule information. File cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter schedule title"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter schedule description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Type</Label>
                <Select
                  value={formData.examType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, examType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="FOUNDATION">Foundation</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Session</Label>
                <Select
                  value={formData.examSession}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, examSession: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jan">Jan</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Year</Label>
              <Input
                type="number"
                value={formData.examYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    examYear: parseInt(e.target.value),
                  }))
                }
                min={2020}
                max={2030}
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter tag and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageSchedule;
