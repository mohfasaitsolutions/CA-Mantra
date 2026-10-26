import { memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import SidebarLogo from "./SidebarLogo";
import { useAuthStore } from "@/lib/store";
import {
  studentMenuItems,
  adminMenuItems,
  evaluatorMenuItems,
  courseUploaderMenuItems,
} from "@/lib/menu-items";
import { isCourseUploader } from "@/constants/roles";

interface SidebarProps {
  role: "student" | "admin" | "evaluator" | "course-uploader";
}

/**
 * Course management pages are shared with the admin console and pass
 * role="admin", so the signed-in role wins whenever it is a course uploader —
 * that keeps the admin-only links out of their sidebar.
 */
const useEffectiveRole = (role: SidebarProps["role"]) => {
  const user = useAuthStore((s) => s.user);
  return isCourseUploader(user?.role) ? "course-uploader" : role;
};

const SidebarNavigation = memo(({ role }: SidebarProps) => {
  const location = useLocation();
  const effectiveRole = useEffectiveRole(role);

  const menuItems = useMemo(() => {
    switch (effectiveRole) {
      case "student":
        return studentMenuItems;
      case "admin":
        return adminMenuItems;
      case "evaluator":
        return evaluatorMenuItems;
      case "course-uploader":
        return courseUploaderMenuItems;
      default:
        return [];
    }
  }, [effectiveRole]);

  return (
    <div className="mt-8 flex-grow flex flex-col">
      <nav className="flex-1 px-2 pb-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                ? "bg-ca-primary text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pb-4">
        <LogoutButton />
      </div>
    </div>
  );
});

SidebarNavigation.displayName = "SidebarNavigation";

const Sidebar = memo(({ role }: SidebarProps) => {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:min-w-64 md:flex-shrink-0">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        <SidebarLogo />
        <SidebarNavigation role={role} />
      </div>
    </div>
  );
});

const LogoutButton = () => {
  const { logout } = useAuthStore();
  const onClick = () => {
    logout();
    window.location.replace("/login");
  };
  return (
    <button
      onClick={onClick}
      className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 w-full"
    >
      <LogOut className="mr-3 h-5 w-5" />
      Logout
    </button>
  );
};

Sidebar.displayName = "Sidebar";

export default Sidebar;
