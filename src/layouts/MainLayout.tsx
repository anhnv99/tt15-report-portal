import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Typography,
  Dropdown,
  Space,
  Tag,
  theme,
  Modal,
  Input,
  Button,
  message,
  Tooltip,
  Avatar,
} from 'antd';
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
  ApiOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getActiveBaseURL, setCustomBaseURL } from '@/api/client';
import axios from 'axios';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState(getActiveBaseURL());
  const [inputUrl, setInputUrl] = useState(getActiveBaseURL());
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [pingError, setPingError] = useState<string>('');

  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleTestPing = async (targetUrl?: string) => {
    const url = targetUrl || inputUrl;
    setPingStatus('testing');
    setPingLatency(null);
    setPingError('');
    const startTime = Date.now();
    try {
      const pingEndpoint = url.endsWith('/') ? `${url}report-templates` : `${url}/report-templates`;
      await axios.get(pingEndpoint, { timeout: 8000 });
      const duration = Date.now() - startTime;
      setPingLatency(duration);
      setPingStatus('ok');
    } catch (err: any) {
      setPingStatus('fail');
      setPingError(err?.message || 'Không thể kết nối tới máy chủ');
    }
  };

  const handleSaveApiUrl = (newUrl: string) => {
    setCustomBaseURL(newUrl);
    message.success('Đã lưu cấu hình API máy chủ! Trang web sẽ được tải lại...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleResetDefault = () => {
    setCustomBaseURL('');
    message.success('Đã khôi phục cấu hình máy chủ về mặc định!');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

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
          {/* RegOne Icon Badge */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: '#0B2A6B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(30, 99, 255, 0.3)',
              overflow: 'hidden',
              padding: 2,
            }}
          >
            <img
              src="/regone-icon-transparent.png"
              alt="RegOne"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {!collapsed && (
            <div style={{ marginLeft: 12, lineHeight: 1.15, overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 19,
                  letterSpacing: '-0.3px',
                  display: 'flex',
                  alignItems: 'baseline',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                <span style={{ color: '#FFFFFF' }}>Reg</span>
                <span style={{ color: '#38BDF8', marginLeft: 1 }}>One</span>
              </div>
              <div
                style={{
                  color: '#94A3B8',
                  fontSize: 8.5,
                  fontWeight: 500,
                  letterSpacing: '0.2px',
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  marginTop: 2,
                }}
              >
                One platform for regulatory reporting
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
            <Text strong style={{ fontSize: 16, color: '#0B2A6B' }}>
              RegOne — Nền Tảng Báo Cáo Tuân Thủ & CIC
            </Text>
            <Tag color="processing" style={{ marginLeft: 12, borderRadius: 10 }}>
              <CheckCircleOutlined /> Spring Boot 3 + PostgreSQL
            </Tag>
          </div>

          <Space size="middle">
            {/* API Connection Indicator & Switcher */}
            <Tooltip title="Nhấp để kiểm tra hoặc chuyển đổi máy chủ API (Localhost :8080 / Render Cloud)">
              <Tag
                color={currentApiUrl.includes('localhost') || currentApiUrl.startsWith('/api') ? 'green' : 'geekblue'}
                style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onClick={() => {
                  setInputUrl(getActiveBaseURL());
                  setApiModalOpen(true);
                  handleTestPing(getActiveBaseURL());
                }}
              >
                <ThunderboltOutlined />
                <span>
                  API:{' '}
                  {currentApiUrl.includes('localhost') || currentApiUrl.startsWith('/api')
                    ? 'Localhost (:8080)'
                    : 'Render Cloud'}
                </span>
              </Tag>
            </Tooltip>

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
                    key: 'api-config',
                    label: 'Cấu hình Máy Chủ API',
                    icon: <ApiOutlined />,
                    onClick: () => setApiModalOpen(true),
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
          <Text strong style={{ color: '#0B2A6B' }}>
            RegOne
          </Text>{' '}
          — One platform for regulatory reporting &copy; {new Date().getFullYear()}. All rights reserved.
        </Footer>
      </Layout>

      {/* API Server Switcher Modal */}
      <Modal
        title={
          <Space>
            <ApiOutlined style={{ color: '#003B95' }} />
            <span>Cấu Hình & Kiểm Tra Máy Chủ Backend API</span>
          </Space>
        }
        open={apiModalOpen}
        onCancel={() => setApiModalOpen(false)}
        footer={null}
        width={560}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Hệ thống cho phép Frontend gọi trực tiếp tới backend cục bộ (Localhost) hoặc máy chủ đám mây (Render Cloud).
            </Text>
          </div>

          <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ marginBottom: 6 }}>
              <Text strong>Máy chủ đang kích hoạt:</Text>{' '}
              <Text code copyable>{currentApiUrl}</Text>
            </div>
            <div>
              <Text strong>Độ trễ phản hồi (Latency):</Text>{' '}
              {pingStatus === 'testing' && <Tag color="processing">Đang kiểm tra kết nối...</Tag>}
              {pingStatus === 'ok' && (
                <Tag color={pingLatency && pingLatency < 300 ? 'success' : 'warning'}>
                  🟢 Hoạt động tốt: {pingLatency} ms
                </Tag>
              )}
              {pingStatus === 'fail' && (
                <Tag color="error">
                  🔴 Mất kết nối / Network Error ({pingError})
                </Tag>
              )}
              <Button size="small" type="link" onClick={() => handleTestPing()}>
                Kiểm tra lại (Ping)
              </Button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Chọn nhanh máy chủ kết nối:
            </Text>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                style={{ textAlign: 'left', height: 'auto', padding: '10px 14px' }}
                onClick={() => {
                  setInputUrl('/api');
                  handleSaveApiUrl('/api');
                }}
              >
                <div>
                  <Text strong style={{ color: '#10B981' }}>🟢 Localhost Proxy (/api → localhost:8080)</Text>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Dành cho khi bạn đang chạy Frontend trên máy tính local</div>
                </div>
              </Button>

              <Button
                block
                style={{ textAlign: 'left', height: 'auto', padding: '10px 14px' }}
                onClick={() => {
                  setInputUrl('https://tt15-report.onrender.com/api');
                  handleSaveApiUrl('https://tt15-report.onrender.com/api');
                }}
              >
                <div>
                  <Text strong style={{ color: '#003B95' }}>☁️ Render Cloud Backend (tt15-report.onrender.com)</Text>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Máy chủ API công khai trên Cloud (Dùng cho bản deploy Vercel)</div>
                </div>
              </Button>
            </Space>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              Hoặc nhập URL Backend tùy chỉnh:
            </Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="VD: http://localhost:8080/api hoặc https://..."
              />
              <Button type="primary" onClick={() => handleSaveApiUrl(inputUrl)}>
                Áp Dụng
              </Button>
            </Space.Compact>
          </div>

          <div style={{ textAlign: 'right', borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
            <Space>
              <Button onClick={handleResetDefault}>
                Khôi Phục Mặc Định
              </Button>
              <Button type="default" onClick={() => setApiModalOpen(false)}>
                Đóng
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
