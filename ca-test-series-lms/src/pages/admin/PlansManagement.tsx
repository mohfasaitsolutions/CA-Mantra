import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    PlusCircle,
    Trash2,
    Pencil,
    Search,
    ToggleLeft,
    ToggleRight,
    Menu,
    Loader2,
    FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { formatDate } from "@/utils/dateUtils";
import { Badge } from "@/components/ui/badge";
import { usePlans, usePlansManagement } from "@/hooks/use-plans";
import { Plan } from "@/lib/api/plans";

const PlansManagement = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const navigate = useNavigate();

    const { plans, isLoading, fetchPlans } = usePlans();
    const { deletePlan, togglePlanStatus, isLoading: isActionLoading } = usePlansManagement();

    useEffect(() => {
        fetchPlans(true); // Include inactive plans for admin
    }, [fetchPlans]);

    const handleDelete = useCallback(async (plan: Plan) => {
        setPlanToDelete(plan);
        setDeleteDialogOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!planToDelete) return;
        const success = await deletePlan(planToDelete.id);
        if (success) {
            fetchPlans(true);
        }
        setDeleteDialogOpen(false);
        setPlanToDelete(null);
    }, [planToDelete, deletePlan, fetchPlans]);

    const handleToggleStatus = useCallback(async (plan: Plan) => {
        const result = await togglePlanStatus(plan.id);
        if (result) {
            fetchPlans(true);
        }
    }, [togglePlanStatus, fetchPlans]);

    const filteredPlans = plans.filter((plan) => {
        const term = searchTerm.toLowerCase();
        return (
            plan.name.toLowerCase().includes(term) ||
            (plan.description || "").toLowerCase().includes(term)
        );
    });

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
                            <h1 className="text-2xl font-bold text-gray-800">Plans Management</h1>
                        </div>
                        <Button onClick={() => navigate("/admin/plans/create")}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create Plan
                        </Button>
                    </div>
                </header>

                <main className="p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderOpen className="h-5 w-5" />
                                All Plans
                            </CardTitle>
                            <CardDescription>
                                Manage plan categories for test series
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search plans..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 max-w-sm"
                                    />
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : filteredPlans.length === 0 ? (
                                <div className="text-center py-12">
                                    <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">
                                        {searchTerm ? "No plans match your search." : "No plans created yet."}
                                    </p>
                                    {!searchTerm && (
                                        <Button
                                            className="mt-4"
                                            onClick={() => navigate("/admin/plans/create")}
                                        >
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Create Your First Plan
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">Image</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-center">Test Series</TableHead>
                                                <TableHead className="text-center">Order</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPlans.map((plan) => (
                                                <TableRow key={plan.id}>
                                                    <TableCell>
                                                        {plan.thumbnailUrl ? (
                                                            <div className="w-12 h-12 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                                                                <img
                                                                    src={plan.thumbnailUrl}
                                                                    alt={plan.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg border bg-gray-50 flex items-center justify-center text-gray-400">
                                                                <FolderOpen className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {plan.description || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">
                                                            {plan.testSeriesCount || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">{plan.displayOrder}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={plan.isActive ? "default" : "outline"}>
                                                            {plan.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {plan.createdAt ? formatDate(plan.createdAt) : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleToggleStatus(plan)}
                                                                disabled={isActionLoading}
                                                                title={plan.isActive ? "Deactivate" : "Activate"}
                                                            >
                                                                {plan.isActive ? (
                                                                    <ToggleRight className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => navigate(`/admin/plans/${plan.id}/edit`)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600"
                                                                onClick={() => handleDelete(plan)}
                                                                disabled={isActionLoading}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{planToDelete?.name}"?
                                    {planToDelete?.testSeriesCount && planToDelete.testSeriesCount > 0 && (
                                        <span className="block mt-2 text-orange-600">
                                            Warning: {planToDelete.testSeriesCount} test series will be unassigned from this plan.
                                        </span>
                                    )}
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={confirmDelete}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </main>
            </div>
        </div>
    );
};

export default PlansManagement;
