import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, Tag, theme } from 'antd';
import {
  DashboardOutlined,
  FileDoneOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ApartmentOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  BellOutlined,
  ApiOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get active menu key based on pathname
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/imports')) return 'imports';
    if (path.startsWith('/catalog')) return 'catalog';
    if (path.startsWith('/templates')) return 'templates';
    if (path.startsWith('/workflows')) return 'workflows';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan Vận hành',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'reports',
      icon: <FileDoneOutlined />,
      label: 'Trung tâm Báo cáo',
      onClick: () => navigate('/reports'),
    },
    {
      key: 'imports',
      icon: <CloudUploadOutlined />,
      label: 'Nhập liệu & Duyệt Batch',
      onClick: () => navigate('/imports'),
    },
    {
      key: 'catalog',
      icon: <DatabaseOutlined />,
      label: 'Danh mục & Kỳ Dữ liệu',
      onClick: () => navigate('/catalog'),
    },
    {
      key: 'templates',
      icon: <SettingOutlined />,
      label: 'Cấu hình Biểu mẫu & Rules',
      onClick: () => navigate('/templates'),
    },
    {
      key: 'workflows',
      icon: <ApartmentOutlined />,
      label: 'Quy trình Phê duyệt',
      onClick: () => navigate('/workflows'),
    },
    {
      key: 'settings',
      icon: <ApiOutlined />,
      label: 'Cấu hình Webhook & n8n',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sider with deep navy corporate blue */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        style={{
          background: '#001A44',
          boxShadow: '2px 0 8px rgba(0, 26, 68, 0.15)',
        }}
      >
        {/* Brand Logo Header */}
        <div
          style={{
            height: 70,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0 18px' : '0 20px',
            background: '#001435',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          onClick={() => navigate('/dashboard')}
        >
          {/* KT Icon Badge */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#0047A5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: -0.5,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 71, 165, 0.4)',
            }}
          >
            KT
          </div>

          {!collapsed && (
            <div style={{ marginLeft: 12, lineHeight: 1.2 }}>
              <div
                style={{
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: '0.5px',
                }}
              >
                KT TECHNOLOGY
              </div>
              <div
                style={{
                  color: '#93C5FD',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.8px',
                }}
              >
                TT15 REPORTING
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          selectedKeys={[getSelectedKey()]}
          mode="inline"
          items={menuItems}
          style={{
            background: 'transparent',
            marginTop: 10,
            fontSize: 14,
          }}
        />
      </Sider>

      {/* Main Content Area */}
      <Layout>
        {/* Top Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <div>
            <Text strong style={{ fontSize: 16, color: '#002B66' }}>
              Hệ Thống Báo Cáo Thông Tư 15 / CIC
            </Text>
            <Tag color="processing" style={{ marginLeft: 12, borderRadius: 10 }}>
              <CheckCircleOutlined /> Spring Boot 3 + PostgreSQL
            </Tag>
          </div>

          <Space size="large">
            <Tag color="#003B95" style={{ padding: '2px 10px', borderRadius: 4, fontWeight: 600 }}>
              KT CORP UAT
            </Tag>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'user-info',
                    label: 'Thông tin tài khoản',
                    icon: <UserOutlined />,
                  },
                  {
                    key: 'logout',
                    label: 'Đăng xuất',
                    icon: <LogoutOutlined />,
                    danger: true,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  style={{
                    backgroundColor: '#003B95',
                    verticalAlign: 'middle',
                    fontWeight: 700,
                  }}
                  size="default"
                >
                  KT
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>
                    Chuyên viên Báo cáo
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    KT Technology
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Page Content */}
        <Content
          style={{
            margin: '20px 24px',
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>

        {/* Footer */}
        <Footer
          style={{
            textAlign: 'center',
            padding: '12px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            color: '#64748B',
            fontSize: 12,
          }}
        >
          <Text strong style={{ color: '#003B95' }}>
            KT TECHNOLOGY COMPANY LTD
          </Text>{' '}
          — COMMITTED TO VALUE © {new Date().getFullYear()} TT15 Regulatory Reporting System
        </Footer>
      </Layout>
    </Layout>
  );
};
