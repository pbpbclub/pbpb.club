import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import GanttCalendar from '@/pages/GanttCalendar';
import Materials from '@/pages/Materials';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import Masters from '@/pages/Masters';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:clientId" element={<ClientDetail />} />
            <Route path="/masters" element={<Masters />} />
            <Route path="/calendar" element={<GanttCalendar />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/settings" element={<div className="p-8"><h1 className="text-4xl font-bold">Настройки</h1></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;