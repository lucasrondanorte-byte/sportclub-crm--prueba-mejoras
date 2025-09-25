
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-brand-surface rounded-lg border border-brand-border p-6 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-3">
          {title && <h3 className="text-xl font-semibold text-brand-text-primary">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;