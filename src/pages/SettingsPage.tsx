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
  Table,
  Badge,
} from 'antd';
import {
  ApiOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SendOutlined,
  KeyOutlined,
  FileZipOutlined,
  FileTextOutlined,
  LinkOutlined,
  BankOutlined,
  IdcardOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Default values
  const defaultValues = {
    reportingUnitCode: '79301001',
    reporterName: 'Pham Maker',
    reporterPhone: '0901234567',
    reporterEmail: 'maker@aeon.vn',
    webhookEnabled: true,
    webhookUrl: 'https://n8n-staging.aeonfinance.com.vn/webhook/tt15-cic-report-delivery',
    authHeaderName: 'X-API-KEY',
    authHeaderValue:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGVmY2MwOS1mZmNjLTRiNDktOGE4Zi0yZTYzODJiZTJhMjkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzg4MzMxNzAwfQ._TjY5RzDgQ7Nk8v27y2aki6q5q2x69UX80-8TU00uko',
    destinationType: 'N8N_WORKFLOW',
    callbackUrl: 'http://localhost:8080/api/report-deliveries/callback',
    timeoutSeconds: 30,
  };

  useEffect(() => {
    const saved = localStorage.getItem('tt15_webhook_settings');
    if (saved) {
      try {
        form.setFieldsValue(JSON.parse(saved));
      } catch {
        form.setFieldsValue(defaultValues);
      }
    } else {
      form.setFieldsValue(defaultValues);
    }
  }, []);

  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields();
      localStorage.setItem('tt15_webhook_settings', JSON.stringify(values));
      message.success('Đã lưu cấu hình khai báo Webhook thành công!');
    } catch (err) {
      console.error(err);
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
        reportCode: 'D10',
        versionNumber: 1,
        reportingDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        callbackUrl: values.callbackUrl,
      };

      const res = await fetch(values.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(values.authHeaderName && values.authHeaderValue
            ? { [values.authHeaderName]: values.authHeaderValue }
            : {}),
        },
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
        message.success(`Webhook phản hồi HTTP ${res.status} (${latency}ms) thành công!`);
      } else {
        message.warning(`Webhook phản hồi mã HTTP ${res.status}`);
      }
    } catch (err: any) {
      setTestResponse({
        httpStatus: 'Error',
        latency: 0,
        error: err?.message || 'Không thể gửi request đến Webhook',
      });
      message.error('Gặp lỗi khi kết nối tới Webhook endpoint');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              <ApiOutlined style={{ marginRight: 8, color: '#003B95' }} />
              Khai Báo Cổng Webhook Truyền Nhận Báo Cáo (n8n / CIC / SVB)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Khai báo Endpoint Webhook tiếp nhận báo cáo ngoại vi. Toàn bộ logic xác thực bảo mật và phân luồng được cấu hình độc lập trên workflow n8n.
            </Text>
          </Col>
          <Col>
            <Space>
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
                style={{ background: '#003B95', fontWeight: 600 }}
                onClick={handleSaveSettings}
              >
                Lưu Khai Báo
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
                    Phản hồi từ n8n Webhook: HTTP {testResponse.httpStatus} ({testResponse.latency} ms)
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

      <Row gutter={[16, 16]}>
        {/* Main Settings Form */}
        <Col xs={24} lg={15}>
          <Card title="Cấu Hình Hệ Thống & Khai Báo Vận Hành" style={{ borderRadius: 8 }}>
            <Form form={form} layout="vertical" initialValues={defaultValues}>
              <Divider style={{ margin: '0 0 16px 0' }}>
                <BankOutlined style={{ marginRight: 6, color: '#003B95' }} />
                Thông Tin Đơn Vị Báo Cáo & Người Lập Biểu (QĐ 573 / TT15)
              </Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="reportingUnitCode"
                    label="Mã Đơn Vị Báo Cáo (reportingUnitCode)"
                    rules={[{ required: true, message: 'Vui lòng nhập mã đơn vị' }]}
                    tooltip="Mã định danh TCTD được Ngân Hàng Nhà Nước / CIC cấp (Ví dụ: 79301001)"
                  >
                    <Input
                      prefix={<IdcardOutlined style={{ color: '#64748B' }} />}
                      placeholder="79301001"
                      style={{ fontWeight: 600, color: '#003B95' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="reporterName"
                    label="Họ Tên Người Lập Biểu (reporterName)"
                    rules={[{ required: true, message: 'Vui lòng nhập tên người lập' }]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#64748B' }} />}
                      placeholder="Pham Maker"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="reporterPhone"
                    label="Số Điện Thoại Liên Hệ (reporterPhone)"
                  >
                    <Input
                      prefix={<PhoneOutlined style={{ color: '#64748B' }} />}
                      placeholder="0901234567"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="reporterEmail"
                    label="Email Liên Hệ (reporterEmail)"
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: '#64748B' }} />}
                      placeholder="maker@aeon.vn"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }}>
                <ApiOutlined style={{ marginRight: 6, color: '#003B95' }} />
                Khai Báo Webhook Truyền Nhận (n8n Webhook Endpoint)
              </Divider>

              <Form.Item
                name="webhookEnabled"
                label="Kích hoạt truyền nhận qua Webhook"
                valuePropName="checked"
              >
                <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
              </Form.Item>

              <Form.Item
                name="webhookUrl"
                label="Địa chỉ Webhook Endpoint (n8n / CIC Webhook URL)"
                rules={[{ required: true, message: 'Vui lòng nhập Webhook URL' }]}
              >
                <Input
                  prefix={<LinkOutlined style={{ color: '#64748B' }} />}
                  placeholder="https://n8n-staging.aeonfinance.com.vn/webhook/tt15-cic-report-delivery"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="authHeaderName" label="Header Xác Thực (Tùy chọn)">
                    <Input placeholder="X-API-KEY / Authorization" />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item name="authHeaderValue" label="Giá trị Token / Khóa (Tùy chọn)">
                    <Input.Password
                      placeholder="Nhập khóa nếu workflow n8n yêu cầu"
                      prefix={<KeyOutlined style={{ color: '#64748B' }} />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }}>Cấu hình Lịch Tự Động (Schedulers & Automation)</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong style={{ color: '#003B95' }}>Lịch Tự Động Tổng Hợp</Text>
                      <Tag color="success">HOẠT ĐỘNG</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                      Tự động gom các Batch APPROVED và tạo phiên tổng hợp.
                    </Text>
                    <Form.Item name="aggregationDelay" label="Chu kỳ quét" style={{ margin: 0 }}>
                      <Select defaultValue={30000}>
                        <Select.Option value={30000}>Mỗi 30 giây (Mặc định)</Select.Option>
                        <Select.Option value={60000}>Mỗi 1 phút</Select.Option>
                        <Select.Option value={300000}>Mỗi 5 phút</Select.Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card size="small" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong style={{ color: '#7C3AED' }}>Lịch Tự Động Gửi CIC / SVB</Text>
                      <Tag color="processing">SẴN SÀNG</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                      Tự động quét hàng đợi và bắn Webhook các báo cáo APPROVED.
                    </Text>
                    <Form.Item name="deliveryDelay" label="Chu kỳ truyền nhận" style={{ margin: 0 }}>
                      <Select defaultValue={30000}>
                        <Select.Option value={30000}>Mỗi 30 giây (Mặc định)</Select.Option>
                        <Select.Option value={60000}>Mỗi 1 phút</Select.Option>
                        <Select.Option value={300000}>Mỗi 5 phút</Select.Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }}>Cấu hình Phản Hồi Kết Quả (Callback)</Divider>

              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="callbackUrl"
                    label="Callback URL (Nhận trạng thái hoàn thành từ n8n)"
                  >
                    <Input placeholder="http://localhost:8080/api/report-deliveries/callback" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="timeoutSeconds" label="Thời gian Timeout">
                    <Select>
                      <Select.Option value={15}>15 giây</Select.Option>
                      <Select.Option value={30}>30 giây</Select.Option>
                      <Select.Option value={60}>60 giây</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* Payload Structure Reference */}
        <Col xs={24} lg={9}>
          <Card title="Quy Cách Đóng Gói Gửi Đi (Payload Specs)" style={{ borderRadius: 8 }}>
            <Alert
              message="Định dạng truyền nhận: multipart/form-data"
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
            />

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: '#003B95' }} />
                    <Text strong>Part 1: metadata</Text>
                  </Space>
                }
              >
                <div style={{ fontSize: 11, color: '#334155' }}>
                  Đối tượng JSON chứa <code>correlationId</code>, <code>reportCode</code>, <code>versionNumber</code>, <code>reportingDate</code>, <code>callbackUrl</code>.
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Space>
                    <FileZipOutlined style={{ color: '#7C3AED' }} />
                    <Text strong>Part 2: file</Text>
                  </Space>
                }
              >
                <div style={{ fontSize: 11, color: '#334155' }}>
                  Tệp nén nhị phân <code>.zip</code> chứa file JSON báo cáo QĐ573 chính thức (đã tính toán mã băm SHA-256).
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Quy trình xử lý">
                <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                  1. TT15 Backend bắn Webhook (multipart).<br />
                  2. n8n phản hồi ngay <strong>HTTP 202 Accepted</strong>.<br />
                  3. n8n xử lý truyền tiếp sang CIC/SVB.<br />
                  4. n8n gọi Callback cập nhật <strong>DELIVERED</strong>.
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
