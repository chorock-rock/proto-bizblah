import { createContext, useContext, useState } from 'react';

const AdminContext = createContext({});

export const useAdmin = () => {
  return useContext(AdminContext);
};

const ADMIN_PASSWORD = 'abcd123457';

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => {
    // 세션 스토리지에서 관리자 상태 확인
    return sessionStorage.getItem('isAdmin') === 'true';
  });

  const loginAdmin = (password) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
  };

  const value = {
    isAdmin,
    loginAdmin,
    logoutAdmin
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
