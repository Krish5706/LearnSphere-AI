import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Security: ProtectedRoute
 * This wrapper component checks for a valid session token in localStorage.
 * If no token exists, it redirects the user to the login page and saves 
 * their intended location for a better user experience after login.
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    // In a production app, you would verify the token's validity with the backend
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them back after they login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;