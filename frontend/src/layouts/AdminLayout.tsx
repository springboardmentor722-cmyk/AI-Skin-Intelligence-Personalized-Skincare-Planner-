import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Outlet />
    </div>
  );
}
