import React from 'react';

export const BrandMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dimensions = {
    sm: 'h-6 w-5',
    md: 'h-8 w-7',
    lg: 'h-10 w-8',
  }[size];

  return (
    <div
      className={`relative inline-block bg-gradient-to-br from-indigo-500 to-purple-700 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl rounded-bl-sm -rotate-12 shadow-sm ${dimensions}`}
    >
      <span className="absolute w-1.5 h-1.5 rounded-full bg-white top-2 left-2" />
      <span className="absolute w-3 h-2 border-[1.5px] border-white rounded-full bottom-1 left-1.5" />
      <i className="absolute h-3 border-l-[1.5px] border-white top-0 left-3 not-italic" />
    </div>
  );
};
