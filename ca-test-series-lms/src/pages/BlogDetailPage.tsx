import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBlog, toggleBlogLike, type Blog } from "../lib/api/blogs";
import { useAuthStore } from "../lib/store/useAuthStore";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  User,
  Heart,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ToastManager } from "../lib/toast/toastManager";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatDateWithMonthName } from "@/utils/dateUtils";

const BlogDetailPage: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!slugOrId) {
      setError("Blog not found");
      setLoading(false);
      return;
    }

    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getBlog(slugOrId);
        setBlog(response.data);

        // Check if current user has liked this blog
        if (isAuthenticated && user && response.data.likes.includes(user.id)) {
          setIsLiked(true);
        }
      } catch (err: unknown) {
        console.error("Error fetching blog:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch blog";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slugOrId, isAuthenticated, user]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      ToastManager.error("Please login to like blogs");
      return;
    }

    if (!blog) return;

    try {
      setLiking(true);
      const response = await toggleBlogLike(blog._id);

      setIsLiked(response.data.isLiked);
      setBlog((prev: Blog | null) =>
        prev
          ? {
              ...prev,
              likeCount: response.data.likeCount,
              likes: response.data.isLiked
                ? [...prev.likes, user!.id]
                : prev.likes.filter((id: string) => id !== user!.id),
            }
          : null
      );

      ToastManager.success(response.message);
    } catch (err: unknown) {
      console.error("Error toggling like:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update like";
      ToastManager.error(errorMessage);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        ToastManager.success("Link copied to clipboard!");
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      ToastManager.success("Link copied to clipboard!");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Blog not found"}</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => navigate("/blogs")}
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => navigate("/blogs")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Button>

          {/* Blog Header */}
          <article className="space-y-6">
            {/* Title and Meta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <Badge className={getCategoryColor(blog.category)}>
                  {blog.category}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDateWithMonthName(blog.publishedAt || blog.createdAt)}
                  </div>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {blog.title}
              </h1>

              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {blog.author.profilePictureUrl ? (
                    <img
                      src={`${
                        import.meta.env.VITE_API_BASE?.replace("/api", "") ||
                        "http://localhost:3000"
                      }/uploads${blog.author.profilePictureUrl}`}
                      alt={blog.title}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">CA Mantraa</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    disabled={liking}
                    className={`${
                      isLiked ? "text-red-600 border-red-300" : ""
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 mr-1 ${
                        isLiked ? "fill-current" : ""
                      }`}
                    />
                    {blog.likeCount}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>

            {/* Footer Actions */}
            <div className="border-t pt-6 mt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleLike}
                    disabled={liking}
                    className={`${
                      isLiked ? "text-red-600 border-red-300" : ""
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${
                        isLiked ? "fill-current" : ""
                      }`}
                    />
                    {isLiked ? "Liked" : "Like"} ({blog.likeCount})
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
