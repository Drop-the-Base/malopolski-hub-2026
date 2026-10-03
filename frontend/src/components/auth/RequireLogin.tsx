import React, { useState } from 'react';
import { authStore } from '../../services/api';
import { LoginForm } from './LoginForm';

interface RequireLoginProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Pokazuje treść tylko zalogowanemu urzędnikowi / koordynatorowi; w przeciwnym razie formularz logowania. */
export const RequireLogin: React.FC<RequireLoginProps> = ({ title, description, children }) => {
  const [loggedIn, setLoggedIn] = useState(!!authStore.get());
  if (!loggedIn) return <LoginForm title={title} description={description} onLoggedIn={() => setLoggedIn(true)} />;
  return <>{children}</>;
};
