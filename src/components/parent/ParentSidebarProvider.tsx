'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

type ParentSidebarContextType = {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
};

const ParentSidebarContext = createContext<ParentSidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

export const ParentSidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <ParentSidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </ParentSidebarContext.Provider>
  );
};

export const useParentSidebar = () => useContext(ParentSidebarContext);
