import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Row,
  Col,
  Drawer,
  Modal,
  Form,
  Input,
  message,
  Timeline,
} from 'antd';
import {
  ApartmentOutlined,
  SyncOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { workflowApi } from '@/api/workflow.api';
import type { WorkflowDefinition, ProcessDefinition } from '@/types';

const { Title, Text } = Typography;

export const WorkflowsPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  // Drawer State
  const [selectedWf, setSelectedWf] = useState<WorkflowDefinition | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getWorkflows();
      setWorkflows(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (wf: WorkflowDefinition) => {
    setSelectedWf(wf);
    setDrawerOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await workflowApi.registerWorkflow({
        code: values.code,
        name: values.name,
        description: values.description,
        processes: [
          {
            code: `${values.code}_P1`,
            name: `${values.name} - Quy Trình Chính`,
            version: 1,
            tasks: [
              { code: 'STEP_1', name: 'Khởi tạo & Nhập liệu', taskType: 1, stepOrder: 1 },
              { code: 'STEP_2', name: 'Kiểm tra & Đối soát', taskType: 2, stepOrder: 2 },
              { code: 'STEP_3', name: 'Phê duyệt Phát hành', taskType: 3, stepOrder: 3 },
            ],
          },
        ],
      });
      message.success('Đã đăng ký quy trình workflow thành công!');
      setCreateModalOpen(false);
      form.resetFields();
      loadWorkflows();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<WorkflowDefinition> = [
    {
      title: 'Mã Quy Trình',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (c) => <Text strong style={{ color: '#003B95' }}>{c}</Text>,
    },
    {
      title: 'Tên Quy Trình Phê Duyệt',
      dataIndex: 'name',
      key: 'name',
      render: (n) => <Text strong>{n}</Text>,
    },
    {
      title: 'Mô Tả Luồng',
      dataIndex: 'description',
      key: 'description',
      render: (d) => d || '-',
    },
    {
      title: 'Số Tiến Trình Con (Processes)',
      dataIndex: 'processes',
      key: 'processes',
      width: 180,
      render: (p: ProcessDefinition[]) => (
        <Tag color="blue">{p?.length || 0} tiến trình</Tag>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 160,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          style={{ background: '#003B95' }}
          onClick={() => handleOpenDetail(r)}
        >
          Xem Chi Tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              Quy Trình Phê Duyệt Báo Cáo (Workflow BPM)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Quản lý các luồng định tuyến và bước phê duyệt kiểm soát nội bộ.
            </Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<SyncOutlined />} onClick={loadWorkflows}>
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ background: '#003B95', fontWeight: 600 }}
                onClick={() => setCreateModalOpen(true)}
              >
                Đăng Ký Workflow Mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
        <Table
          columns={columns}
          dataSource={workflows}
          rowKey="code"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={`Chi tiết Quy Trình: ${selectedWf?.name || ''}`}
        placement="right"
        width={650}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedWf && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', fontSize: 16, color: '#002B66' }}>
                {selectedWf.name} ({selectedWf.code})
              </Text>
              <Text type="secondary">{selectedWf.description || 'Không có mô tả'}</Text>
            </div>

            <Title level={5}>Danh sách Tiến trình & Bước thực hiện (Tasks):</Title>
            {selectedWf.processes?.map((proc, idx) => (
              <Card
                key={proc.code}
                size="small"
                title={`${idx + 1}. ${proc.name} (${proc.code}) — v${proc.version}`}
                style={{ marginBottom: 16 }}
              >
                <Timeline
                  style={{ marginTop: 12 }}
                  items={proc.tasks?.map((t) => ({
                    color: 'blue',
                    children: (
                      <div>
                        <Text strong>
                          Bước {t.stepOrder}: {t.name}
                        </Text>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Mã bước: {t.code}</div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            ))}
          </div>
        )}
      </Drawer>

      {/* Create Modal */}
      <Modal
        title="Đăng Ký Workflow Phê Duyệt Mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={submitting}
        okText="Đăng ký"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="code"
            label="Mã Workflow"
            rules={[{ required: true, message: 'Vui lòng nhập mã workflow' }]}
          >
            <Input placeholder="WF_TT15_D10" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên Workflow"
            rules={[{ required: true, message: 'Vui lòng nhập tên workflow' }]}
          >
            <Input placeholder="Quy trình phê duyệt báo cáo D10" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết mục đích luồng phê duyệt..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
