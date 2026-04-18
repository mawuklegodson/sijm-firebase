
import React, { useEffect } from 'react';
import Navbar from './Navbar.tsx';
import Footer from './Footer.tsx';

interface WebsiteLayoutProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
  store: any;
  currentPage: string;
}

const WebsiteLayout: React.FC<WebsiteLayoutProps> = ({ children, onNavigate, store, currentPage }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-amber-400 selection:text-indigo-950">
      <Navbar onNavigate={onNavigate} store={store} currentPage={currentPage} />
      <main className="pt-20">
        {children}
      </main>
      <Footer onNavigate={onNavigate} store={store} />
    </div>
  );
};

export default WebsiteLayout;
