import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Button, Select, Input, message } from 'antd';
import { CloudUploadOutlined, SyncOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { importApi } from '@/api/import.api';
import { catalogApi } from '@/api/catalog.api';
import type { ImportBatch, StagingRow, ImportApprovalEvent, ReportTemplate, DataPeriod } from '@/types';
import { ImportBatchTable } from '@/features/imports/ImportBatchTable';
import { ImportUploadModal } from '@/features/imports/ImportUploadModal';
import { StagedDataDrawer } from '@/features/imports/StagedDataDrawer';
import { ImportTimelineDrawer } from '@/features/imports/ImportTimelineDrawer';
import { ImportRejectModal } from '@/features/imports/ImportRejectModal';
import { SupplementBatchModal } from '@/features/imports/SupplementBatchModal';

const { Title, Text } = Typography;
const { Search } = Input;

export const ImportsPage: React.FC = () => {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [periods, setPeriods] = useState<DataPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<string>('D10');
  const [uploadPeriodId, setUploadPeriodId] = useState<number | undefined>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Drawers & Modals
  const [stagingDrawerOpen, setStagingDrawerOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [stagingLoading, setStagingLoading] = useState(false);

  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [events, setEvents] = useState<ImportApprovalEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectBatchId, setRejectBatchId] = useState<string>('');

  const [supplementModalOpen, setSupplementModalOpen] = useState(false);
  const [supplementBatch, setSupplementBatch] = useState<ImportBatch | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadBatches();
  }, [filterType, filterStatus, searchQuery]);

  const loadInitialData = async () => {
    try {
      const [tplData, prdData] = await Promise.all([
        catalogApi.getReportTemplates(),
        catalogApi.getDataPeriods(),
      ]);
      setTemplates(tplData || []);
      setPeriods(prdData || []);
      if (tplData?.length) setUploadType(tplData[0].reportCode);
      if (prdData?.length) setUploadPeriodId(prdData[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await importApi.getImportBatches({
        importType: filterType,
        status: filterStatus,
        query: searchQuery.trim() || undefined,
      });
      setBatches(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Upload Handler
  const handleUploadSubmit = async () => {
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn tệp tin tải lên');
      return;
    }
    if (!uploadPeriodId) {
      message.warning('Vui lòng chọn kỳ dữ liệu');
      return;
    }
    const formData = new FormData();
    formData.append('file', fileList[0] as any);
    formData.append('importType', uploadType);
    formData.append('dataPeriodId', uploadPeriodId.toString());

    try {
      setUploading(true);
      await importApi.uploadImportBatch(formData);
      message.success('Tải lên đợt dữ liệu thành công');
      setUploadModalOpen(false);
      setFileList([]);
      loadBatches();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tải lên tệp tin');
    } finally {
      setUploading(false);
    }
  };

  // Stage Handler
  const handleStage = async (batchId: string) => {
    try {
      await importApi.stageImportBatch(batchId);
      message.success('Tiền xử lý (Stage) lô thành công');
      loadBatches();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể tiền xử lý lô dữ liệu');
    }
  };

  // Approve Handler
  const handleApprove = async (batchId: string) => {
    try {
      await importApi.approveImportBatch(batchId);
      message.success('Phê duyệt lô thành công');
      loadBatches();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể phê duyệt lô dữ liệu');
    }
  };

  // Bulk Approve Handler
  const handleBulkApprove = async (batchIds: string[]) => {
    try {
      for (const id of batchIds) {
        await importApi.approveImportBatch(id);
      }
      message.success(`Đã phê duyệt thành công ${batchIds.length} lô dữ liệu`);
      loadBatches();
    } catch (err: any) {
      message.error('Có lỗi xảy ra khi duyệt hàng loạt');
    }
  };

  // Reject Submit
  const handleRejectSubmit = async (reason: string) => {
    try {
      await importApi.rejectImportBatch(rejectBatchId, reason);
      message.success('Đã từ chối lô dữ liệu');
      setRejectModalOpen(false);
      loadBatches();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể từ chối lô dữ liệu');
    }
  };

  // Open Staging Drawer
  const handleOpenStaging = async (batch: ImportBatch) => {
    setSelectedBatch(batch);
    setStagingDrawerOpen(true);
    try {
      setStagingLoading(true);
      const rows = await importApi.getStagingRows(batch.id);
      setStagingRows(rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setStagingLoading(false);
    }
  };

  // Open Timeline Drawer
  const handleOpenTimeline = async (batchId: string) => {
    setTimelineDrawerOpen(true);
    try {
      setTimelineLoading(true);
      const eventList = await importApi.getBatchEvents(batchId);
      setEvents(eventList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTimelineLoading(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Title level={4} style={{ margin: 0, color: '#002B66' }}>
              Quản Lý & Phê Duyệt Lô Dữ Liệu Nguồn (Maker / Checker)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Tiếp nhận, tiền xử lý và phê duyệt các lô dữ liệu nạp trước khi đưa vào tổng hợp báo cáo.
            </Text>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                style={{ background: '#003B95' }}
                onClick={() => setUploadModalOpen(true)}
              >
                Tải Lên File Excel
              </Button>
              <Button icon={<SyncOutlined />} onClick={loadBatches}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filters Card */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }} styles={{ body: { padding: '12px 24px' } }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Select
              allowClear
              placeholder="Lọc theo biểu mẫu"
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
              showSearch
              optionFilterProp="children"
            >
              {templates.map((t) => (
                <Select.Option key={t.reportCode} value={t.reportCode}>
                  [{t.reportCode}] Mẫu {t.templateNumber} - {t.reportName}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              allowClear
              placeholder="Lọc theo trạng thái"
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Select.Option value="UPLOADED">UPLOADED (Mới tải lên)</Select.Option>
              <Select.Option value="STAGED">STAGED (Đã tiền xử lý)</Select.Option>
              <Select.Option value="APPROVED">APPROVED (Đã duyệt)</Select.Option>
              <Select.Option value="REJECTED">REJECTED (Từ chối)</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={8}>
            <Search
              placeholder="Tìm kiếm theo tên file hoặc mã lô..."
              allowClear
              onSearch={setSearchQuery}
            />
          </Col>
        </Row>
      </Card>

      {/* Batch Table */}
      <Card style={{ borderRadius: 8 }} styles={{ body: { padding: '16px 24px' } }}>
        <ImportBatchTable
          batches={batches}
          loading={loading}
          onStage={handleStage}
          onApprove={handleApprove}
          onBulkApprove={handleBulkApprove}
          onOpenReject={(id) => {
            setRejectBatchId(id);
            setRejectModalOpen(true);
          }}
          onOpenStaging={handleOpenStaging}
          onOpenTimeline={handleOpenTimeline}
          onOpenSupplement={(batch) => {
            setSupplementBatch(batch);
            setSupplementModalOpen(true);
          }}
        />
      </Card>

      {/* Supplement Batch Modal */}
      <SupplementBatchModal
        open={supplementModalOpen}
        batch={supplementBatch}
        onClose={() => setSupplementModalOpen(false)}
        onSuccess={loadBatches}
      />

      {/* Upload Modal */}
      <ImportUploadModal
        open={uploadModalOpen}
        templates={templates}
        periods={periods}
        uploadType={uploadType}
        uploadPeriodId={uploadPeriodId}
        fileList={fileList}
        uploading={uploading}
        onCancel={() => setUploadModalOpen(false)}
        onTypeChange={setUploadType}
        onPeriodChange={setUploadPeriodId}
        onFileListChange={setFileList}
        onSubmit={handleUploadSubmit}
      />

      {/* Staged Data Drawer */}
      <StagedDataDrawer
        open={stagingDrawerOpen}
        batch={selectedBatch}
        rows={stagingRows}
        loading={stagingLoading}
        onClose={() => setStagingDrawerOpen(false)}
      />

      {/* Timeline Drawer */}
      <ImportTimelineDrawer
        open={timelineDrawerOpen}
        events={events}
        loading={timelineLoading}
        onClose={() => setTimelineDrawerOpen(false)}
      />

      {/* Reject Modal */}
      <ImportRejectModal
        open={rejectModalOpen}
        batchId={rejectBatchId}
        onCancel={() => setRejectModalOpen(false)}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
};
