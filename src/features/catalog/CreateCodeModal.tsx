import React from 'react';
import { Modal, Form, Input } from 'antd';

interface CreateCodeModalProps {
  open: boolean;
  selectedListCode: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export const CreateCodeModal: React.FC<CreateCodeModalProps> = ({
  open,
  selectedListCode,
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
      title={`Thêm Mã Mới Vào Danh Mục: ${selectedListCode}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={submitting}
      okText="Lưu Mã"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="code"
          label="Mã Code"
          rules={[{ required: true, message: 'Vui lòng nhập mã code' }]}
        >
          <Input placeholder="VND, 01, 79301001..." />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên / Ý Nghĩa"
          rules={[{ required: true, message: 'Vui lòng nhập tên/mô tả' }]}
        >
          <Input placeholder="Việt Nam Đồng, Cho vay..." />
        </Form.Item>
        <Form.Item name="description" label="Ghi Chú Nghiệp Vụ">
          <Input.TextArea rows={2} placeholder="Theo quy định tại Phụ lục I..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
