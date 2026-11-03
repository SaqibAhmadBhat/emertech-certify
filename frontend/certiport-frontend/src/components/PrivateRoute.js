// import React from 'react';
import { Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        // No token → redirect to login
        return <Navigate to="/login" />;
    }

    try {
        const decoded = jwtDecode(token);

        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            return <Navigate to="/login" />;
        }

        // Token valid → render children
        return children;
    } catch (error) {
        console.error('Invalid token', error);
        localStorage.removeItem('token');
        return <Navigate to="/login" />;
    }
};

export default PrivateRoute;
