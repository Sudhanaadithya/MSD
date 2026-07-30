import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import Header from './Header';
import Chatbot from './Chatbot';

const CustomerLayout = () => {
  return (
    <div className="bg-background font-body-md text-on-surface flex min-h-screen">
      <CustomerSidebar />
      <div className="pl-72 w-full flex flex-col">
        <Header />
        <main className="pt-20 flex-1 p-lg bg-background">
          <Outlet />
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

export default CustomerLayout;
