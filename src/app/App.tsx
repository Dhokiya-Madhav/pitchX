import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import IndexPage from "@/features/landing/pages/IndexPage";
import NotFound from "@/features/not-found/pages/NotFound";
import AuthPage from "@/features/auth/pages/AuthPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import GroundsPage from "@/features/grounds/pages/GroundsPage";
import GroundDetailPage from "@/features/grounds/pages/GroundDetailPage";
import BookingsPage from "@/features/bookings/pages/BookingsPage";
import OwnerDashboard from "@/features/owner/pages/OwnerDashboard";
import OwnerEditGroundPage from "@/features/owner/pages/OwnerEditGroundPage";
import OwnerProfilePage from "@/features/owner/pages/OwnerProfilePage";
import ProfilePage from "@/features/auth/pages/ProfilePage";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<IndexPage />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
    <Route path="/grounds" element={<GroundsPage />} />
    <Route path="/grounds/:id" element={<GroundDetailPage />} />
    <Route
      path="/bookings"
      element={
        <ProtectedRoute requireOwner={false}>
          <BookingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/owner/dashboard"
      element={
        <ProtectedRoute requireOwner>
          <OwnerDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/owner/grounds/:id/edit"
      element={
        <ProtectedRoute requireOwner>
          <OwnerEditGroundPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/owner/profile"
      element={
        <ProtectedRoute requireOwner>
          <OwnerProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
