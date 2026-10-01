import React, { lazy } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ImportsPage = lazy(() => import('@/pages/ImportsPage').then(m => ({ default: m.ImportsPage })));
const CatalogPage = lazy(() => import('@/pages/CatalogPage').then(m => ({ default: m.CatalogPage })));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage').then(m => ({ default: m.TemplatesPage })));
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

export const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#003B95',
          colorLink: '#0047A5',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#003B95',
          borderRadius: 6,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Card: {
            headerHeight: 48,
          },
          Table: {
            headerBg: '#F1F5F9',
            headerColor: '#1E293B',
            headerSplitColor: '#E2E8F0',
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="deliveries" element={<Navigate to="/reports" replace />} />
              <Route path="imports" element={<ImportsPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
