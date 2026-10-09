import { useState, useEffect } from "react";
import { Menu, CreditCard, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { studentsApi, type PurchasedSeriesItem } from "@/lib/api";
import { formatDateShort } from "@/utils/dateUtils";

const PurchaseHistory = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState("all");
  const [purchases, setPurchases] = useState<PurchasedSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await studentsApi.purchases();
        console.log("Purchase data from backend:", response.data); // Debug log to check if purchaseDate is included
        setPurchases(response.data || []);
      } catch (err: unknown) {
        console.error("Error fetching purchases:", err);
        let errorMessage = "Failed to load purchases";
        if (typeof err === "object" && err !== null) {
          const error = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          errorMessage =
            error.response?.data?.message || error.message || errorMessage;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  // Filter and sort purchases
  const filteredPurchases = purchases
    .filter((purchase) => {
      // Filter by search term
      if (
        searchTerm &&
        !purchase.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Filter by level (using level as type filter)
      if (filterType !== "all" && purchase.level !== filterType) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by purchase date if available, fallback to price
      if (a.purchaseDate && b.purchaseDate) {
        const dateA = new Date(a.purchaseDate).getTime();
        const dateB = new Date(b.purchaseDate).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      // Fallback to price sorting
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
    });

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
              <h1 className="text-2xl font-bold text-gray-800">
                Purchase History
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:justify-between">
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your past transactions and purchase details.
              </CardDescription>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    className="pl-8 w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Foundation">Foundation</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-8 text-gray-500">
                  Loading purchases...
                </div>
              )}
              {error && (
                <div className="text-center py-8 text-red-600">{error}</div>
              )}
              {!loading && !error && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-4">Title</th>
                        <th className="text-left p-4">Level</th>
                        <th className="text-right p-4">Price</th>
                        <th className="text-center p-4">Purchase Date</th>
                        <th className="text-center p-4">Validity</th>
                        <th className="text-center p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-gray-500"
                          >
                            No purchases found
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((purchase) => (
                          <tr key={purchase.id} className="border-b">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">
                                  {purchase.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {purchase.description}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                {purchase.level}
                              </span>
                            </td>
                            <td className="text-right p-4">
                              ₹{purchase.price}
                            </td>
                            <td className="text-center p-4">
                              {purchase.purchaseDate ? (
                                formatDateShort(purchase.purchaseDate)
                              ) : (
                                <span className="text-gray-400 italic">
                                  Date unavailable
                                </span>
                              )}
                            </td>
                            <td className="text-center p-4">
                              {purchase.validity?.isUnlimited
                                ? "Unlimited"
                                : `${purchase.validity?.days || 0} days`}
                            </td>
                            <td className="text-center p-4">
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                <CreditCard
                                  className="mr-1.5 h-3 w-3"
                                  aria-hidden="true"
                                />
                                Active
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default PurchaseHistory;
