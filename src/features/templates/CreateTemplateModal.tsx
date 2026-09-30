import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Switch, Row, Col, Typography, Tag, Space, Button } from 'antd';
import { FileAddOutlined, FileZipOutlined, CheckCircleFilled, SettingOutlined } from '@ant-design/icons';
import { catalogApi } from '@/api/catalog.api';
import type { DataPeriodType } from '@/types';
import {
  generateFileNamePreview,
  getAgencyRule,
} from '@/utils/namingRuleUtil';
import { ContextualHelp } from '@/components/ContextualHelp';
import { REPORT_DESTINATION_PROFILES, getReportDestinationProfile } from '@/features/reporting-destinations/profiles';
import { normalizeReportDestination, resolveTemplateDestination } from '@/features/reporting-destinations/resolveReportDestination';

const { TextArea } = Input;
const { Text } = Typography;

interface CreateTemplateModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  loading?: boolean;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  open,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [periodTypes, setPeriodTypes] = useState<DataPeriodType[]>([]);
  const [periodTypesLoading, setPeriodTypesLoading] = useState(false);
  const [targetDestination, setTargetDestination] = useState<string>('CIC');
  const [reportCodeVal, setReportCodeVal] = useState<string>('D10');
  const [showCustomNaming, setShowCustomNaming] = useState<boolean>(false);
  const [customPattern, setCustomPattern] = useState<string>('');

  useEffect(() => {
    if (open) {
      form.resetFields();
      const profile = getReportDestinationProfile('CIC');
      setTargetDestination(profile.id);
      setReportCodeVal(profile.defaultReportCode);
      setShowCustomNaming(false);
      setCustomPattern('');

      form.setFieldsValue({
        targetDestination: profile.id,
        reportCode: profile.defaultReportCode,
        filePrefix: profile.defaultReportCode,
        templateNumber: '01',
        frequency: 'MONTHLY',
        sourceReference: getAgencyRule(profile.id).legalBasis,
        rootStructure: profile.getDefaultRootStructure(profile.defaultReportCode),
        isActive: true,
        requireMakerChecker: true,
      });

      // Load period types
      loadPeriodTypes();
    }
  }, [open, form]);

  const handleTargetDestinationChange = (value: string) => {
    const destination = normalizeReportDestination(value);
    const profile = getReportDestinationProfile(destination);
    setTargetDestination(profile.id);
    form.setFieldValue('sourceReference', getAgencyRule(profile.id).legalBasis);
    const reportCode = form.getFieldValue('reportCode') || profile.defaultReportCode;
    form.setFieldValue('rootStructure', profile.getDefaultRootStructure(reportCode));
  };

  const loadPeriodTypes = async () => {
    try {
      setPeriodTypesLoading(true);
      const types = await catalogApi.getDataPeriodTypes();
      setPeriodTypes(types || []);
      if (types && types.length > 0) {
        form.setFieldValue('dataPeriodTypeId', types[0].id);
      }
    } catch (e) {
      console.error('Failed to load period types', e);
    } finally {
      setPeriodTypesLoading(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (errorInfo) {
      console.log('Validate Failed:', errorInfo);
    }
  };

  const handleReportCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase().trim();
    setReportCodeVal(code || 'D10');
    form.setFieldValue('reportCode', code);
    form.setFieldValue('filePrefix', code);

    const detected = resolveTemplateDestination({ reportCode: code });
    const profile = getReportDestinationProfile(detected);
    setTargetDestination(detected);
    form.setFieldValue('targetDestination', detected);
    form.setFieldValue('sourceReference', getAgencyRule(detected).legalBasis);

    form.setFieldValue('rootStructure', profile.getDefaultRootStructure(code || profile.defaultReportCode));
  };

  // Tính toán Live Preview tên tệp theo quy chuẩn từ Settings
  const previewFileName = generateFileNamePreview({
    reportCode: reportCodeVal || 'D10',
    agency: targetDestination,
    reportingDate: '20260831',
    sequence: 1,
    customPattern: customPattern.trim() ? customPattern.trim() : undefined,
  });

  const currentAgencyRule = getAgencyRule(targetDestination);
  const currentDestinationProfile = getReportDestinationProfile(normalizeReportDestination(targetDestination));

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileAddOutlined style={{ color: '#003B95', fontSize: 20 }} />
          <span>Tạo Mới Biểu Mẫu Báo Cáo (CIC / SBV / PCB)</span>
          <ContextualHelp inline content="Khi nhập mã biểu mẫu, hệ thống tự xác định cơ quan tiếp nhận, căn cứ pháp lý và áp dụng quy tắc đặt tên tệp nén nộp. Chỉ cần xác nhận phần xem trước bên dưới." />
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Tạo Biểu Mẫu"
      cancelText="Hủy"
      width={740}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="reportCode"
              label="Mã Biểu Mẫu (Bắt buộc)"
              rules={[
                { required: true, message: 'Vui lòng nhập mã biểu mẫu (vd: D10, D31, B01, PCB_01)' },
                { pattern: /^[A-Za-z0-9_-]+$/, message: 'Mã chỉ chứa chữ hoa, số và gạch ngang' },
              ]}
              extra="Ví dụ: D10 (CIC), B01 (SBV), PCB_01 (PCB)"
            >
              <Input
                placeholder="VD: D10"
                onChange={handleReportCodeChange}
                style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 15 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="targetDestination"
              label="Đơn Vị Tiếp Nhận Báo Cáo (Cơ quan đích)"
              rules={[{ required: true, message: 'Vui lòng chọn cơ quan tiếp nhận' }]}
              extra="Tự động nhận diện từ tiền tố mã biểu mẫu"
            >
              <Select
                onChange={handleTargetDestinationChange}
                options={Object.values(REPORT_DESTINATION_PROFILES).map((profile) => ({
                  value: profile.id,
                  label: <Space><Tag color={profile.tagColor} style={{ fontWeight: 600 }}>{profile.label}</Tag><span>{profile.deliveryLabel}</span></Space>,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* --- LIVE PREVIEW BOX NỔI BẬT THEO TRIẾT LÝ USER YÊU CẦU --- */}
        <div
          style={{
            background: '#F0F7FF',
            border: '1.5px solid #ADC6FF',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Space>
              <FileZipOutlined style={{ color: '#003B95', fontSize: 16 }} />
              <Text strong style={{ color: '#002B66', fontSize: 13 }}>
                Tên Tệp Nén Nộp Tự Động Sinh (Live Preview Chuẩn {targetDestination}):
              </Text>
            </Space>
            <Tag color={currentDestinationProfile.tagColor} style={{ fontWeight: 700 }}>
              Cơ quan: {currentDestinationProfile.label}
            </Tag>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 15,
                fontWeight: 700,
                color: '#1D39C4',
                background: '#FFFFFF',
                border: '1px dashed #2F54EB',
                borderRadius: 6,
                padding: '6px 14px',
                flex: 1,
                minWidth: 260,
              }}
            >
              📦 {previewFileName}
            </div>

            <Button
              type="dashed"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setShowCustomNaming(!showCustomNaming)}
              style={{ fontSize: 12 }}
            >
              {showCustomNaming ? 'Dùng Chuẩn Cài Đặt' : 'Tùy Biến Riêng'}
            </Button>
          </div>

          {showCustomNaming && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #ADC6FF' }}>
              <Form.Item
                name="customNamingPattern"
                label={<span style={{ fontSize: 12 }}>Quy tắc tên file tùy biến riêng cho mẫu này (Ghi đè Cài Đặt)</span>}
                style={{ marginBottom: 0 }}
                extra="Biến hỗ trợ: {REPORT_CODE}, {UNIT_CODE}, {DATE}, {SEQUENCE}, {EXT}"
              >
                <Input
                  placeholder={currentAgencyRule.pattern}
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </div>
          )}

          <div style={{ marginTop: 6, fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircleFilled style={{ color: '#16A34A' }} />
            <span>Kế thừa trực tiếp từ <strong>Màn Cài Đặt</strong>. Đảm bảo 100% hợp lệ khi nộp sang cổng {targetDestination}.</span>
          </div>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="templateNumber"
              label="Mẫu Số Quy Chuẩn"
              rules={[{ required: true, message: 'Vui lòng nhập mẫu số' }]}
              extra="Ví dụ: 01, 04, 14 hoặc mã phân hệ"
            >
              <Input placeholder="VD: 14" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="filePrefix"
              label="Tiền Tố File Đóng Gói"
              rules={[{ required: true, message: 'Vui lòng nhập tiền tố file' }]}
              extra="Ví dụ: D10, B01, PCB"
            >
              <Input placeholder="VD: D10" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="reportName"
          label="Tên Biểu Mẫu Báo Cáo"
          rules={[{ required: true, message: 'Vui lòng nhập tên đầy đủ của biểu mẫu' }]}
        >
          <Input placeholder="VD: Báo cáo thông tin tín dụng khách hàng doanh nghiệp..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="frequency"
              label="Chu Kỳ Báo Cáo"
              rules={[{ required: true, message: 'Vui lòng chọn chu kỳ' }]}
            >
              <Select
                options={[
                  { value: 'EVENT', label: 'Theo sự kiện phát sinh' },
                  { value: 'EVERY_3_WORKING_DAYS', label: 'Định kỳ 3 ngày làm việc' },
                  { value: 'SEMI_MONTHLY', label: 'Định kỳ bán nguyệt (15 ngày)' },
                  { value: 'MONTHLY', label: 'Định kỳ hàng tháng' },
                  { value: 'ANNUAL', label: 'Định kỳ hàng năm' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dataPeriodTypeId"
              label="Loại Kỳ Dữ Liệu Tương Ứng"
              rules={[{ required: true, message: 'Vui lòng chọn loại kỳ' }]}
            >
              <Select
                loading={periodTypesLoading}
                placeholder="Chọn loại kỳ dữ liệu"
                options={periodTypes.map((pt) => ({
                  value: pt.id,
                  label: `${pt.code} - ${pt.name}`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sourceReference"
              label="Căn Cứ / Nguồn Tham Chiếu Pháp Lý"
              rules={[{ required: true, message: 'Vui lòng nhập căn cứ' }]}
            >
              <Input placeholder="VD: Quyết định 573/QĐ-NHNN & Thông tư 15/2023/TT-NHNN" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="requireMakerChecker"
              label="Quy Trình Phê Duyệt (Maker - Checker)"
              valuePropName="checked"
              extra="Bật: Cần Maker lập biểu & Checker phê duyệt. Tắt: Tự động phê duyệt & nộp toàn trình (STP / Zero-touch)."
            >
              <Switch checkedChildren="Bắt buộc duyệt" unCheckedChildren="Tự động duyệt (STP)" defaultChecked />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="isActive"
              label="Trạng Thái Hoạt Động"
              valuePropName="checked"
              extra="Cho phép hiển thị và tiếp nhận nhập liệu báo cáo này"
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" defaultChecked />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="rootStructure"
          label={
            currentDestinationProfile.supportsExcelMapping
              ? 'Cấu Trúc Sheet Báo Cáo Excel (Sheets Configuration JSON)'
              : 'Cấu Trúc JSON Phụ Lục II (Root Structure Schema)'
          }
          rules={[
            { required: true, message: 'Vui lòng nhập cấu trúc JSON mẫu' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                try {
                  JSON.parse(value);
                  return Promise.resolve();
                } catch {
                  return Promise.reject(new Error('Cấu trúc JSON không hợp lệ!'));
                }
              },
            },
          ]}
          extra={
            currentDestinationProfile.supportsExcelMapping
              ? 'Khai báo danh sách sheet, tiền tố phân loại cột (prefix) trong template Excel báo cáo NHNN'
              : 'Cấu trúc khung JSON tiêu chuẩn truyền nhận báo cáo sang cơ quan đích'
          }
        >
          <TextArea rows={5} style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
