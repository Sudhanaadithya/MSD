import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = () => {
  return (
    <div className="bg-background font-body-md text-on-surface flex min-h-screen">
      <Sidebar />
      <div className="pl-72 w-full flex flex-col">
        <Header />
        <main className="pt-20 flex-1 p-lg bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
