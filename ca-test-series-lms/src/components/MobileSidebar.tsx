import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuthStore } from "@/lib/store";
import {
  studentMenuItems,
  adminMenuItems,
  evaluatorMenuItems,
} from "@/lib/menu-items";

interface MobileSidebarProps {
  role: "student" | "admin" | "evaluator";
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  role,
  isOpen,
  onClose,
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);
  // Hooks must run before any returns

  const { logout } = useAuthStore();
  const handleLogout = () => {
    logout();
    onClose();
    window.location.replace("/login");
  };

  const renderMenuByRole = () => {
    let items = [];
    switch (role) {
      case "student":
        items = studentMenuItems;
        break;
      case "admin":
        items = adminMenuItems;
        break;
      case "evaluator":
        items = evaluatorMenuItems;
        break;
      default:
        return null;
    }

    return (
      <>
        {items.map((item) => (
          <MobileSidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            to={item.path}
            active={isActive(item.path)}
            onClick={onClose}
          />
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 w-full"
        >
          <LogOut className="h-5 w-5 mr-3" /> Logout
        </button>
      </>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 md:hidden ${isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-[100dvh] w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link
              to="/"
              className="font-bold text-xl text-ca-primary"
              onClick={onClose}
            >
              CA MCQ Tests
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 p-4 space-y-1 overflow-y-auto pb-24">
            {renderMenuByRole()}
            <div className="pt-4 mt-auto border-t">
              <div className="px-3 py-2 text-xs text-gray-500">
                Version 1.0.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface MobileSidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active: boolean;
  onClick: () => void;
}

const MobileSidebarItem: React.FC<MobileSidebarItemProps> = ({
  icon: Icon,
  label,
  to,
  active,
  onClick,
}) => (
  <Link
    to={to}
    className={`flex items-center px-3 py-2 rounded-md transition-colors ${active ? "bg-ca-primary text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    onClick={onClick}
  >
    <Icon className="h-5 w-5 mr-3" />
    <span>{label}</span>
  </Link>
);

export default MobileSidebar;
