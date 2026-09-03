import React, { useState } from 'react';
import { Modal, Input, Typography, message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

interface RejectVersionModalProps {
  open: boolean;
  versionId: string;
  onCancel: () => void;
  onSubmit: (versionId: string, reason: string) => Promise<void>;
}

export const RejectVersionModal: React.FC<RejectVersionModalProps> = ({
  open,
  versionId,
  onCancel,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!reason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối phê duyệt');
      return;
    }
    try {
      setLoading(true);
      await onSubmit(versionId, reason);
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
          Từ Chối Phê Duyệt Phiên Bản Báo Cáo
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
          placeholder="Nhập chi tiết sai lệch số liệu hoặc vi phạm quy tắc cần Maker chỉnh sửa..."
        />
      </div>
    </Modal>
  );
};
