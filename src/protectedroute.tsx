import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{
  redirectTo: string;
  children: React.ReactNode;
}> = ({ redirectTo, children }) => {
  const email = localStorage.getItem('email');
  const password = localStorage.getItem('password');

  if (email && password) {
    // Optionally, validate the credentials here
    return <>{children}</>;
  } else {
    return <Navigate to={redirectTo} />;
  }
};

export default ProtectedRoute;
