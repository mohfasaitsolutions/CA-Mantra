import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, X, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useTestSeries,
  useTestSeriesManagement,
} from "@/hooks/use-test-series";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";

const EditTestSeries = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [caLevel, setCaLevel] = useState<
    "FOUNDATION" | "INTERMEDIATE" | "FINAL" | "ALL" | ""
  >("");
  const [isActive, setIsActive] = useState(true);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  // validity & attempts
  const [validityType, setValidityType] = useState<"UNLIMITED" | "DATE">(
    "UNLIMITED"
  );
  const [validityDate, setValidityDate] = useState<Date | undefined>(undefined);
  const [attemptsType, setAttemptsType] = useState<"UNLIMITED" | "LIMITED">(
    "UNLIMITED"
  );
  const [attemptsCount, setAttemptsCount] = useState("");

  const { id: testId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { fetchTestSeriesById, isLoading: fetchLoading } = useTestSeries();
  // Keep a stable ref to avoid effect dependency churn triggering re-fetch loops
  const fetchByIdRef = useRef(fetchTestSeriesById);
  useEffect(() => {
    fetchByIdRef.current = fetchTestSeriesById;
  }, [fetchTestSeriesById]);
  const { updateTestSeries, isLoading: updateLoading } =
    useTestSeriesManagement();

  // Fetch test data once per id
  useEffect(() => {
    let isActive = true;
    const loadTestSeries = async () => {
      if (!testId) return;
      const testData = await fetchByIdRef.current(testId, true);
      if (!isActive) return;
      if (testData) {
        setTitle(testData.title);
        setDescription(testData.description || "");
        setOriginalPrice(String(testData.originalPrice ?? testData.price ?? ""));
        setDiscountedPrice(String(testData.discountedPrice ?? testData.price ?? ""));
        setCaLevel(testData.caLevel as "FOUNDATION" | "INTERMEDIATE" | "FINAL" | "ALL");
        setIsActive(testData.isActive);
        if (testData.thumbnailUrl) {
          setThumbnailPreview(testData.thumbnailUrl);
        }
        // Map validity/attempts
        if (testData.validity?.isUnlimited) {
          setValidityType("UNLIMITED");
          setValidityDate(undefined);
        } else if (testData.validity?.expiryDate) {
          setValidityType("DATE");
          setValidityDate(new Date(testData.validity.expiryDate));
        } else if (testData.validity?.days) {
          // Backward compatibility for older records that only have days
          setValidityType("DATE");
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + testData.validity.days);
          setValidityDate(expiryDate);
        }
        if (testData.attempts?.isUnlimited) {
          setAttemptsType("UNLIMITED");
          setAttemptsCount("");
        } else if (testData.attempts) {
          setAttemptsType("LIMITED");
          setAttemptsCount(String(testData.attempts.count || ""));
        }
      } else {
        toast({
          title: "Test not found",
          description: "The requested test series could not be found.",
          variant: "destructive",
        });
        navigate("/admin/tests");
      }
    };
    loadTestSeries();
    return () => {
      isActive = false;
    };
  }, [testId, toast, navigate]);

  const handleThumbnailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !originalPrice || !discountedPrice || !caLevel) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    const originalPriceNumber = Number(originalPrice);
    const discountedPriceNumber = Number(discountedPrice);
    if (isNaN(originalPriceNumber) || originalPriceNumber <= 0 || isNaN(discountedPriceNumber) || discountedPriceNumber <= 0) {
      toast({
        title: "Error",
        description: "Both original price and discounted price must be positive numbers.",
        variant: "destructive",
      });
      return;
    }
    if (discountedPriceNumber > originalPriceNumber) {
      toast({
        title: "Error",
        description: "Discounted price cannot be greater than original price.",
        variant: "destructive",
      });
      return;
    }

    if (!testId) return;

    const updateData = {
      title,
      description,
      price: discountedPriceNumber,
      originalPrice: originalPriceNumber,
      discountedPrice: discountedPriceNumber,
      isActive,
      validityType: (validityType === "DATE" ? "DAYS" : validityType) as "UNLIMITED" | "DAYS",
      validityDate:
        validityType === "DATE" ? validityDate : undefined,
      attemptsType,
      attemptsCount:
        attemptsType === "LIMITED"
          ? Number(attemptsCount) || undefined
          : undefined,
      thumbnail: thumbnailFile || undefined,
    };

    const success = await updateTestSeries(testId, updateData);
    if (success) {
      navigate("/admin/tests");
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>Loading test data...</p>
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
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/tests")}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">
                Edit Test Series
              </h1>
            </div>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Test Series Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Test Series Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="CA Foundation - Accounting Test Series"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Comprehensive test series covering all accounting topics for CA Foundation exam..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="caLevel">CA Level *</Label>
                      <Select
                        value={caLevel}
                        onValueChange={(value) =>
                          setCaLevel(
                            value as "FOUNDATION" | "INTERMEDIATE" | "FINAL" | "ALL"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CA Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FOUNDATION">Foundation</SelectItem>
                          <SelectItem value="INTERMEDIATE">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="FINAL">Final</SelectItem>
                          <SelectItem value="ALL">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Original Price (₹) *</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountedPrice">Discounted Price (₹) *</Label>
                      <Input
                        id="discountedPrice"
                        type="number"
                        value={discountedPrice}
                        onChange={(e) => setDiscountedPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="active">Active Status</Label>
                      <p className="text-sm text-gray-500">
                        Enable or disable this test series
                      </p>
                    </div>
                    <Switch
                      id="active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  {/* Validity & Attempts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Validity</Label>
                      <Select
                        value={validityType}
                        onValueChange={(v) =>
                          setValidityType(v as "UNLIMITED" | "DATE")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                          <SelectItem value="DATE">Until Date</SelectItem>
                        </SelectContent>
                      </Select>
                      {validityType === "DATE" && (
                        <div className="mt-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !validityDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {validityDate ? (
                                  format(validityDate, "PPP")
                                ) : (
                                  <span>Pick expiry date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={validityDate}
                                onSelect={setValidityDate}
                                initialFocus
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Attempts</Label>
                      <Select
                        value={attemptsType}
                        onValueChange={(v) =>
                          setAttemptsType(v as "UNLIMITED" | "LIMITED")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                          <SelectItem value="LIMITED">Limited</SelectItem>
                        </SelectContent>
                      </Select>
                      {attemptsType === "LIMITED" && (
                        <div className="mt-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 3"
                            value={attemptsCount}
                            onChange={(e) => setAttemptsCount(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media Uploads */}
              <Card>
                <CardHeader>
                  <CardTitle>Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="block mb-2">Thumbnail Image</Label>
                    <div className="mb-2">
                      {thumbnailPreview ? (
                        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setThumbnailPreview(null);
                              setThumbnailFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500 mb-2">
                            Upload a thumbnail image
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default EditTestSeries;
