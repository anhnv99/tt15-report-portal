import React, { useState } from 'react';
import { Modal, Input, Typography, message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

interface ImportRejectModalProps {
  open: boolean;
  batchId: string;
  onCancel: () => void;
  onSubmit: (batchId: string, reason: string) => Promise<void>;
}

export const ImportRejectModal: React.FC<ImportRejectModalProps> = ({
  open,
  batchId,
  onCancel,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!reason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setLoading(true);
      await onSubmit(batchId, reason);
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <CloseCircleOutlined style={{ color: '#EF4444', marginRight: 8 }} />
          Từ Chối Phê Duyệt Đợt Dữ Liệu
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Xác Nhận Từ Chối"
      okButtonProps={{ danger: true }}
      cancelText="Hủy"
    >
      <div style={{ marginTop: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Lý do từ chối (bắt buộc):
        </Text>
        <TextArea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do dữ liệu bị sai lệch, không đạt yêu cầu..."
        />
      </div>
    </Modal>
  );
};
