import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Switch, Row, Col, Alert, Typography, Tag, Space } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { catalogApi } from '@/api/catalog.api';
import type { DataPeriodType } from '@/types';

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

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        targetDestination: 'CIC',
        frequency: 'MONTHLY',
        sourceReference: 'Quyết định 573/QĐ-NHNN & Thông tư 15/2023/TT-NHNN',
        rootStructure: JSON.stringify(
          {
            MA_DON_VI: '79301001',
            MA_BIEU_MAU: 'D10',
            DANH_SACH_DU_LIEU: [],
          },
          null,
          2
        ),
        isActive: true,
      });

      // Load period types
      loadPeriodTypes();
    }
  }, [open, form]);

  const handleTargetDestinationChange = (dest: string) => {
    if (dest === 'CIC') {
      form.setFieldValue('sourceReference', 'Quyết định 573/QĐ-NHNN & Thông tư 15/2023/TT-NHNN');
    } else if (dest === 'SVB') {
      form.setFieldValue('sourceReference', 'Thông tư 35/2015/TT-NHNN & Thông tư 41/2016/TT-NHNN');
    } else if (dest === 'PCB') {
      form.setFieldValue('sourceReference', 'Nghị định 58/2021/NĐ-CP & Quy chuẩn dữ liệu PCB');
    }
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
    const code = e.target.value.toUpperCase();
    form.setFieldValue('reportCode', code);
    if (!form.getFieldValue('filePrefix')) {
      form.setFieldValue('filePrefix', code);
    }
    // Auto update default json
    try {
      const currentJson = JSON.parse(form.getFieldValue('rootStructure') || '{}');
      currentJson.MA_BIEU_MAU = code;
      form.setFieldValue('rootStructure', JSON.stringify(currentJson, null, 2));
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileAddOutlined style={{ color: '#003B95', fontSize: 20 }} />
          <span>Tạo Mới Biểu Mẫu Báo Cáo (QĐ 573 / TT15)</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Tạo Biểu Mẫu"
      cancelText="Hủy"
      width={720}
      destroyOnClose
    >
      <Alert
        message="Định Nghĩa Mẫu Biểu Quy Chuẩn"
        description="Mẫu biểu được tạo sẽ hỗ trợ nhập liệu, tổng hợp dữ liệu, đóng gói cấu trúc JSON Phụ lục II và chạy các bộ quy tắc kiểm tra đối soát."
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="targetDestination"
              label="Đơn Vị Tiếp Nhận Báo Cáo (Cơ quan đích)"
              rules={[{ required: true, message: 'Vui lòng chọn cơ quan tiếp nhận' }]}
              extra="Quy định cổng nộp và định dạng xuất file tương ứng"
            >
              <Select
                onChange={handleTargetDestinationChange}
                options={[
                  {
                    value: 'CIC',
                    label: (
                      <Space>
                        <Tag color="blue" style={{ fontWeight: 600 }}>CIC</Tag>
                        <span>Trung tâm Thông tin Tín dụng Quốc gia (NHNN)</span>
                      </Space>
                    ),
                  },
                  {
                    value: 'SVB',
                    label: (
                      <Space>
                        <Tag color="green" style={{ fontWeight: 600 }}>SVB / SBV</Tag>
                        <span>Cổng Giám sát Ngân hàng Nhà nước</span>
                      </Space>
                    ),
                  },
                  {
                    value: 'PCB',
                    label: (
                      <Space>
                        <Tag color="purple" style={{ fontWeight: 600 }}>PCB</Tag>
                        <span>Công ty Thông tin Tín dụng Việt Nam</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="reportCode"
              label="Mã Biểu Mẫu"
              rules={[
                { required: true, message: 'Vui lòng nhập mã biểu mẫu (vd: D10, D31, PCB_01)' },
                { pattern: /^[A-Za-z0-9_-]+$/, message: 'Mã chỉ chứa chữ hoa, số và gạch ngang' },
              ]}
              extra="Ví dụ: D10, D31, D99, PCB_01, B01"
            >
              <Input
                placeholder="VD: D99"
                onChange={handleReportCodeChange}
                style={{ fontWeight: 600, textTransform: 'uppercase' }}
              />
            </Form.Item>
          </Col>
        </Row>

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
              extra="Ví dụ: D10, D31, PCB"
            >
              <Input placeholder="VD: D99" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="reportName"
          label="Tên Biểu Mẫu Báo Cáo"
          rules={[{ required: true, message: 'Vui lòng nhập tên đầy đủ của biểu mẫu' }]}
        >
          <Input placeholder="VD: Báo cáo tình hình phát sinh nợ xấu và các khoản vay đặc biệt..." />
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
          label="Cấu Trúc JSON Phụ Lục II (Root Structure Schema)"
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
          extra="Cấu trúc khung JSON tiêu chuẩn truyền nhận báo cáo sang CIC"
        >
          <TextArea rows={6} style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
