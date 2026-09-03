import React from 'react';
import { Table, Tag, Button, Space, Typography, Row, Col, Select, Popconfirm, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DanhMucCode } from '@/types';

const { Text } = Typography;

interface DanhMucCodesTabProps {
  selectedListCode: string;
  codes: DanhMucCode[];
  loading: boolean;
  onSelectListCode: (code: string) => void;
  onOpenCreateCode: () => void;
  onDeleteCode: (codeId?: number) => Promise<void>;
}

export const DanhMucCodesTab: React.FC<DanhMucCodesTabProps> = ({
  selectedListCode,
  codes,
  loading,
  onSelectListCode,
  onOpenCreateCode,
  onDeleteCode,
}) => {
  const codeLists = [
    { code: 'BRANCH_CODE', name: 'Mã Chi Nhánh TCTD (CITAD NHNN)' },
    { code: 'CURRENCY_CODE', name: 'Mã Loại Tiền Tệ (ISO 4217)' },
    { code: 'CUSTOMER_TYPE', name: 'Loại Khách Hàng (Cá nhân / Doanh nghiệp)' },
    { code: 'DEBT_GROUP', name: 'Phân Loại Nhóm Nợ (Nhóm 1 - 5 theo TT31/TT15)' },
    { code: 'LOAN_PURPOSE', name: 'Mục Đích Vay Vốn (QĐ 573)' },
    { code: 'COLLATERAL_TYPE', name: 'Phân Loại Tài Sản Bảo Đảm (QĐ 573)' },
  ];

  const columns: ColumnsType<DanhMucCode> = [
    {
      title: 'Mã Code Quy Chuẩn',
      dataIndex: 'code',
      key: 'code',
      width: 170,
      render: (c) => <Text code strong style={{ color: '#003B95', fontSize: 13 }}>{c}</Text>,
    },
    {
      title: 'Tên / Diễn Giải Nghiệp Vụ',
      dataIndex: 'name',
      key: 'name',
      render: (n) => <Text strong>{n}</Text>,
    },
    {
      title: 'Ký Hiệu / Phân Loại',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 160,
      render: (s) => (s ? <Tag color="geekblue">{s}</Tag> : '-'),
    },
    {
      title: 'Mã Trực Thuộc (Cha)',
      dataIndex: 'parentCode',
      key: 'parentCode',
      width: 160,
      render: (p) => (p ? <Text code>{p}</Text> : <Text type="secondary">-</Text>),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'active',
      key: 'active',
      width: 130,
      render: (a) => (
        <Tag color={a !== false ? 'success' : 'default'}>
          {a !== false ? 'HOẠT ĐỘNG' : 'KHÓA'}
        </Tag>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 90,
      render: (_, r) => (
        <Popconfirm
          title="Xóa mã danh mục này?"
          onConfirm={() => onDeleteCode(r.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Space align="center" wrap>
            <Text strong style={{ fontSize: 13 }}>
              Chọn Bộ Danh Mục Dùng Chung:
            </Text>
            <Select
              value={selectedListCode}
              onChange={onSelectListCode}
              style={{ width: 380 }}
            >
              {codeLists.map((item) => (
                <Select.Option key={item.code} value={item.code}>
                  <Text strong style={{ color: '#003B95' }}>[{item.code}]</Text> {item.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} md={10} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#003B95' }}
            onClick={onOpenCreateCode}
          >
            Thêm Mã Mới Vào Danh Mục
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={codes}
        rowKey="code"
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />
    </div>
  );
};
