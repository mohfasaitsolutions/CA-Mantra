import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, Menu, Loader2, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePlansManagement } from "@/hooks/use-plans";
import { plansApi, TestSeriesItem } from "@/lib/api/plans";
import { testSeriesApi, TestSeriesResponse } from "@/lib/api/testSeries";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";

interface LocalTestSeriesItem {
    testSeriesId: string;
    price: number;
    testSeries: {
        _id: string;
        title: string;
        price: number;
        caLevel: string;
        thumbnailUrl?: string;
    };
}

const CreatePlan = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { planId } = useParams<{ planId: string }>();
    const { toast } = useToast();
    const { isLoading: saveLoading } = usePlansManagement();

    const isEditMode = Boolean(planId);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [displayOrder, setDisplayOrder] = useState("0");
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Test series management state
    const [testSeriesItems, setTestSeriesItems] = useState<LocalTestSeriesItem[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [availableTestSeries, setAvailableTestSeries] = useState<TestSeriesResponse[]>([]);
    const [loadingTestSeries, setLoadingTestSeries] = useState(false);
    const [selectedTestSeries, setSelectedTestSeries] = useState<TestSeriesResponse | null>(null);
    const [newPrice, setNewPrice] = useState("");

    // Load existing plan data if editing
    useEffect(() => {
        const loadPlan = async () => {
            if (!planId) return;
            setLoadingPlan(true);
            try {
                const response = await plansApi.getById(planId);
                const plan = response.plan;
                setName(plan.name);
                setDescription(plan.description || "");
                setThumbnailUrl(plan.thumbnailUrl || "");
                setDisplayOrder(String(plan.displayOrder || 0));

                // Convert TestSeriesItem to LocalTestSeriesItem
                const items: LocalTestSeriesItem[] = (plan.testSeriesItems || [])
                    .filter((item: TestSeriesItem) => item.testSeries)
                    .map((item: TestSeriesItem) => ({
                        testSeriesId: item.testSeriesId,
                        price: item.price,
                        testSeries: {
                            _id: item.testSeries!._id,
                            title: item.testSeries!.title,
                            price: item.testSeries!.price,
                            caLevel: item.testSeries!.caLevel,
                            thumbnailUrl: item.testSeries!.thumbnailUrl,
                        }
                    }));
                setTestSeriesItems(items);
            } catch (err: any) {
                toast({
                    title: "Error",
                    description: "Failed to load plan details",
                    variant: "destructive",
                });
                navigate("/admin/plans");
            } finally {
                setLoadingPlan(false);
            }
        };
        loadPlan();
    }, [planId, navigate, toast]);

    // Fetch available test series for adding
    const fetchAvailableTestSeries = useCallback(async () => {
        setLoadingTestSeries(true);
        try {
            const response = await testSeriesApi.getAll({ limit: 100, isActive: true });
            // Filter out already added test series
            const existingIds = new Set(testSeriesItems.map(item => item.testSeriesId));
            const filtered = response.testSeries.filter((ts: TestSeriesResponse) => {
                const id = ts.id || (ts as any)._id;
                return !existingIds.has(id);
            });
            setAvailableTestSeries(filtered);
        } catch (err) {
            console.error("Failed to fetch test series:", err);
        } finally {
            setLoadingTestSeries(false);
        }
    }, [testSeriesItems]);

    useEffect(() => {
        if (showAddDialog) {
            fetchAvailableTestSeries();
        }
    }, [showAddDialog, fetchAvailableTestSeries]);

    const filteredTestSeries = availableTestSeries.filter(ts =>
        ts.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: "Error",
                description: "Plan name is required.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            if (isEditMode && planId) {
                // Update existing plan
                await plansApi.update(planId, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    thumbnailUrl: thumbnailUrl.trim() || undefined,
                    displayOrder: parseInt(displayOrder, 10) || 0,
                });
                toast({ title: "Success", description: "Plan updated" });
            } else {
                // Create new plan with test series items
                await plansApi.create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    thumbnailUrl: thumbnailUrl.trim() || undefined,
                    displayOrder: parseInt(displayOrder, 10) || 0,
                    testSeriesItems: testSeriesItems.map(item => ({
                        testSeriesId: item.testSeriesId,
                        price: item.price,
                    })),
                });
                toast({ title: "Success", description: "Plan created" });
            }
            navigate("/admin/plans");
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.response?.data?.error || "Failed to save plan",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTestSeriesLocally = () => {
        if (!selectedTestSeries) return;

        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) {
            toast({
                title: "Error",
                description: "Please enter a valid price",
                variant: "destructive",
            });
            return;
        }

        const tsId = selectedTestSeries.id || (selectedTestSeries as any)._id;

        // Add to local state
        setTestSeriesItems(prev => [...prev, {
            testSeriesId: tsId,
            price,
            testSeries: {
                _id: tsId,
                title: selectedTestSeries.title,
                price: selectedTestSeries.price,
                caLevel: selectedTestSeries.caLevel,
                thumbnailUrl: selectedTestSeries.thumbnailUrl,
            }
        }]);

        setShowAddDialog(false);
        setSelectedTestSeries(null);
        setNewPrice("");
        setSearchTerm("");

        // If in edit mode, also save to backend
        if (isEditMode && planId) {
            plansApi.addTestSeries(planId, tsId, price)
                .then(() => toast({ title: "Added", description: "Test series added to plan" }))
                .catch(err => toast({ title: "Error", description: err.response?.data?.error || "Failed to add", variant: "destructive" }));
        }
    };

    const handleRemoveTestSeries = (testSeriesId: string) => {
        setTestSeriesItems(items => items.filter(item => item.testSeriesId !== testSeriesId));

        // If in edit mode, also remove from backend
        if (isEditMode && planId) {
            plansApi.removeTestSeries(planId, testSeriesId)
                .then(() => toast({ title: "Removed", description: "Test series removed" }))
                .catch(err => toast({ title: "Error", description: err.response?.data?.error || "Failed to remove", variant: "destructive" }));
        }
    };

    if (loadingPlan) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                className="md:hidden mr-2"
                                onClick={() => setIsMobileSidebarOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {isEditMode ? "Edit Plan" : "Create Plan"}
                            </h1>
                        </div>
                        <Button variant="outline" onClick={() => navigate("/admin/plans")}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Plans
                        </Button>
                    </div>
                </header>

                <main className="p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Plan Details Card */}
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plan Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Plan Name *</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Detailed Revision Exam Series"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Brief description..."
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="thumbnailUrl">Thumbnail Image URL</Label>
                                        <Input
                                            id="thumbnailUrl"
                                            value={thumbnailUrl}
                                            onChange={(e) => setThumbnailUrl(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        {thumbnailUrl && (
                                            <div className="mt-2 w-48 h-32 rounded-lg overflow-hidden border">
                                                <img
                                                    src={thumbnailUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="displayOrder">Display Order</Label>
                                        <Input
                                            id="displayOrder"
                                            type="number"
                                            min="0"
                                            value={displayOrder}
                                            onChange={(e) => setDisplayOrder(e.target.value)}
                                            className="w-32"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isSaving || saveLoading}>
                                            {isSaving ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                                            ) : (
                                                <><Save className="h-4 w-4 mr-2" /> {isEditMode ? "Save Changes" : "Create Plan"}</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>

                        {/* Test Series Management - Now shows in both create and edit mode */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Test Series in this Plan</CardTitle>
                                <Button onClick={() => setShowAddDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Test Series
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {testSeriesItems.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">
                                        No test series added yet. Click "Add Test Series" to start.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {testSeriesItems.map((item) => (
                                            <div
                                                key={item.testSeriesId}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-medium">
                                                        {item.testSeries.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline">
                                                            {item.testSeries.caLevel}
                                                        </Badge>
                                                        <span className="text-sm text-gray-500">
                                                            Original: ₹{item.testSeries.price}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <span className="text-sm text-gray-500">Plan Price</span>
                                                        <p className="text-lg font-bold text-primary">₹{item.price}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveTestSeries(item.testSeriesId)}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>

                {/* Add Test Series Dialog */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add Test Series to Plan</DialogTitle>
                        </DialogHeader>

                        {!selectedTestSeries ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search test series..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {loadingTestSeries ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : filteredTestSeries.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">
                                            No test series available
                                        </p>
                                    ) : (
                                        filteredTestSeries.map((ts) => (
                                            <div
                                                key={ts.id || (ts as any)._id}
                                                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                                                onClick={() => {
                                                    setSelectedTestSeries(ts);
                                                    setNewPrice(String(ts.price));
                                                }}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium">{ts.title}</h4>
                                                        <Badge variant="outline" className="mt-1">
                                                            {ts.caLevel}
                                                        </Badge>
                                                    </div>
                                                    <span className="font-bold">₹{ts.price}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium">{selectedTestSeries.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Original Price: ₹{selectedTestSeries.price}
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="planPrice">Price for this Plan (₹)</Label>
                                    <Input
                                        id="planPrice"
                                        type="number"
                                        min="0"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        placeholder="Enter price"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Set a custom price for this test series in this plan
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {selectedTestSeries ? (
                                <>
                                    <Button variant="outline" onClick={() => setSelectedTestSeries(null)}>
                                        Back
                                    </Button>
                                    <Button onClick={handleAddTestSeriesLocally}>
                                        Add to Plan
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                    Cancel
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default CreatePlan;
