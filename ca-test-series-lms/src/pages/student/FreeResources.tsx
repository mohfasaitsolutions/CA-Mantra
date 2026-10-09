import { useState } from "react";
import { Menu, Download, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { GRADIENT_COLORS } from "@/constants/colors";

const FreeResources = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const freeResources = [
    {
      id: "1",
      title: "CA Foundation Accounting Basics",
      description:
        "Comprehensive notes covering fundamental accounting principles and concepts.",
      type: "PDF",
      size: "2.5 MB",
      downloads: 1245,
      thumbnail:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3",
    },
    {
      id: "2",
      title: "Business Law Study Guide",
      description:
        "Complete study guide covering essential business law topics for CA Foundation.",
      type: "PDF",
      size: "3.2 MB",
      downloads: 987,
      thumbnail:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3",
    },
    {
      id: "3",
      title: "Economics Practice Questions",
      description:
        "Collection of practice questions with solutions for Economics subject.",
      type: "PDF",
      size: "1.8 MB",
      downloads: 2156,
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3",
    },
    {
      id: "4",
      title: "Mathematics Formula Sheet",
      description:
        "Quick reference formula sheet for CA Foundation Mathematics.",
      type: "PDF",
      size: "0.8 MB",
      downloads: 3421,
      thumbnail:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3",
    },
    {
      id: "5",
      title: "Business Communication Tips",
      description:
        "Essential tips and tricks for improving business communication skills.",
      type: "PDF",
      size: "1.2 MB",
      downloads: 876,
      thumbnail:
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3",
    },
    {
      id: "6",
      title: "Financial Accounting Notes",
      description:
        "Detailed notes on financial accounting concepts and practice problems.",
      type: "PDF",
      size: "2.8 MB",
      downloads: 654,
      thumbnail:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3",
    },
  ];

  const filteredResources = freeResources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (_resourceId: string, title: string) => {
    // Simulate download
    console.log(`Downloading resource: ${title}`);
    // In a real app, this would trigger the actual download
  };

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
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Resources</h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Hero Section */}
          <div className={`${GRADIENT_COLORS.PRIMARY_TO_ACCENT} text-white p-8 rounded-lg mb-8`}>
            <h2 className="text-3xl font-bold mb-4">
              Access Quality Study Materials for Free
            </h2>
            <p className="text-lg opacity-90">
              Enhance your CA Mantraaaration with our collection of free study
              notes, practice papers, and study guides curated by experts.
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md"
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-ca-primary mx-auto mb-2" />
                <h3 className="text-2xl font-bold">{freeResources.length}</h3>
                <p className="text-gray-600">Total Resources</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-ca-primary mx-auto mb-2" />
                <h3 className="text-2xl font-bold">{freeResources.length}</h3>
                <p className="text-gray-600">Study Materials</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Download className="h-8 w-8 text-ca-primary mx-auto mb-2" />
                <h3 className="text-2xl font-bold">
                  {freeResources.reduce((sum, r) => sum + r.downloads, 0)}
                </h3>
                <p className="text-gray-600">Total Downloads</p>
              </CardContent>
            </Card>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">
                    {resource.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {resource.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>{resource.size}</span>
                      </span>
                    </div>
                    <span>{resource.downloads.toLocaleString()} downloads</span>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleDownload(resource.id, resource.title)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Free
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No resources found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or browse all resources.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FreeResources;
