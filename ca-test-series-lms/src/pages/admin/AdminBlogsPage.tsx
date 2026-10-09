import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAdminBlogs,
  deleteBlog,
  type Blog,
  type BlogFilters,
} from "../../lib/api/blogs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { formatDateWithMonthName } from "@/utils/dateUtils";
import {
  AlertCircle,
  Search,
  Calendar,
  User,
  Eye,
  Heart,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ToastManager } from "../../lib/toast/toastManager";
import Sidebar from "../../components/Sidebar";
import { useAuthStore } from "../../lib/store/useAuthStore";

const AdminBlogsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );

  const currentPage = parseInt(searchParams.get("page") || "1");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "FOUNDATION", label: "Foundation" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "FINAL", label: "Final" },
    { value: "GENERAL", label: "General" },
    { value: "TIPS", label: "Tips & Tricks" },
    { value: "NEWS", label: "News & Updates" },
  ];

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: BlogFilters = {
        page: currentPage,
        limit: 12,
      };

      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory && selectedCategory !== "all")
        filters.category = selectedCategory;

      const response = await getAdminBlogs(filters);
      setBlogs(response.data.blogs);
      setPagination(response.data.pagination);
    } catch (err: unknown) {
      console.error("Error fetching blogs:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch blogs";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory && selectedCategory !== "all")
      params.set("category", selectedCategory);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handleEdit = (blog: Blog) => {
    navigate(`/admin/blogs/edit/${blog._id}`);
  };

  const handleDelete = async (blog: Blog) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      return;
    }

    try {
      setDeleting(blog._id);
      await deleteBlog(blog._id);
      ToastManager.success("Blog deleted successfully");

      // Remove from local state
      setBlogs((prev) => prev.filter((b) => b._id !== blog._id));

      // If this was the last blog on the page, go to previous page
      if (blogs.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else {
        fetchBlogs();
      }
    } catch (err: unknown) {
      console.error("Error deleting blog:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete blog";
      ToastManager.error(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: "bg-yellow-100 text-yellow-800",
      PUBLISHED: "bg-green-100 text-green-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      FOUNDATION: "bg-green-100 text-green-800",
      INTERMEDIATE: "bg-blue-100 text-blue-800",
      FINAL: "bg-purple-100 text-purple-800",
      GENERAL: "bg-gray-100 text-gray-800",
      TIPS: "bg-yellow-100 text-yellow-800",
      NEWS: "bg-red-100 text-red-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-80">
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only administrators can manage blogs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Blog Management
              </h1>
              <p className="text-gray-600">
                Manage your blog posts and articles
              </p>
            </div>
            <Button onClick={() => navigate("/admin/blogs/edit/new")}>
              <Plus className="w-4 h-4 mr-2" />
              New Blog
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="w-32">
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Blogs Grid */}
          {blogs.length === 0 && !loading ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No blogs found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or create a new blog.
              </p>
              <Button onClick={() => navigate("/admin/blogs/edit/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Blog
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <Card
                    key={blog._id}
                    className="hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(blog.status)}>
                            {blog.status}
                          </Badge>
                          <Badge className={getCategoryColor(blog.category)}>
                            {blog.category}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(blog)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(blog)}
                              disabled={deleting === blog._id}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deleting === blog._id ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {blog.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>

                      {/* Meta Info */}
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {blog.author.fullName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDateWithMonthName(blog.createdAt)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {blog.viewCount}
                            </div>
                            <div className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {blog.likeCount}
                            </div>
                          </div>
                          {blog.publishedAt && (
                            <div className="text-xs text-green-600">
                              Published {formatDateWithMonthName(blog.publishedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(blog)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {blog.status === "PUBLISHED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/blogs/${blog.slug}`)}
                            className="flex-1"
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      const page =
                        Math.max(
                          1,
                          Math.min(pagination.pages - 4, currentPage - 2)
                        ) + i;
                      if (page > pagination.pages) return null;

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    }
                  )}

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogsPage;
