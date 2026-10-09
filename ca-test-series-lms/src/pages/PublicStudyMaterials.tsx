import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Download,
  Star,
  Filter,
  Search,
  Grid,
  List,
  Lock,
  Tag,
  FileText,
  Video,
  BookMarked,
  GraduationCap,
  Heart,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import {
  usePublicStudyMaterials,
  PublicStudyMaterial,
} from "@/hooks/use-public-study-materials";
import {
  BADGE_COLORS,
  TEXT_COLORS,
  GRADIENT_COLORS,
} from "@/constants/colors";

const PublicStudyMaterials = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<"all" | "FREE" | "PAID">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const { isLoggedIn, token } = useAuth();

  const filters = useMemo(
    () => ({
      type: typeFilter === "all" ? undefined : typeFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      subject: subjectFilter === "all" ? undefined : subjectFilter,
      caLevel: levelFilter === "all" ? undefined : levelFilter,
      search: searchQuery || undefined,
      featured: showFeaturedOnly || undefined,
      sortBy,
      sortOrder,
      page: currentPage,
      pageSize: 12,
    }),
    [
      typeFilter,
      categoryFilter,
      subjectFilter,
      levelFilter,
      searchQuery,
      showFeaturedOnly,
      sortBy,
      sortOrder,
      currentPage,
    ]
  );

  const { materials, pagination, summary, loading, error, refetch } =
    usePublicStudyMaterials();

  // Fetch materials when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, refetch]);

  const handleAccess = async (material: PublicStudyMaterial) => {
    if (!isLoggedIn || !token) {
      // Redirect to login with return URL
      navigate(`/auth?returnTo=/resources&materialId=${material._id}`);
      return;
    }

    if (material.type === "FREE") {
      // For free materials, download with authentication
      try {
        const response = await fetch(
          `${window.location.origin}/api/students/study-materials/${material._id}/download`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to download study material');
          return;
        }

        // Get the blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.title;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error downloading study material:', error);
        alert('Failed to download study material');
      }
    } else {
      // Navigate to purchase/access page for paid materials
      navigate(`/student/study-materials/${material._id}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "NOTES":
        return <FileText className="h-4 w-4" />;
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "PRACTICE":
        return <BookMarked className="h-4 w-4" />;
      case "MOCK_TEST":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    return type === "FREE"
      ? BADGE_COLORS.FREE.combined
      : BADGE_COLORS.PAID.combined;
  };

  const formatPrice = (price: number, discountPrice?: number) => {
    if (discountPrice && discountPrice < price) {
      return (
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${TEXT_COLORS.SUCCESS}`}>
            ₹{discountPrice}
          </span>
          <span className="text-sm text-gray-500 line-through">₹{price}</span>
          <Badge className={BADGE_COLORS.DISCOUNT.combined + " text-xs"}>
            {Math.round((1 - discountPrice / price) * 100)}% OFF
          </Badge>
        </div>
      );
    }
    return <span className="text-lg font-bold">₹{price}</span>;
  };

  if (loading && !materials.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading study materials...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className={`${GRADIENT_COLORS.PURPLE_TO_BLUE} text-white py-16`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Study Materials
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Comprehensive resources for CA exam preparation
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.totalMaterials || 0}
                </div>
                <div className="text-sm opacity-80">Total Materials</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.freeMaterials || 0}
                </div>
                <div className="text-sm opacity-80">Free Resources</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.paidMaterials || 0}
                </div>
                <div className="text-sm opacity-80">Premium Resources</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.featuredMaterials || 0}
                </div>
                <div className="text-sm opacity-80">Featured</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search materials, topics, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Select
              value={typeFilter}
              onValueChange={(value: string) =>
                setTypeFilter(value as "all" | "FREE" | "PAID")
              }
            >
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="NOTES">Notes</SelectItem>
                <SelectItem value="VIDEO">Videos</SelectItem>
                <SelectItem value="PRACTICE">Practice</SelectItem>
                <SelectItem value="MOCK_TEST">Mock Tests</SelectItem>
              </SelectContent>
            </Select>

            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="ACCOUNTING">Accounting</SelectItem>
                <SelectItem value="LAW">Law</SelectItem>
                <SelectItem value="TAXATION">Taxation</SelectItem>
                <SelectItem value="AUDIT">Audit</SelectItem>
                <SelectItem value="FM">Financial Management</SelectItem>
                <SelectItem value="COSTING">Costing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="FOUNDATION">Foundation</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="FINAL">Final</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Latest</SelectItem>
                <SelectItem value="title">Name</SelectItem>
                <SelectItem value="purchaseCount">Most Purchased</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showFeaturedOnly ? "default" : "outline"}
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            >
              <Star className="h-4 w-4 mr-2" />
              Featured
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className={`flex items-center gap-2 ${TEXT_COLORS.ERROR}`}>
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch(filters)}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials Grid/List */}
        {materials.length === 0 && !loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No materials found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {materials.map((material) => (
                <Card
                  key={material._id}
                  className={`hover:shadow-lg transition-shadow ${
                    viewMode === "list" ? "flex flex-row" : ""
                  }`}
                >
                  {viewMode === "grid" ? (
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(material.type)}>
                              {material.type === "FREE" ? (
                                <Heart className="h-3 w-3 mr-1" />
                              ) : (
                                <Lock className="h-3 w-3 mr-1" />
                              )}
                              {material.type}
                            </Badge>
                            {material.featured && (
                              <Badge className={BADGE_COLORS.FEATURED.combined}>
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {material.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pb-3">
                        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                          {material.description}
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {getCategoryIcon(material.category)}
                            {material.category}
                          </Badge>
                          <Badge variant="secondary">{material.subject}</Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{material.caLevel}</Badge>
                          <span className="text-xs text-gray-500">
                            {material.readableFileSize}
                          </span>
                        </div>

                        {material.tags && material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {material.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {material.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{material.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          {material.type === "PAID" &&
                            material.purchaseCount !== undefined && (
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                {material.purchaseCount}
                              </span>
                            )}
                          <span>{material.readableFileSize}</span>
                        </div>

                        {material.type === "PAID" && (
                          <div className="mb-3">
                            {formatPrice(
                              material.price || 0,
                              material.discountPrice
                            )}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="pt-3">
                        <Button
                          onClick={() => handleAccess(material)}
                          className="w-full"
                          variant={
                            material.type === "FREE" ? "default" : "outline"
                          }
                        >
                          {!isLoggedIn ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Login to Access
                            </>
                          ) : material.type === "FREE" ? (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Free
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    // List view
                    <div className="flex-1 flex items-center p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(material.type)}>
                            {material.type === "FREE" ? (
                              <Heart className="h-3 w-3 mr-1" />
                            ) : (
                              <Lock className="h-3 w-3 mr-1" />
                            )}
                            {material.type}
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
                            <Badge className={BADGE_COLORS.FEATURED.combined}>
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-1">
                          {material.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {material.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{material.readableFileSize}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        {material.type === "PAID" && (
                          <div className="text-right">
                            {formatPrice(
                              material.price || 0,
                              material.discountPrice
                            )}
                          </div>
                        )}

                        <Button
                          onClick={() => handleAccess(material)}
                          variant={
                            material.type === "FREE" ? "default" : "outline"
                          }
                        >
                          {!isLoggedIn ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Login to Access
                            </>
                          ) : material.type === "FREE" ? (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
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
          </>
        )}

        {/* Loading overlay for subsequent requests */}
        {loading && materials.length > 0 && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">
                Updating materials...
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default PublicStudyMaterials;
