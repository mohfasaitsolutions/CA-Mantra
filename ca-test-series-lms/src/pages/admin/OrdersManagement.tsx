import { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, RefreshCw, X, Copy } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { testSeriesApi } from "@/lib/api/testSeries";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
        return format(new Date(dateString), "PP p");
    } catch (e) {
        return dateString;
    }
};

export default function OrdersManagement() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedTestSeries, setSelectedTestSeries] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Test Series for filter
    const { data: testSeriesData, isLoading: isLoadingTestSeries } = useQuery({
        queryKey: ["test-series-list"],
        queryFn: () => testSeriesApi.getAll(),
    });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["admin-orders", page, debouncedSearch, selectedTestSeries, selectedStatus],
        queryFn: () =>
            adminApi.getOrders({
                page,
                pageSize: 10,
                search: debouncedSearch,
                status: selectedStatus !== "all" ? selectedStatus : undefined,
                testSeriesId: selectedTestSeries !== "all" && selectedTestSeries !== "undefined" ? selectedTestSeries : undefined,
            }),
    });

    const orders = data?.data || [];
    const pagination = data?.pagination;
    const testSeriesList = testSeriesData?.testSeries || [];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar role="admin" />
            <MobileSidebar
                role="admin"
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            <div className="flex-1">
                <header className="bg-white p-4 shadow-sm sticky top-0 z-10 md:hidden">
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
                            <h1 className="text-xl font-bold text-gray-800">
                                Orders Management
                            </h1>
                        </div>
                    </div>
                </header>

                <main className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Orders
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Manage student purchases and payment history
                            </p>
                        </div>
                        <Button onClick={() => refetch()} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Search by order ID, receipt, student name, email, mobile or student ID..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={(val) => {
                                            setSelectedStatus(val);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Payment Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="CREATED">Created</SelectItem>
                                            <SelectItem value="CAPTURED">Captured</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {/* Test Series Filter */}
                                    <Select
                                        value={selectedTestSeries || "all"}
                                        onValueChange={(val) => {
                                            setSelectedTestSeries(val);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-full md:w-[240px]">
                                            <SelectValue placeholder="Filter by Test Series" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Test Series</SelectItem>
                                            {isLoadingTestSeries ? (
                                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                                            ) : (
                                                testSeriesList.map((ts) => (
                                                    <SelectItem key={String(ts.id || ts._id)} value={String(ts.id || ts._id)}>
                                                        {ts.title}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order Details</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Mobile</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead className="text-right">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                                <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center">
                                                    <div className="flex justify-center items-center">
                                                        <Loader2 className="h-6 w-6 animate-spin text-ca-primary mr-2" />
                                                        Loading orders...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : orders.length === 0 ? (
                                                <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                                                    No orders found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            orders.map((order: any) => (
                                                <TableRow key={order._id} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900">{order.receipt}</div>
                                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{order.orderId}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{order.studentName || "Unknown"}</div>
                                                        <div className="text-xs text-gray-500">{order.studentEmail}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-gray-700">
                                                            {order.studentMobile || "-"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium max-w-[200px] truncate" title={order.testSeriesTitle}>
                                                            {order.testSeriesTitle || "Unknown Item"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold">
                                                            ₹{order.amount}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{order.currency}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={order.status === 'SUCCESS' || order.status === 'CAPTURED' ? 'default' : 'secondary'}>
                                                            {order.status || 'PENDING'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 group">
                                                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                                                                {order.studentId || order.student?._id || "-"}
                                                            </code>
                                                            {(order.studentId || order.student?._id) && (
                                                                <button
                                                                    onClick={() => copyToClipboard(order.studentId || order.student?._id)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                                                                    title="Copy ID"
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-gray-600">
                                                        {formatDate(order.createdAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {pagination && (pagination.pages || pagination.totalPages) > 1 && (
                                <div className="flex items-center justify-between px-4 py-4 border-t">
                                    <div className="text-sm text-gray-500">
                                        Showing {(pagination.page - 1) * (pagination.limit || pagination.pageSize) + 1} to{" "}
                                        {Math.min(pagination.page * (pagination.limit || pagination.pageSize), pagination.total)} of{" "}
                                        {pagination.total} results
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={pagination.page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, pagination.pages || pagination.totalPages) }, (_, i) => {
                                                // Simple logic to show first few pages, in real app better logic needed for many pages
                                                const pNum = i + 1;
                                                return (
                                                    <Button
                                                        key={pNum}
                                                        variant={pagination.page === pNum ? "default" : "ghost"}
                                                        size="sm"
                                                        className="w-8 h-8 p-0"
                                                        onClick={() => setPage(pNum)}
                                                    >
                                                        {pNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.min(pagination.pages || pagination.totalPages, p + 1))}
                                            disabled={pagination.page === (pagination.pages || pagination.totalPages)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
