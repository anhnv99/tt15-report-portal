import React from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import type { DataPeriodType } from '@/types';

interface CreatePeriodModalProps {
  open: boolean;
  periodTypes: DataPeriodType[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export const CreatePeriodModal: React.FC<CreatePeriodModalProps> = ({
  open,
  periodTypes,
  submitting,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      title="Tạo Kỳ Dữ Liệu Thủ Công"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={submitting}
      okText="Tạo Kỳ"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="code"
          label="Mã Kỳ Dữ Liệu"
          rules={[{ required: true, message: 'Vui lòng nhập mã kỳ (vd: 2026-M09)' }]}
        >
          <Input placeholder="2026-M09" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên Kỳ Dữ Liệu"
          rules={[{ required: true, message: 'Vui lòng nhập tên kỳ' }]}
        >
          <Input placeholder="Kỳ Tháng 09/2026" />
        </Form.Item>
        <Form.Item
          name="periodType"
          label="Loại Kỳ"
          rules={[{ required: true, message: 'Vui lòng chọn loại kỳ' }]}
        >
          <Select placeholder="Chọn loại kỳ">
            {periodTypes.map((pt) => (
              <Select.Option key={pt.code} value={pt.code}>
                {pt.name} ({pt.code})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="dateRange"
          label="Khoảng Thời Gian (Từ ngày - Đến ngày)"
          rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
        >
          <DatePicker.RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="reportingDeadline" label="Hạn Chót Báo Cáo (Deadline)">
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
