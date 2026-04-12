import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasAppAccess, isAdminUser } from "@/lib/access";

interface AccessGateProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

const AccessGate = ({ children, requireAdmin = false }: AccessGateProps) => {
  const { loading, user, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin) {
    if (!isAdminUser(profile)) return <Navigate to="/" replace />;
    return children;
  }

  if (!hasAppAccess(profile)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AccessGate;