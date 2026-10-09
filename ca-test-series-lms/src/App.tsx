import { useEffect, useLayoutEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useRoleSessionGuard } from "@/hooks";
import ProtectedRoute, {
  RoleProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import TestSeriesPage from "./pages/TestSeriesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import BlogsPage from "./pages/BlogsPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import MyCourses from "./pages/student/MyCourses";
import TestHistory from "./pages/student/TestHistory";
import AnalyticsPage from "./pages/student/AnalyticsPage";
import PurchaseHistory from "./pages/student/PurchaseHistory";
import ContactSupport from "./pages/student/ContactSupport";
import ProfilePage from "./pages/student/ProfilePage";
import StudentSettings from "./pages/student/StudentSettings";
import Resources from "./pages/student/Resources";
import TestSeriesDetail from "./pages/student/TestSeriesDetail";
import PublicTestSeriesDetail from "./pages/PublicTestSeriesDetail";
import TestSeriesStatus from "./pages/student/TestSeriesStatus";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import OrdersManagement from "./pages/admin/OrdersManagement";
import TestSeriesManagement from "./pages/admin/TestSeriesManagement";
import CreateTestSeries from "./pages/admin/CreateTestSeries";
import CreateTest from "./pages/admin/CreateTest";
import EditTestSeries from "./pages/admin/EditTestSeries";
import StudentsManagement from "./pages/admin/StudentsManagement";
import StudentDetail from "./pages/admin/StudentDetail";
import EvaluatorsManagement from "./pages/admin/EvaluatorsManagement";
import EvaluatorDetail from "./pages/admin/EvaluatorDetail";
import EvaluatorFeedbacks from "./pages/admin/EvaluatorFeedbacks";
import EvaluationsManagement from "./pages/admin/EvaluationsManagement";
import StudyMaterialManagement from "./pages/admin/StudyMaterialManagement";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import SupportTickets from "./pages/admin/AdminSupportTickets";
import ManageEnquiries from "./pages/admin/ManageEnquiries";
import AdminBlogsPage from "./pages/admin/AdminBlogsPage";
import BlogEditorPage from "./pages/admin/BlogEditorPage";
import PlansManagement from "./pages/admin/PlansManagement";
import CreatePlan from "./pages/admin/CreatePlan";

// Evaluator Pages
import EvaluatorDashboard from "./pages/evaluator/EvaluatorDashboard";
import PendingEvaluations from "./pages/evaluator/PendingEvaluations";
import CompletedEvaluations from "./pages/evaluator/CompletedEvaluations";
import EvaluatorProfile from "./pages/evaluator/EvaluatorProfile";
import EvaluatorSettings from "./pages/evaluator/EvaluatorSettings";
import EvaluateSubmission from "./pages/evaluator/EvaluateSubmission";

// Test Pages
import TakeObjectiveTest from "./pages/test/TakeObjectiveTest";
import TestAnalysisPage from "./pages/test/TestAnalysisPage";
import FaqPage from "./pages/FaqPage";
import SchedulePage from "./pages/SchedulePage";
import ManageSchedule from "./pages/admin/ManageSchedule";
import ExamplePage from "./pages/ExamplePage";
import BuyNow from "./pages/BuyNow";
import PaymentCheckout from "./pages/PaymentCheckout";
import PublicStudyMaterials from "./pages/PublicStudyMaterials";
import Forbidden from "./pages/Forbidden";
import PlanDetailPage from "./pages/PlanDetailPage";
import CartPage from "./pages/CartPage";
import CartCheckout from "./pages/CartCheckout";
import { CartProvider } from "./contexts/CartContext";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";

      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  useLayoutEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();

    const frameId = window.requestAnimationFrame(scrollToTop);
    const timeoutId = window.setTimeout(scrollToTop, 0);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [pathname, search, hash, key]);

  return null;
}

