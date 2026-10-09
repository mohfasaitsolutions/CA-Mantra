import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBlog,
  updateBlog,
  getAdminBlog,
  type CreateBlogData,
} from "../../lib/api/blogs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import RichTextEditor from "../../components/shared/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { AlertCircle, Eye, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { ToastManager } from "../../lib/toast/toastManager";
import Sidebar from "../../components/Sidebar";
import { useAuthStore } from "../../lib/store/useAuthStore";

const BlogEditorPage: React.FC = () => {
  const { id } = useParams<{ action: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEditing = id !== "new";

  // Form state
  const [formData, setFormData] = useState<CreateBlogData>({
    title: "",
    content: "",
    excerpt: "",
    tags: "",
    category: "GENERAL",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: "FOUNDATION", label: "Foundation" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "FINAL", label: "Final" },
    { value: "GENERAL", label: "General" },
    { value: "TIPS", label: "Tips & Tricks" },
    { value: "NEWS", label: "News & Updates" },
  ];

  // Load blog data if editing
  useEffect(() => {
    if (isEditing && id) {
      const loadBlog = async () => {
        try {
          setLoading(true);
          const response = await getAdminBlog(id);
          const blog = response.data;

          setFormData({
            title: blog.title,
            content: blog.content,
            excerpt: blog.excerpt || "",
            tags: blog.tags.join(", "),
            category: blog.category,
          });
        } catch (err: unknown) {
          console.error("Error loading blog:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load blog";
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      loadBlog();
    }
  }, [isEditing, id]);

  const handleInputChange = (field: keyof CreateBlogData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      ToastManager.error("Title is required");
      return;
    }

    if (formData.title.trim().length < 5) {
      ToastManager.error("Title must be at least 5 characters long");
      return;
    }

    if (!formData.content.trim()) {
      ToastManager.error("Content is required");
      return;
    }

    // Remove HTML tags to check actual content length
    const textContent = formData.content.replace(/<[^>]*>/g, "").trim();
    if (textContent.length < 50) {
      ToastManager.error(
        "Content must be at least 50 characters long (excluding HTML tags)"
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      console.log("Form data being sent:", formData);
      console.log("Content length:", formData.content.length);
      console.log("Content preview:", formData.content.substring(0, 100));

      if (isEditing && id) {
        await updateBlog(id, formData);
        ToastManager.success("Blog updated successfully");
        navigate("/admin/blogs");
      } else {
        await createBlog(formData);
        ToastManager.success("Blog published successfully");
        navigate("/admin/blogs");
        return;
      }
    } catch (err: unknown) {
      console.error("Error saving blog:", err);

      let errorMessage = "Failed to save blog";

      // Type guard for axios error
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: {
            data?: {
              message?: string;
              errors?: Array<{ msg: string; path?: string }>;
            };
          };
        };
        console.error("Error response data:", axiosError.response?.data);
        console.error("Validation errors:", axiosError.response?.data?.errors);

        if (
          axiosError.response?.data?.errors &&
          axiosError.response.data.errors.length > 0
        ) {
          // Handle validation errors - show each error clearly
          const validationErrors = axiosError.response.data.errors
            .map((error) => error.msg)
            .join("; ");
          errorMessage = validationErrors;
          console.error("Formatted validation errors:", validationErrors);
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      ToastManager.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/blogs")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blogs
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Edit Blog" : "New Blog"}
                </h1>
                <p className="text-gray-600">
                  {isEditing
                    ? "Update your blog post"
                    : "Create a new blog post"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Eye className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : isEditing ? "Update" : "Publish"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card>
                <CardHeader>
                  <CardTitle>Blog Title</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter blog title..."
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="text-lg font-medium"
                    />
                    <div className="text-xs text-gray-500 text-right">
                      {formData.title.length}/200 characters (minimum 5
                      required)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content: string) =>
                      handleInputChange("content", content)
                    }
                    placeholder="Start writing your blog content..."
                    height="500px"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span>Use the toolbar above for rich text formatting.</span>
                    <span>
                      {formData.content.replace(/<[^>]*>/g, "").trim().length}{" "}
                      characters (minimum 50 required)
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Excerpt */}
              <Card>
                <CardHeader>
                  <CardTitle>Excerpt</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Brief summary of the blog post (optional, will be auto-generated if left empty)"
                    value={formData.excerpt}
                    onChange={(e) =>
                      handleInputChange("excerpt", e.target.value)
                    }
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Separate tags with commas"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Example: ca exam, study tips, foundation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditorPage;
