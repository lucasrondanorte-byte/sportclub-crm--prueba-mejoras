import React from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
}

const EmptyStateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);


const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  return (
    <div className="text-center py-16">
        <EmptyStateIcon />
        <h3 className="mt-2 text-xl font-semibold text-brand-text-secondary">{title}</h3>
        <p className="mt-1 text-sm text-brand-text-muted">{message}</p>
    </div>
  );
};

export default EmptyState;
