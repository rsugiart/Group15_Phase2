import React from "react";
import { Navigate } from "react-router-dom";

interface UseAuthProps {
  permissions: string[]; // Allowed roles for the route
  permission: string; // Current user's role
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<UseAuthProps> = ({permissions, permission, children }) => {
  if (!permissions.includes(permission)) {
    // Redirect to an unauthorized page or login page if the user role is not allowed
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;