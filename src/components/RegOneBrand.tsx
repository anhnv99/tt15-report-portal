import React from 'react';

interface RegOneBrandProps {
  collapsed?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dark' | 'light';
  onClick?: () => void;
}

const widths = { small: 156, medium: 192, large: 230 };

export const RegOneBrand: React.FC<RegOneBrandProps> = ({
  collapsed = false,
  size = 'medium',
  variant = 'dark',
  onClick,
}) => {
  const source = collapsed
    ? '/brand/05_regone_soft_app_blue.svg'
    : variant === 'dark'
      ? '/brand/03_regone_soft_horizontal_dark.svg'
      : '/brand/02_regone_soft_horizontal_light.svg';

  return (
    <img
      src={source}
      alt="RegOne"
      onClick={onClick}
      style={{
        display: 'block',
        width: collapsed ? 38 : widths[size],
        height: collapsed ? 38 : 'auto',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    />
  );
};
