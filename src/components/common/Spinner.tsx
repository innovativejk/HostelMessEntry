// src/components/common/Spinner.tsx
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5' // Light background
    }}>
      <div
        className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"
        style={{ animationDuration: '0.8s' }} // Adjust speed if needed
      ></div>
    </div>
  );
};

export default Spinner;