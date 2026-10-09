import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { Student } from "@/types/student";
import StudentFilters from "@/components/admin/students-management/StudentFilters";
import StudentCard from "@/components/admin/students-management/StudentCard";
import NoStudents from "@/components/admin/students-management/NoStudents";
import { adminStudentsApi } from "@/lib/api/adminStudents";

const StudentsManagement = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState<
    "all" | "purchased" | "not_purchased"
  >("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ignore = false;
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const purchased =
          purchaseFilter === "all"
            ? "all"
            : purchaseFilter === "purchased"
              ? "yes"
              : "no";
        const res = await adminStudentsApi.list({
          q: searchTerm,
          purchased,
          status: "all",
          page,
          pageSize,
        });
        if (!ignore) {
          setStudents(res.data);
          setTotal(res.total);
          setPage(res.page);
          setPageSize(res.pageSize);
        }
      } catch (e: unknown) {
        let msg = "Failed to load students";
        if (typeof e === "object" && e !== null) {
          const err = e as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          msg = err.response?.data?.message || err.message || msg;
        }
        if (!ignore) setError(msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    // Debounce search a bit
    const t = setTimeout(fetchStudents, 300);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [searchTerm, purchaseFilter, page, pageSize]);

  // Reset to first page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, purchaseFilter]);

  const filteredStudents = useMemo(() => students, [students]);

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
                Students Management
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          <StudentFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            purchaseFilter={purchaseFilter}
            setPurchaseFilter={setPurchaseFilter}
          />

          {loading && <div className="text-gray-500">Loading students…</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && (
            <>
              <div className="grid gap-6">
                {filteredStudents.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
              {filteredStudents.length === 0 && <NoStudents />}
              {total > pageSize && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(total / pageSize)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentsManagement;