// Component to apply role session guard
function AppRoutes() {
  // This hook monitors localStorage changes across tabs and enforces single-role sessions
  useRoleSessionGuard();

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/buy-now" element={<BuyNow />} />
      <Route path="/payment/checkout" element={<PaymentCheckout />} />
      <Route path="/payment/cart-checkout" element={<CartCheckout />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/resources" element={<PublicStudyMaterials />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/blogs" element={<BlogsPage />} />
      <Route path="/blogs/:slugOrId" element={<BlogDetailPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes - General (require login but no specific role) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/test-series" element={<TestSeriesPage />} />
        <Route
          path="/test-series/:id"
          element={<PublicTestSeriesDetail />}
        />
        <Route path="/plans/:planId" element={<PlanDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Route>

      {/* Student Protected Routes */}
      <Route element={<RoleProtectedRoute roles={["STUDENTS"]} />}>
        <Route element={<ProtectedRoute />}>
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />
          <Route path="/student/courses" element={<MyCourses />} />
          <Route path="/student/history" element={<TestHistory />} />
          <Route path="/student/analytics" element={<AnalyticsPage />} />
          <Route
            path="/student/purchases"
            element={<PurchaseHistory />}
          />
          <Route
            path="/student/contact-support"
            element={<ContactSupport />}
          />
          <Route path="/student/profile" element={<ProfilePage />} />
          <Route path="/student/settings" element={<StudentSettings />} />
          <Route path="/student/free-resources" element={<Resources />} />
          <Route path="/student/resources" element={<Resources />} />
          <Route
            path="/student/test-series/:id"
            element={<TestSeriesDetail />}
          />
          <Route
            path="/student/test-status"
            element={<TestSeriesStatus />}
          />
          {/* Test pages accessible to students */}
          <Route path="/test/:id" element={<TakeObjectiveTest />} />
          <Route
            path="/test/:id/analysis"
            element={<TestAnalysisPage />}
          />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<RoleProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/tests" element={<TestSeriesManagement />} />
          <Route path="/admin/orders" element={<OrdersManagement />} />
          <Route
            path="/admin/tests/create"
            element={<CreateTestSeries />}
          />
          <Route path="/admin/create-test" element={<CreateTest />} />
          <Route
            path="/admin/tests/edit/:id"
            element={<EditTestSeries />}
          />
          <Route path="/admin/plans" element={<PlansManagement />} />
          <Route path="/admin/plans/create" element={<CreatePlan />} />
          <Route path="/admin/plans/:planId/edit" element={<CreatePlan />} />
          <Route
            path="/admin/students"
            element={<StudentsManagement />}
          />
          <Route path="/admin/students/:id" element={<StudentDetail />} />
          <Route
            path="/admin/evaluators"
            element={<EvaluatorsManagement />}
          />
          <Route
            path="/admin/evaluators/:id"
            element={<EvaluatorDetail />}
          />
          <Route
            path="/admin/evaluator-feedbacks"
            element={<EvaluatorFeedbacks />}
          />
          <Route
            path="/admin/evaluations"
            element={<EvaluationsManagement />}
          />
          <Route
            path="/admin/support-tickets"
            element={<SupportTickets />}
          />
          <Route path="/admin/enquiries" element={<ManageEnquiries />} />
          <Route
            path="/admin/study-materials"
            element={<StudyMaterialManagement />}
          />
          <Route path="/admin/schedule" element={<ManageSchedule />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/blogs" element={<AdminBlogsPage />} />
          <Route
            path="/admin/blogs/:action/:id"
            element={<BlogEditorPage />}
          />
        </Route>
      </Route>

      {/* Evaluator Protected Routes */}
      <Route
        element={<RoleProtectedRoute roles={["EVALUATOR", "ADMIN"]} />}
      >
        <Route element={<ProtectedRoute />}>
          <Route
            path="/evaluator/dashboard"
            element={<EvaluatorDashboard />}
          />
          <Route
            path="/evaluator/pending"
            element={<PendingEvaluations />}
          />
          <Route
            path="/evaluator/completed"
            element={<CompletedEvaluations />}
          />
          <Route
            path="/evaluator/profile"
            element={<EvaluatorProfile />}
          />
          <Route
            path="/evaluator/settings"
            element={<EvaluatorSettings />}
          />
          <Route
            path="/evaluator/evaluate/:submissionId"
            element={<EvaluateSubmission />}
          />
        </Route>
      </Route>

      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Example Page */}
      <Route path="/example" element={<ExamplePage />} />

      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CartProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
