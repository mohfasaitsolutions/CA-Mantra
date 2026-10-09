import {
    LayoutDashboard,
    Users,
    UserCheck,
    FileText,
    CheckSquare,
    BarChart3,
    BookOpen,
    Settings,
    CreditCard,
    MessageSquare,
    GraduationCap,
    User,
    Clock,
    Star,
    Calendar,
    Mail,
    PenTool,
    FolderOpen,
} from "lucide-react";

export const studentMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
    { icon: BookOpen, label: "Marketplace", path: "/buy-now" },
    { icon: GraduationCap, label: "My Courses", path: "/student/courses" },
    { icon: CheckSquare, label: "Test History", path: "/student/history" },
    { icon: BarChart3, label: "Analytics", path: "/student/analytics" },
    {
        icon: CreditCard,
        label: "Purchase History",
        path: "/student/purchases",
    },
    {
        icon: FileText,
        label: "Resources",
        path: "/student/resources",
    },
    {
        icon: MessageSquare,
        label: "Contact Support",
        path: "/student/contact-support",
    },
    { icon: User, label: "Profile", path: "/student/profile" },
    { icon: Settings, label: "Settings", path: "/student/settings" },
];

export const adminMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: CreditCard, label: "Orders", path: "/admin/orders" },
    { icon: BookOpen, label: "Test Series", path: "/admin/tests" },
    { icon: FolderOpen, label: "Plans", path: "/admin/plans" },
    { icon: Users, label: "Students", path: "/admin/students" },
    { icon: UserCheck, label: "Evaluators", path: "/admin/evaluators" },
    {
        icon: Star,
        label: "Evaluator Feedbacks",
        path: "/admin/evaluator-feedbacks",
    },
    { icon: CheckSquare, label: "Evaluations", path: "/admin/evaluations" },
    {
        icon: MessageSquare,
        label: "Support Tickets",
        path: "/admin/support-tickets",
    },
    {
        icon: Mail,
        label: "Enquiries",
        path: "/admin/enquiries",
    },
    {
        icon: FileText,
        label: "Study Materials",
        path: "/admin/study-materials",
    },
    { icon: Calendar, label: "Schedule", path: "/admin/schedule" },
    { icon: PenTool, label: "Blogs", path: "/admin/blogs" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export const evaluatorMenuItems = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        path: "/evaluator/dashboard",
    },
    { icon: Clock, label: "Pending Evaluations", path: "/evaluator/pending" },
    {
        icon: CheckSquare,
        label: "Completed Evaluations",
        path: "/evaluator/completed",
    },
    { icon: User, label: "Profile", path: "/evaluator/profile" },
    { icon: Settings, label: "Settings", path: "/evaluator/settings" },
];
