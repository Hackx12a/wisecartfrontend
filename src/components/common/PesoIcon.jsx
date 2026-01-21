import React from 'react';

const PesoIcon = ({ size = 24, color = 'currentColor', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2v20M9.5 2.5h5M9.5 21.5h5M8 8h8M8 12h8M8 16h8" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="6"
        fontWeight="bold"
        fill={color}
      >
        ₱
      </text>
    </svg>
  );
};

export default PesoIcon;