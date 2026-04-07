import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CheckIn from '@/pages/CheckIn';
import CheckOut from '@/pages/CheckOut';
import Visitors from '@/pages/Visitors';
import Hosts from '@/pages/Hosts';
import Passes from '@/pages/Passes';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

export default function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();
  useEffect(() => { if (isAuthenticated) fetchUser(); }, []);
  if (!isAuthenticated) return <Routes><Route path="*" element={<Login />} /></Routes>;
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="checkout" element={<CheckOut />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="hosts" element={<Hosts />} />
        <Route path="passes" element={<Passes />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}