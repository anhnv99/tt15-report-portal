import React from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ImportsPage } from '@/pages/ImportsPage';
import { CatalogPage } from '@/pages/CatalogPage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { WorkflowsPage } from '@/pages/WorkflowsPage';
import { SettingsPage } from '@/pages/SettingsPage';

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
      <BrowserRouter>
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
    </ConfigProvider>
  );
};

export default App;
