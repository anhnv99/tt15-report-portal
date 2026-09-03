import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Space,
  Button,
  Divider,
  Typography,
} from 'antd';
import { CheckSquareOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ReportTemplateRule } from '@/types';

const { Text } = Typography;

interface TemplateRuleModalProps {
  open: boolean;
  editingRule: ReportTemplateRule | null;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export const TemplateRuleModal: React.FC<TemplateRuleModalProps> = ({
  open,
  editingRule,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editingRule) {
        form.setFieldsValue({
          actualKey: editingRule.actualKey,
          expectedKey: editingRule.expectedKey,
          operator: editingRule.operator,
          tolerance: editingRule.tolerance || 0,
          message: editingRule.message,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingRule, form]);

  const handleApplyPreset = (presetType: string) => {
    if (presetType === 'TOTAL_OUTSTANDING') {
      form.setFieldsValue({
        actualKey: 'TOTAL_OUTSTANDING',
        operator: 'EQ',
        expectedKey: 'SUM_DETAIL_OUTSTANDING',
        tolerance: 0,
        message: 'Tổng dư nợ toàn ngân hàng phải bằng tổng dư nợ chi tiết từng khách hàng (dung sai 0 đ)',
      });
    } else if (presetType === 'DEBT_GROUPS') {
      form.setFieldsValue({
        actualKey: 'TOTAL_OUTSTANDING',
        operator: 'EQ',
        expectedKey: 'SUM_DEBT_GROUPS_1_TO_5',
        tolerance: 0,
        message: 'Tổng dư nợ phải khớp hoàn toàn với tổng phân loại nợ từ Nhóm 1 đến Nhóm 5',
      });
    } else if (presetType === 'OVERDUE_BALANCE') {
      form.setFieldsValue({
        actualKey: 'TOTAL_OUTSTANDING',
        operator: 'EQ',
        expectedKey: 'IN_TERM_PLUS_OVERDUE',
        tolerance: 0,
        message: 'Tổng dư nợ = Dư nợ trong hạn + Dư nợ quá hạn',
      });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CheckSquareOutlined style={{ color: '#003B95' }} />
          <span>{editingRule ? 'Chỉnh Sửa Quy Tắc Đối Soát' : 'Thiết Lập Quy Tắc Đối Soát Mới'}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Lưu Quy Tắc"
      cancelText="Hủy"
      width={700}
    >
      <div style={{ marginTop: 12 }}>
        {/* Quick Presets for Banking */}
        {!editingRule && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              <ThunderboltOutlined style={{ color: '#F59E0B' }} /> Chọn nhanh mẫu quy tắc phổ biến:
            </Text>
            <Space wrap>
              <Button size="small" onClick={() => handleApplyPreset('TOTAL_OUTSTANDING')}>
                Cân đối Tổng Dư Nợ
              </Button>
              <Button size="small" onClick={() => handleApplyPreset('DEBT_GROUPS')}>
                Tổng Nợ Nhóm 1..5
              </Button>
              <Button size="small" onClick={() => handleApplyPreset('OVERDUE_BALANCE')}>
                Trong hạn + Quá hạn
              </Button>
            </Space>
            <Divider style={{ margin: '12px 0' }} />
          </div>
        )}

        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item
                name="actualKey"
                label="Khóa / Chỉ tiêu Thực tế (Actual Key)"
                rules={[{ required: true, message: 'Vui lòng nhập khóa thực tế' }]}
              >
                <Input placeholder="TOTAL_OUTSTANDING" />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="operator"
                label="Toán tử"
                initialValue="EQ"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="EQ">Bằng (=)</Select.Option>
                  <Select.Option value="NE">Khác (≠)</Select.Option>
                  <Select.Option value="GT">Lớn hơn (&gt;)</Select.Option>
                  <Select.Option value="GTE">Lớn hơn hoặc bằng (&ge;)</Select.Option>
                  <Select.Option value="LT">Nhỏ hơn (&lt;)</Select.Option>
                  <Select.Option value="LTE">Nhỏ hơn hoặc bằng (&le;)</Select.Option>
                  <Select.Option value="UNIQUE">Duy nhất (UNIQUE)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item
                name="expectedKey"
                label="Khóa / Chỉ tiêu Đối soát (Expected Key)"
                rules={[{ required: true, message: 'Vui lòng nhập khóa đối soát' }]}
              >
                <Input placeholder="SUM_DETAIL_OUTSTANDING" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="tolerance"
                label="Dung sai cho phép (Tolerance)"
                initialValue={0}
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0 đ" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="message"
                label="Nội dung thông báo khi vi phạm"
                rules={[{ required: true, message: 'Vui lòng nhập thông báo lỗi' }]}
              >
                <Input placeholder="Tổng dư nợ toàn ngân hàng không khớp với tổng chi tiết khách hàng" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
};
