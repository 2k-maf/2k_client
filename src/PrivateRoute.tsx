import React, {ReactElement} from 'react';
import { Navigate, useLocation } from 'react-router-dom'
import {useAuth} from "./AuthProvider";
export const PrivateRoute = ({Component} : { Component: any }) => {
  const { token } = useAuth();
  const { pathname, search } = useLocation();
  if (!token) {
    // Після входу SignIn повертає користувача на цю сторінку, а не на головну.
    return <Navigate to="/login" replace state={{ from: pathname + search }} />
  }
  return(<Component />)
}