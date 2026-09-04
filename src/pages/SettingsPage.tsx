import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Typography,
  Switch,
  Select,
  Tag,
  Space,
  Divider,
  Alert,
  message,
  Descriptions,
  Tabs,
  Badge,
  Spin,
  Tooltip,
} from 'antd';
import {
  ApiOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  KeyOutlined,
  FileZipOutlined,
  FileTextOutlined,
  LinkOutlined,
  BankOutlined,
  IdcardOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  UndoOutlined,
  CodeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { reportingApi } from '@/api/reporting.api';
import type { ReportDeliveryConfig } from '@/types';
import {
  getAgencyNamingRules,
  saveAgencyNamingRules,
  generateFileNamePreview,
  DEFAULT_NAMING_RULES,
  type AgencyNamingRule,
} from '@/utils/namingRuleUtil';

const { Title, Text, Paragraph } = Typography;

export const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [configs, setConfigs] = useState<ReportDeliveryConfig[]>([]);
  const [activeDestination, setActiveDestination] = useState<string>('CIC');
  const [systemProfile, setSystemProfile] = useState<{ reportingUnitCode: string; reporterName: string } | null>(null);

  // Naming rules state for each agency (CIC, SBV, PCB)
  const [namingRules, setNamingRules] = useState<Record<string, AgencyNamingRule>>(getAgencyNamingRules());

  // Load configs from Backend Database
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await reportingApi.getDeliveryConfigs();
      if (Array.isArray(data) && data.length > 0) {
        setConfigs(data);
        const current = data.find((c) => c.destination.toUpperCase() === activeDestination.toUpperCase()) || data[0];
        setActiveDestination(current.destination);
        fillFormValues(current);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải cấu hình từ DB:', err);
      const local = localStorage.getItem('tt15_webhook_settings');
      if (local) {
        try {
          form.setFieldsValue(JSON.parse(local));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    setNamingRules(getAgencyNamingRules());
    reportingApi.getSystemProfile()
      .then((res: any) => {
        if (res && res.reportingUnitCode) {
          setSystemProfile(res);
        }
      })
      .catch((err) => console.log('Profile fetch error:', err));
  }, []);

  const fillFormValues = (config: ReportDeliveryConfig) => {
    form.setFieldsValue({
      destination: config.destination,
      name: config.name,
      webhookUrl: config.webhookUrl,
      authToken: config.authToken,
      callbackUrl: config.callbackUrl || 'http://localhost:8080/api/report-deliveries/callback',
      callbackToken: config.callbackToken || '',
      isEnabled: config.isEnabled,
      isMock: config.isMock,
      timeoutMs: config.timeoutMs || 30000,
      description: config.description || '',
    });
  };

  const handleTabChange = (destKey: string) => {
    setActiveDestination(destKey);
    setTestResponse(null);
    const found = configs.find((c) => c.destination.toUpperCase() === destKey.toUpperCase());
    if (found) {
      fillFormValues(found);
    }
  };

  const currentRule: AgencyNamingRule =
    namingRules[activeDestination] ||
    DEFAULT_NAMING_RULES[activeDestination] ||
    DEFAULT_NAMING_RULES.CIC;

  const handleRuleChange = (field: keyof AgencyNamingRule, value: any) => {
    setNamingRules((prev) => {
      const next = {
        ...prev,
        [activeDestination]: {
          ...(prev[activeDestination] || DEFAULT_NAMING_RULES[activeDestination] || DEFAULT_NAMING_RULES.CIC),
          [field]: value,
        },
      };
      saveAgencyNamingRules(next);
      return next;
    });
  };

  const handleResetRuleToDefault = () => {
    const defaultRule = DEFAULT_NAMING_RULES[activeDestination];
    if (defaultRule) {
      setNamingRules((prev) => {
        const next = { ...prev, [activeDestination]: { ...defaultRule } };
        saveAgencyNamingRules(next);
        return next;
      });
      message.info(`Đã khôi phục quy chuẩn đặt tên mặc định của ${activeDestination}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updated = await reportingApi.updateDeliveryConfig(activeDestination, {
        name: values.name,
        webhookUrl: values.webhookUrl,
        authToken: values.authToken,
        callbackUrl: values.callbackUrl,
        callbackToken: values.callbackToken,
        isEnabled: values.isEnabled,
        isMock: values.isMock,
        timeoutMs: values.timeoutMs,
        description: values.description,
      });

      // Update local state list
      setConfigs((prev) =>
        prev.map((c) => (c.destination.toUpperCase() === activeDestination.toUpperCase() ? updated : c))
      );

      // Save naming rules
      saveAgencyNamingRules(namingRules);

      message.success(`Đã lưu cấu hình cổng ${activeDestination} và Quy chuẩn đặt tên thành công!`);
    } catch (err: any) {
      console.error('Lỗi lưu cấu hình:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPing = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      setTestResponse(null);

      const startTime = Date.now();
      const testPayload = {
        correlationId: `PING-TEST-${Date.now()}`,
        reportVersionId: '00000000-0000-0000-0000-000000000000',
        reportCode: activeDestination === 'CIC' ? 'D10' : activeDestination === 'SBV' ? 'B01' : 'PCB_01',
        versionNumber: 1,
        reportingDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        callbackUrl: values.callbackUrl,
        destination: activeDestination,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (values.authToken) {
        headers['Authorization'] = `Bearer ${values.authToken}`;
      }

      const res = await fetch(values.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
      });

      const latency = Date.now() - startTime;
      const data = await res.json().catch(() => ({}));

      setTestResponse({
        httpStatus: res.status,
        latency,
        data,
      });

      if (res.status === 202 || res.status === 200) {
        message.success(`Webhook ${activeDestination} phản hồi HTTP ${res.status} (${latency}ms) thành công!`);
      } else {
        message.warning(`Webhook ${activeDestination} phản hồi mã HTTP ${res.status}`);
      }
    } catch (err: any) {
      setTestResponse({
        httpStatus: 'Error',
        latency: 0,
        error: err?.message || 'Không thể gửi request đến Webhook',
      });
      message.error(`Lỗi kết nối tới Webhook endpoint của ${activeDestination}`);
    } finally {
      setTesting(false);
    }
  };

  const currentConfig = configs.find((c) => c.destination.toUpperCase() === activeDestination.toUpperCase());

  // Dynamic preview sample code based on destination
  const sampleReportCode = activeDestination === 'CIC' ? 'D10' : activeDestination === 'SBV' ? 'B01' : 'PCB_01';
  const previewFileName = generateFileNamePreview({
    reportCode: sampleReportCode,
    agency: activeDestination,
    unitCode: currentRule.unitCode,
    reportingDate: '20260831',
    sequence: 1,
    customPattern: currentRule.pattern,
  });

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              <ApiOutlined style={{ marginRight: 8, color: '#003B95' }} />
              Cấu Hình Cổng Báo Cáo & Quy Chuẩn Đặt Tên Tệp
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Quản lý tập trung Webhook giao tiếp và Quy chuẩn đặt tên tệp nén nộp báo cáo cho từng cơ quan (CIC, SBV, PCB).
            </Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchConfigs} loading={loading}>
                Làm mới
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                loading={testing}
                onClick={handleTestPing}
                style={{ borderColor: '#003B95', color: '#003B95', fontWeight: 600 }}
              >
                Gửi Thử Nghiệm (Test Ping)
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                style={{ background: '#003B95', fontWeight: 600 }}
                onClick={handleSaveSettings}
              >
                Lưu Toàn Bộ Cấu Hình
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Test Response Alert */}
      {testResponse && (
        <Alert
          message={
            <Space>
              <Badge
                status={testResponse.httpStatus === 202 || testResponse.httpStatus === 200 ? 'success' : 'error'}
                text={
                  <Text strong>
                    Phản hồi từ Webhook {activeDestination}: HTTP {testResponse.httpStatus} ({testResponse.latency} ms)
                  </Text>
                }
              />
            </Space>
          }
          description={
            <pre style={{ margin: '8px 0 0 0', padding: 8, background: '#F1F5F9', borderRadius: 4, fontSize: 12 }}>
              {JSON.stringify(testResponse.data || testResponse.error, null, 2)}
            </pre>
          }
          type={testResponse.httpStatus === 202 || testResponse.httpStatus === 200 ? 'success' : 'error'}
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      {/* Tabs for Each Destination */}
      <Card style={{ borderRadius: 8 }}>
        <Tabs
          activeKey={activeDestination}
          onChange={handleTabChange}
          type="card"
          items={[
            {
              key: 'CIC',
              label: (
                <span>
                  <BankOutlined style={{ marginRight: 6 }} />
                  Cổng CIC (H2H)
                  {configs.find((c) => c.destination === 'CIC')?.isEnabled ? (
                    <Tag color="success" style={{ marginLeft: 6 }}>
                      Active
                    </Tag>
                  ) : (
                    <Tag color="default" style={{ marginLeft: 6 }}>
                      Off
                    </Tag>
                  )}
                </span>
              ),
            },
            {
              key: 'SBV',
              label: (
                <span>
                  <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                  Cổng SBV (NHNN)
                  {configs.find((c) => c.destination === 'SBV')?.isEnabled ? (
                    <Tag color="success" style={{ marginLeft: 6 }}>
                      Active
                    </Tag>
                  ) : (
                    <Tag color="default" style={{ marginLeft: 6 }}>
                      Off
                    </Tag>
                  )}
                </span>
              ),
            },
            {
              key: 'PCB',
              label: (
                <span>
                  <GlobalOutlined style={{ marginRight: 6 }} />
                  Cổng PCB
                  {configs.find((c) => c.destination === 'PCB')?.isEnabled ? (
                    <Tag color="success" style={{ marginLeft: 6 }}>
                      Active
                    </Tag>
                  ) : (
                    <Tag color="default" style={{ marginLeft: 6 }}>
                      Off
                    </Tag>
                  )}
                </span>
              ),
            },
          ]}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="Đang tải cấu hình từ máy chủ..." />
          </div>
        ) : (
          <Row gutter={[24, 16]}>
            {/* Main Form */}
            <Col xs={24} lg={15}>
              <Form form={form} layout="vertical">
                {/* 1. Naming Rule Section (Top Priority according to user philosophy) */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Space>
                      <FileZipOutlined style={{ fontSize: 18, color: '#003B95' }} />
                      <Text strong style={{ fontSize: 14, color: '#002B66' }}>
                        Quy Chuẩn Đặt Tên Tệp Nén Nộp Báo Cáo ({activeDestination})
                      </Text>
                      <Tag color={activeDestination === 'CIC' ? 'blue' : activeDestination === 'SBV' ? 'green' : 'purple'}>
                        Gốc ({activeDestination})
                      </Tag>
                    </Space>
                    <Button
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={handleResetRuleToDefault}
                      style={{ fontSize: 12 }}
                    >
                      Khôi phục chuẩn {activeDestination}
                    </Button>
                  </div>

                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item
                        label={
                          <Space size={4}>
                            <span>Mã Đơn Vị TCTD ({'{UNIT_CODE}'})</span>
                            {systemProfile?.reportingUnitCode && (
                              <Tooltip title="Mã đơn vị khai báo gốc trong application.yaml (Click để áp dụng)">
                                <Tag
                                  color="cyan"
                                  style={{ cursor: 'pointer', fontSize: 11, marginInlineEnd: 0 }}
                                  onClick={() => handleRuleChange('unitCode', systemProfile.reportingUnitCode)}
                                >
                                  yaml: {systemProfile.reportingUnitCode}
                                </Tag>
                              </Tooltip>
                            )}
                          </Space>
                        }
                        tooltip="Mã TCTD gửi báo cáo (VD: PTF cho CIC/PCB, 79301001 cho SBV, hoặc lấy từ application.yaml)"
                        style={{ marginBottom: 12 }}
                      >
                        <Input
                          value={currentRule.unitCode}
                          onChange={(e) => handleRuleChange('unitCode', e.target.value.toUpperCase().trim())}
                          placeholder="VD: PTF"
                          style={{ fontWeight: 600 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item
                        label="Cấu Trúc Tên Tệp (Formula)"
                        tooltip="Biến hỗ trợ: {REPORT_CODE}, {UNIT_CODE}, {DATE}, {SEQUENCE}, {EXT}"
                        style={{ marginBottom: 12 }}
                      >
                        <Input
                          value={currentRule.pattern}
                          onChange={(e) => handleRuleChange('pattern', e.target.value)}
                          placeholder="{REPORT_CODE}{UNIT_CODE}{DATE}.{SEQUENCE}.zip"
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Định Dạng Mở Rộng" style={{ marginBottom: 12 }}>
                        <Select
                          value={currentRule.extension}
                          onChange={(val) => handleRuleChange('extension', val)}
                          options={[
                            { value: '.zip', label: '.zip (Tệp nén)' },
                            { value: '.xml', label: '.xml (File XML)' },
                            { value: '.json', label: '.json (File JSON)' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Live preview banner in Settings */}
                  <div
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 6,
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>
                        ⚡ LIVE PREVIEW TÊN TỆP SINH RA THỰC TẾ (MẪU {sampleReportCode}):
                      </Text>
                      <Tag
                        color={activeDestination === 'CIC' ? 'blue' : activeDestination === 'SBV' ? 'green' : 'purple'}
                        style={{ fontSize: 13, padding: '2px 10px', fontFamily: 'monospace', fontWeight: 700 }}
                      >
                        {previewFileName}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Căn cứ pháp lý: <strong>{currentRule.legalBasis}</strong>. Màn Tạo Biểu Mẫu sẽ tự động kế thừa và hiển thị Live Preview theo quy chuẩn này.
                    </Text>
                  </div>
                </div>

                {/* 2. Webhook Delivery Config */}
                <Divider style={{ margin: '16px 0' }}>Cấu Hình Cổng Webhook Giao Tiếp (n8n Endpoint)</Divider>

                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="name"
                      label="Tên Cổng Tiếp Nhận"
                      rules={[{ required: true, message: 'Vui lòng nhập tên cổng' }]}
                    >
                      <Input placeholder="Cổng Báo cáo Tín dụng CIC (H2H)" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name="isEnabled"
                      label="Trạng Thái"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name="isMock"
                      label="Chế Độ MOCK"
                      valuePropName="checked"
                      tooltip="Khi BẬT, Backend sẽ giả lập phản hồi 202 ngay mà không cần gọi ra n8n/gateway thật."
                    >
                      <Switch checkedChildren="MOCK" unCheckedChildren="THẬT" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="webhookUrl"
                  label={
                    <Space>
                      <span>Địa Chỉ Webhook Endpoint (n8n URL)</span>
                      <Tooltip title="URL của Webhook trên n8n dành riêng cho cổng này">
                        <Tag color="blue">{activeDestination}</Tag>
                      </Tooltip>
                    </Space>
                  }
                  rules={[{ required: true, message: 'Vui lòng nhập Webhook URL' }]}
                >
                  <Input
                    prefix={<LinkOutlined style={{ color: '#64748B' }} />}
                    placeholder={`http://localhost:5678/webhook/tt15-${activeDestination.toLowerCase()}-report-delivery`}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="authToken"
                      label="Webhook Bearer Token (Nếu n8n yêu cầu)"
                    >
                      <Input.Password
                        placeholder="Bearer token gửi sang n8n Webhook"
                        prefix={<KeyOutlined style={{ color: '#64748B' }} />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="timeoutMs"
                      label="Thời Gian Chờ Tối Đa (Timeout ms)"
                    >
                      <Select>
                        <Select.Option value={15000}>15 giây (15,000 ms)</Select.Option>
                        <Select.Option value={30000}>30 giây (30,000 ms)</Select.Option>
                        <Select.Option value={60000}>60 giây (60,000 ms)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0 16px 0' }}>Cấu Hình Phản Hồi Trạng Thái (Callback)</Divider>

                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      name="callbackUrl"
                      label="Callback URL (Nhận kết quả từ n8n)"
                    >
                      <Input
                        prefix={<LinkOutlined style={{ color: '#64748B' }} />}
                        placeholder="http://localhost:8080/api/report-deliveries/callback"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      name="callbackToken"
                      label="X-TT15-Callback-Token (Bảo mật callback)"
                    >
                      <Input.Password
                        placeholder="Token xác thực callback"
                        prefix={<KeyOutlined style={{ color: '#64748B' }} />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="description" label="Ghi Chú / Mô Tả Kênh">
                  <Input.TextArea rows={2} placeholder="Mô tả mục đích và cơ chế truyền nhận..." />
                </Form.Item>
              </Form>
            </Col>

            {/* Spec Card */}
            <Col xs={24} lg={9}>
              <Card
                title={`Đặc Tả Luồng Truyền: ${activeDestination}`}
                size="small"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, marginBottom: 16 }}
              >
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Đích Tiếp Nhận">
                    <Tag color={activeDestination === 'CIC' ? 'blue' : activeDestination === 'SBV' ? 'green' : 'purple'} style={{ fontWeight: 600 }}>
                      {activeDestination}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Cơ Chế Gửi">
                    <Text strong>multipart/form-data</Text> (metadata JSON + ZIP/XML artifact)
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã Gốc (application.yaml)">
                    <Space>
                      <Tag color="geekblue" style={{ fontWeight: 600 }}>
                        {systemProfile?.reportingUnitCode || '79301001'}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>({systemProfile?.reporterName || 'Pham Maker'})</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Định Dạng Tệp Nộp">
                    <Tag color="cyan" style={{ fontFamily: 'monospace' }}>
                      {currentRule.extension}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mẫu Tên Tệp Chuẩn">
                    <Text code style={{ fontSize: 11 }}>
                      {previewFileName}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Chế Độ Vận Hành">
                    {currentConfig?.isMock ? (
                      <Tag color="warning">MOCK (Giả lập phản hồi)</Tag>
                    ) : (
                      <Tag color="success">THẬT (Truyền n8n & Gateway)</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cập Nhật Lần Cuối">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {currentConfig?.updatedAt ? new Date(currentConfig.updatedAt).toLocaleString('vi-VN') : 'Mặc định khởi tạo'}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Convention Over Configuration Guide Card */}
              <Card
                title={
                  <Space>
                    <InfoCircleOutlined style={{ color: '#003B95' }} />
                    <span style={{ fontSize: 13 }}>Triết Lý Thiết Kế Quy Chuẩn</span>
                  </Space>
                }
                size="small"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6 }}
              >
                <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                  📌 <strong>Quy tắc vận hành:</strong>
                  <ul style={{ paddingLeft: 16, margin: '6px 0 0 0' }}>
                    <li>
                      <strong>Nơi lưu trữ quy tắc gốc:</strong> Được quản lý tập trung ngay tại trang này theo từng tab cơ quan (CIC / SBV / PCB).
                    </li>
                    <li>
                      <strong>Màn Tạo Biểu Mẫu:</strong> Tự động nhận diện cơ quan và hiển thị <strong>Live Preview</strong> tên tệp sẽ sinh ra. Người dùng không cần nhập liệu thủ công rườm rà.
                    </li>
                    <li>
                      <strong>Độ chuẩn xác 100%:</strong> Tên file nén luôn đáp ứng đúng quy định của CIC, SBV và PCB trước khi nộp.
                    </li>
                  </ul>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
};
