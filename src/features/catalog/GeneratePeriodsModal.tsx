import React from 'react';
import { Modal, Form, Select, Typography, Alert } from 'antd';
import type { DataPeriodType } from '@/types';

const { Text } = Typography;

interface GeneratePeriodsModalProps {
  open: boolean;
  periodTypes: DataPeriodType[];
  generating: boolean;
  onCancel: () => void;
  onSubmit: (year: number, periodTypeCode: string) => Promise<void>;
}

export const GeneratePeriodsModal: React.FC<GeneratePeriodsModalProps> = ({
  open,
  periodTypes,
  generating,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values.year, values.periodTypeCode);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      title="Khởi Tạo Tự Động Toàn Bộ Kỳ Dữ Liệu Theo Năm"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={generating}
      okText="Khởi Tạo Tự Động"
      cancelText="Hủy"
    >
      <Alert
        message="Hệ thống tự động sinh các kỳ:"
        description="Dựa trên cấu hình ngày chốt báo cáo và loại ngày (ngày làm việc/ngày lịch) để sinh đủ 12 tháng hoặc các kỳ bán nguyệt/3 ngày trong năm."
        type="info"
        showIcon
        style={{ margin: '12px 0 16px' }}
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="year"
          label="Năm Báo Cáo Cần Khởi Tạo"
          initialValue={new Date().getFullYear()}
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value={2025}>Năm 2025</Select.Option>
            <Select.Option value={2026}>Năm 2026</Select.Option>
            <Select.Option value={2027}>Năm 2027</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="periodTypeCode"
          label="Loại Kỳ Dữ Liệu Cần Sinh"
          initialValue="THANG"
          rules={[{ required: true }]}
        >
          <Select>
            {periodTypes.map((pt) => (
              <Select.Option key={pt.code} value={pt.code}>
                {pt.name} ({pt.code})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
