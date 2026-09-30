import type { ReactNode } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

interface ContextualHelpProps {
  content: ReactNode;
  label?: string;
  inline?: boolean;
}

/** Keeps explanatory guidance discoverable without consuming operational workspace. */
export function ContextualHelp({ content, label = 'Hướng dẫn', inline = false }: ContextualHelpProps) {
  const trigger = (
    <Tooltip placement="leftTop" title={<div style={{ maxWidth: 360, lineHeight: 1.55 }}>{content}</div>}>
      <Button type="text" shape="circle" icon={<QuestionCircleOutlined />} aria-label={label} />
    </Tooltip>
  );

  return inline ? trigger : (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      {trigger}
    </div>
  );
}
