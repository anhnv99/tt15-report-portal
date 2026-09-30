import React, { type ReactNode } from 'react';
import { Card, Flex, Space } from 'antd';

interface OperationalFilterBarProps {
  filters: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const OperationalFilterBar: React.FC<OperationalFilterBarProps> = ({
  filters,
  actions,
  className,
}) => (
  <Card className={className} size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
    <Flex justify="space-between" align="center" gap={12} wrap>
      <Space wrap size={[8, 8]}>{filters}</Space>
      {actions && <Space wrap size={[8, 8]}>{actions}</Space>}
    </Flex>
  </Card>
);
