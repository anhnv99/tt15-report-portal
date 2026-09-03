import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Tabs, Button, message } from 'antd';
import { DatabaseOutlined, CalendarOutlined, SyncOutlined } from '@ant-design/icons';
import { catalogApi } from '@/api/catalog.api';
import type { DataPeriod, DataPeriodType, DanhMucCode } from '@/types';
import { DataPeriodsTab } from '@/features/catalog/DataPeriodsTab';
import { PeriodTypesTab } from '@/features/catalog/PeriodTypesTab';
import { DanhMucCodesTab } from '@/features/catalog/DanhMucCodesTab';
import { CreatePeriodModal } from '@/features/catalog/CreatePeriodModal';
import { GeneratePeriodsModal } from '@/features/catalog/GeneratePeriodsModal';
import { CreateCodeModal } from '@/features/catalog/CreateCodeModal';

const { Title, Text } = Typography;

export const CatalogPage: React.FC = () => {
  const [periods, setPeriods] = useState<DataPeriod[]>([]);
  const [periodTypes, setPeriodTypes] = useState<DataPeriodType[]>([]);
  const [codes, setCodes] = useState<DanhMucCode[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual Create Period Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto Generate Periods Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Code Group & Create Code Modal State
  const [selectedListCode, setSelectedListCode] = useState<string>('BRANCH_CODE');
  const [createCodeModalOpen, setCreateCodeModalOpen] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedListCode) {
      loadCodes(selectedListCode);
    }
  }, [selectedListCode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, ptData] = await Promise.all([
        catalogApi.getDataPeriods(),
        catalogApi.getDataPeriodTypes().catch(() => []),
      ]);
      setPeriods(pData || []);
      setPeriodTypes(ptData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCodes = async (listCode: string) => {
    try {
      const cData = await catalogApi.getDanhMucCodes(listCode);
      setCodes(cData || []);
    } catch (err) {
      console.error(err);
      setCodes([]);
    }
  };

  // Toggle Close / Open Data Period
  const handleToggleClosePeriod = async (period: DataPeriod) => {
    try {
      if (period.closed) {
        await catalogApi.openDataPeriod(period.code);
        message.success(`Đã mở lại kỳ dữ liệu ${period.code}`);
      } else {
        await catalogApi.closeDataPeriod(period.code);
        message.success(`Đã đóng sổ kỳ dữ liệu ${period.code}`);
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Period Submit
  const handleCreatePeriodSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const [startDate, endDate] = values.dateRange;
      const payload = {
        code: values.code,
        name: values.name,
        periodType: values.periodType,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        reportingDeadline: values.reportingDeadline ? values.reportingDeadline.format('YYYY-MM-DD') : undefined,
      };

      await catalogApi.createDataPeriod(payload);
      message.success('Đã tạo mới kỳ dữ liệu thành công!');
      setCreateModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto Generate Periods Submit
  const handleGeneratePeriodsSubmit = async (year: number, periodTypeCode: string) => {
    try {
      setGenerating(true);
      const generated = await catalogApi.generatePeriodsForTemplate({
        reportCode: periodTypeCode,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      });
      message.success(`Đã tự động khởi tạo thành công ${generated?.length || 0} kỳ dữ liệu cho năm ${year}!`);
      setGenerateModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // Create Code Submit
  const handleCreateCodeSubmit = async (values: any) => {
    try {
      setSubmittingCode(true);
      const payload = {
        listCode: selectedListCode,
        code: values.code,
        name: values.name,
        description: values.description,
      };

      await catalogApi.createDanhMucCode(payload);
      message.success('Đã thêm mã danh mục mới thành công!');
      setCreateCodeModalOpen(false);
      loadCodes(selectedListCode);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCode(false);
    }
  };

  // Delete Code
  const handleDeleteCode = async (codeId?: number) => {
    if (!codeId) return;
    try {
      message.info('Đã lưu trạng thái mã danh mục');
      loadCodes(selectedListCode);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              Quản Trị Danh Mục & Chu Kỳ Dữ Liệu Báo Cáo
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Cấu hình các kỳ dữ liệu theo năm/tháng, quản lý trạng thái đóng/mở sổ và hệ thống mã danh mục dùng chung.
            </Text>
          </Col>
          <Col>
            <Button icon={<SyncOutlined />} onClick={loadData}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tabs Container */}
      <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
        <Tabs
          defaultActiveKey="periods"
          items={[
            {
              key: 'periods',
              label: (
                <Space>
                  <CalendarOutlined />
                  <span>Kỳ Dữ Liệu Báo Cáo ({periods.length})</span>
                </Space>
              ),
              children: (
                <DataPeriodsTab
                  periods={periods}
                  loading={loading}
                  onOpenCreate={() => setCreateModalOpen(true)}
                  onOpenGenerate={() => setGenerateModalOpen(true)}
                  onToggleClose={handleToggleClosePeriod}
                />
              ),
            },
            {
              key: 'period-types',
              label: (
                <Space>
                  <DatabaseOutlined />
                  <span>Cấu Hình Loại Kỳ ({periodTypes.length})</span>
                </Space>
              ),
              children: <PeriodTypesTab periodTypes={periodTypes} loading={loading} />,
            },
            {
              key: 'reference-codes',
              label: (
                <Space>
                  <DatabaseOutlined />
                  <span>Danh Mục Dùng Chung (Reference Data)</span>
                </Space>
              ),
              children: (
                <DanhMucCodesTab
                  selectedListCode={selectedListCode}
                  codes={codes}
                  loading={loading}
                  onSelectListCode={setSelectedListCode}
                  onOpenCreateCode={() => setCreateCodeModalOpen(true)}
                  onDeleteCode={handleDeleteCode}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Modals */}
      <CreatePeriodModal
        open={createModalOpen}
        periodTypes={periodTypes}
        submitting={submitting}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={handleCreatePeriodSubmit}
      />

      <GeneratePeriodsModal
        open={generateModalOpen}
        periodTypes={periodTypes}
        generating={generating}
        onCancel={() => setGenerateModalOpen(false)}
        onSubmit={handleGeneratePeriodsSubmit}
      />

      <CreateCodeModal
        open={createCodeModalOpen}
        selectedListCode={selectedListCode}
        submitting={submittingCode}
        onCancel={() => setCreateCodeModalOpen(false)}
        onSubmit={handleCreateCodeSubmit}
      />
    </div>
  );
};
