import React from "react";
import { Navigate } from "react-router-dom";

interface UseAuthProps {
  permissions: string[]; // Allowed roles for the route
  permission: string; // Current user's role
  children: React.ReactNode;
}

/**
 * ProtectedRoute component to restrict access to specific routes based on user permissions.
 * Redirects unauthorized users to a login page or another specified route.
 *
 * @param {string[]} permissions - List of roles allowed to access the route.
 * @param {string} permission - Current user's role.
 * @param {React.ReactNode} children - The content to render if the user is authorized.
 * @returns {JSX.Element} - Rendered component or a redirect if the user is unauthorized.
 */
const ProtectedRoute: React.FC<UseAuthProps> = ({permissions, permission, children }) => {
  if (!permissions.includes(permission)) {
    // Redirect to an unauthorized page or login page if the user role is not allowed
    alert("You are not authorized to view this page");
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;