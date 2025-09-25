import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const Notification: React.FC<NotificationProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000); // 8 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const config = {
    success: {
        bgColor: 'bg-green-600',
        icon: <SuccessIcon />,
        title: 'Sincronización Automática'
    },
    error: {
        bgColor: 'bg-red-600',
        icon: <ErrorIcon />,
        title: 'Error de Sincronización'
    }
  };

  const { bgColor, icon, title } = config[type];

  return (
    <div className={`fixed top-20 right-5 z-50 w-full max-w-sm p-4 rounded-lg shadow-lg text-white ${bgColor}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
            {icon}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onDismiss} className="inline-flex text-white rounded-md p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
            <span className="sr-only">Close</span>
            &times;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;