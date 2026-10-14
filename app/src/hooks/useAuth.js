import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

import { getStudentSession, getAdminSession } from '../services/authService.js';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    const student = getStudentSession();
    const admin = getAdminSession();
    return {
      student,
      isStudentAuthenticated: Boolean(student),
      studentLogin: async () => {},
      studentRegister: async () => {},
      studentLogout: () => {},
      admin,
      isAdminAuthenticated: Boolean(admin),
      adminLogin: async () => {},
      adminLogout: () => {},
    };
  }
  return ctx;
}
