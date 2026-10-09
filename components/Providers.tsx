'use client';

import React from 'react';
import { AuthProvider } from '@/src/context/AuthContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
