import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Upload,
  Book,
  GraduationCap,
  BookOpen,
  Target,
} from "lucide-react";
import { SUBJECTS_BY_LEVEL } from "@/constants/subjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/utils/dateUtils";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  useStudyMaterialsManagement,
  StudyMaterial,
  StudyMaterialCreateData,
} from "@/hooks/use-study-materials-management";

const StudyMaterialManagement = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<StudyMaterial | null>(null);

  // Filters state
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  // const [sortBy, setSortBy] = useState("createdAt");
  // const [sortOrder, setSortOrder] = useState("desc");

  // Form state
  const [formData, setFormData] = useState<Partial<StudyMaterialCreateData>>({
    title: "",
    description: "",
    category: "NOTES",
    caLevel: "ALL_LEVELS",
    subject: "Combo",
    type: "FREE",
    price: 0,
    discountPrice: 0,
    tags: [],
    featured: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const navigate = useNavigate();
  const { isLoggedIn, role } = useAuth();

  const filters = useMemo(
    () => ({
      type: typeFilter === "all" ? undefined : typeFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      subject: subjectFilter === "all" ? undefined : subjectFilter,
      caLevel: levelFilter === "all" ? undefined : levelFilter,
      isActive: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      pageSize: 20,
    }),
    [
      typeFilter,
      categoryFilter,
      subjectFilter,
      levelFilter,
      statusFilter,
      searchQuery,
    ]
  );

  const {
    materials,
    pagination,
    summary,
    analytics,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleMaterialStatus,
    fetchAnalytics,
    refetch,
  } = useStudyMaterialsManagement();

  // Fetch materials when filters change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, refetch]);

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

  // Fetch analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim();
      const currentTags = formData.tags || [];
      if (!currentTags.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...currentTags, newTag],
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== indexToRemove) || [],
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/zip",
        "application/x-rar-compressed",
      ];

      const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".txt",
        ".zip",
        ".rar",
      ];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      if (
        !allowedTypes.includes(file.type) &&
        !allowedExtensions.includes(fileExtension)
      ) {
        alert(
          "Please select a valid document file (PDF, DOC, DOCX, TXT, ZIP, RAR)"
        );
        event.target.value = ""; // Clear the input
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(
          `File size (${(file.size / (1024 * 1024)).toFixed(
            1
          )}MB) exceeds 20MB limit. Please upload a smaller file.`
        );
        event.target.value = ""; // Clear the input
        return;
      }

      setSelectedFile(file);
      console.log(
        "File selected:",
        file.name,
        "Size:",
        (file.size / (1024 * 1024)).toFixed(1) + " MB"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      (!selectedFile && !isEditDialogOpen)
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.type === "PAID" && (!formData.price || formData.price <= 0)) {
      alert("Please set a valid price for paid materials");
      return;
    }

    try {
      setIsSubmitting(true);

      // Mock file upload (in real app, upload file to cloud storage first)
      let fileInfo = formData.fileInfo;
      if (selectedFile) {
        fileInfo = {
          originalName: selectedFile.name,
          filename: `${Date.now()}-${selectedFile.name}`,
          mimetype: selectedFile.type,
          size: selectedFile.size,
          url: `/uploads/${Date.now()}-${selectedFile.name}`, // Mock URL
        };
      }

      const materialData: StudyMaterialCreateData = {
        ...(formData as StudyMaterialCreateData),
        fileInfo: fileInfo!,
      };

      if (isEditDialogOpen && selectedMaterial) {
        await updateMaterial(selectedMaterial._id, materialData);
      } else {
        await createMaterial(materialData);
      }

      // Refresh the list
      refetch(filters);

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "NOTES",
        caLevel: "ALL_LEVELS",
        subject: "Combo",
        type: "FREE",
        price: 0,
        discountPrice: 0,
        tags: [],
        featured: false,
      });
      setSelectedFile(null);
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedMaterial(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (material: StudyMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      category: material.category,
      caLevel: material.caLevel,
      subject: material.subject,
      type: material.type,
      price: material.price,
      discountPrice: material.discountPrice,
      tags: material.tags,
      featured: material.featured,
      fileInfo: material.fileInfo,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await deleteMaterial(id);
        // Force immediate refetch
        await refetch(filters);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete material");
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleMaterialStatus(id);
      // Force immediate refetch
      await refetch(filters);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "PAID" ? (
      <DollarSign className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );
  };

  const getTypeColor = (type: string) => {
    return type === "PAID"
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "NOTES":
        return <BookOpen className="h-4 w-4" />;
      case "PRACTICE_PAPERS":
        return <FileText className="h-4 w-4" />;
      case "REFERENCE_BOOKS":
        return <Book className="h-4 w-4" />;
      case "VIDEO_LECTURES":
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading study materials...</p>
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
                <GraduationCap className="h-6 w-6" />
                Study Materials Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage free and paid study materials for students
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        </header>

        <main className="p-6">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.totalMaterials}
                  </div>
                  <div className="text-sm text-gray-600">Total Materials</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.freeMaterials}
                  </div>
                  <div className="text-sm text-gray-600">Free Materials</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {summary.paidMaterials}
                  </div>
                  <div className="text-sm text-gray-600">Paid Materials</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {summary.activeMaterials}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.inactiveMaterials}
                  </div>
                  <div className="text-sm text-gray-600">Inactive</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{analytics.revenue.total.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600">
                    {analytics.revenue.totalPurchases} purchases • ₹
                    {Math.round(analytics.revenue.averageOrderValue)} avg
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Top Downloaded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {analytics.topDownloaded.slice(0, 3).map((material) => (
                      <div
                        key={material._id}
                        className="flex justify-between text-xs"
                      >
                        <span className="truncate">{material.title}</span>
                        <span className="text-gray-500">
                          {material.downloadCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {analytics.distribution.categories
                      .slice(0, 3)
                      .map((cat) => (
                        <div
                          key={cat._id}
                          className="flex justify-between text-xs"
                        >
                          <span>{cat._id}</span>
                          <span className="text-gray-500">{cat.count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="NOTES">Notes</SelectItem>
                  <SelectItem value="PRACTICE_PAPERS">
                    Practice Papers
                  </SelectItem>
                  <SelectItem value="REFERENCE_BOOKS">
                    Reference Books
                  </SelectItem>
                  <SelectItem value="VIDEO_LECTURES">Video Lectures</SelectItem>
                  <SelectItem value="FORMULA_SHEETS">Formula Sheets</SelectItem>
                  <SelectItem value="CASE_STUDIES">Case Studies</SelectItem>
                  <SelectItem value="MOCK_TESTS">Mock Tests</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="ACCOUNTING">Accounting</SelectItem>
                  <SelectItem value="BUSINESS_LAW">Business Law</SelectItem>
                  <SelectItem value="ECONOMICS">Economics</SelectItem>
                  <SelectItem value="MATHEMATICS">Mathematics</SelectItem>
                  <SelectItem value="BUSINESS_STUDIES">
                    Business Studies
                  </SelectItem>
                  <SelectItem value="ENGLISH">English</SelectItem>
                  <SelectItem value="GENERAL_KNOWLEDGE">
                    General Knowledge
                  </SelectItem>
                  <SelectItem value="ALL_SUBJECTS">All Subjects</SelectItem>
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="FOUNDATION">Foundation</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
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

          {/* Materials List */}
          <div className="space-y-4">
            {materials.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No materials found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery ||
                      typeFilter !== "all" ||
                      categoryFilter !== "all"
                      ? "No materials match your current filters."
                      : "No study materials have been created yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              materials.map((material) => (
                <Card
                  key={material._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(material.type)}>
                            {getTypeIcon(material.type)}
                            <span className="ml-1">{material.type}</span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {getCategoryIcon(material.category)}
                            {material.category}
                          </Badge>
                          <Badge variant="secondary">{material.subject}</Badge>
                          <Badge variant="secondary">{material.caLevel}</Badge>
                          {material.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {!material.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-2">
                          {material.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {material.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span>Size: {material.readableFileSize}</span>
                          <span>Downloads: {material.downloadCount}</span>
                          {material.type === "PAID" && (
                            <>
                              <span>Purchases: {material.purchaseCount}</span>
                              <span className="font-medium text-green-600">
                                ₹{material.effectivePrice}
                                {material.discountPercentage > 0 && (
                                  <span className="ml-1 line-through text-gray-400">
                                    ₹{material.price}
                                  </span>
                                )}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>By {material.uploadedBy.fullName}</span>
                          <span>•</span>
                          <span>
                            {formatDate(material.createdAt)}
                          </span>
                          {material.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Tags: {material.tags.join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(material._id)}
                        >
                          {material.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(material._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create/Edit Material Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedMaterial(null);
            setSelectedFile(null);
            setFormData({
              title: "",
              description: "",
              category: "NOTES",
              caLevel: "ALL_LEVELS",
              subject: "Combo",
              type: "FREE",
              price: 0,
              discountPrice: 0,
              tags: [],
              featured: false,
            });
          }
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen
                ? "Edit Study Material"
                : "Create New Study Material"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-4">
              {isEditDialogOpen
                ? "Update the details of the study material below."
                : "Fill in the details to create a new study material."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter material title"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Provide a detailed description"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTES">Notes</SelectItem>
                    <SelectItem value="PRACTICE_PAPERS">
                      Practice Papers
                    </SelectItem>
                    <SelectItem value="REFERENCE_BOOKS">
                      Reference Books
                    </SelectItem>
                    <SelectItem value="VIDEO_LECTURES">
                      Video Lectures
                    </SelectItem>
                    <SelectItem value="FORMULA_SHEETS">
                      Formula Sheets
                    </SelectItem>
                    <SelectItem value="CASE_STUDIES">Case Studies</SelectItem>
                    <SelectItem value="MOCK_TESTS">Mock Tests</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="caLevel">CA Level *</Label>
                <Select
                  value={formData.caLevel}
                  onValueChange={(value) => {
                    // Reset subject to first available when level changes
                    const availableSubjects = value === "ALL_LEVELS"
                      ? SUBJECTS_BY_LEVEL.ALL
                      : SUBJECTS_BY_LEVEL[value as keyof typeof SUBJECTS_BY_LEVEL];
                    setFormData({
                      ...formData,
                      caLevel: value,
                      subject: availableSubjects[0] || "Combo"
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
                    <SelectItem value="FOUNDATION">Foundation</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.caLevel === "ALL_LEVELS"
                      ? SUBJECTS_BY_LEVEL.ALL
                      : SUBJECTS_BY_LEVEL[formData.caLevel as keyof typeof SUBJECTS_BY_LEVEL] || SUBJECTS_BY_LEVEL.ALL
                    ).map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter tag and press Enter"
                    onKeyDown={(e) => {
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
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, featured: checked as boolean })
                    }
                  />
                  <Label htmlFor="featured">Mark as featured</Label>
                </div>
              </div>

              {!isEditDialogOpen && (
                <div className="col-span-2">
                  <Label htmlFor="file">File *</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById("file")?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          ✓ {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">
                          Click to upload study material file
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, TXT (max 20MB)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                    <input
                      id="file"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditDialogOpen
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyMaterialManagement;
