import React, { useState, useCallback } from 'react';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

const Spinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.006-1.742 3.006H4.42c-1.522 0-2.492-1.672-1.742-3.006l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;

interface ImportGoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sellers: User[];
}

const ImportGoogleSheetModal: React.FC<ImportGoogleSheetModalProps> = ({ isOpen, onClose, onSuccess, sellers }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const resetState = useCallback(() => {
    setStep('idle');
    setMessage('');
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImport = async () => {
    if (!user || sellers.length === 0) {
      setStep('error');
      setMessage("No hay vendedores disponibles para asignar los prospectos.");
      return;
    }

    setStep('loading');
    setMessage("Importando, por favor espere...");

    const result = await api.runGoogleSheetImport(user, sellers);

    if (result.success) {
        setStep('success');
        setMessage(result.message);
    } else {
        setStep('error');
        setMessage(result.message);
    }
  };

  const renderContent = () => {
    switch(step) {
      case 'loading':
        return (
          <div className="text-center py-10">
            <Spinner />
            <h3 className="text-xl font-bold mt-4 text-brand-text-primary">Procesando...</h3>
            <p className="text-brand-text-secondary mt-2">{message}</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center py-10">
            <CheckCircleIcon />
            <h3 className="text-2xl font-bold mt-4 text-brand-text-primary">¡Importación Completada!</h3>
            <p className="text-brand-text-secondary mt-2">{message}</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center py-10">
            <AlertTriangleIcon />
            <h3 className="text-2xl font-bold mt-4 text-brand-text-primary">Error de Importación</h3>
            <p className="text-brand-text-secondary mt-2 bg-red-900/30 p-3 rounded-md">{message}</p>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="p-6 text-center space-y-4">
            <h3 className="text-xl font-semibold text-brand-text-primary">Importar prospectos desde Google Sheet</h3>
            <p className="text-sm text-brand-text-secondary">
              Esta acción buscará nuevos prospectos en la planilla, evitará duplicados y los asignará automáticamente.
            </p>
            <div className="p-4 text-xs text-brand-text-muted bg-brand-bg/50 border border-brand-border rounded-lg">
              <strong>Nota:</strong> Este proceso puede ser automático. Esta opción es para forzar una sincronización manual ahora.
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="p-5 border-b border-brand-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-text-primary">Importación desde Google Sheet</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-3xl font-bold">&times;</button>
        </div>

        <div>{renderContent()}</div>

        <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end gap-3">
          {step === 'idle' && (
            <>
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border border-transparent rounded-md shadow-sm hover:bg-gray-600">
                Cancelar
              </button>
              <button type="button" onClick={handleImport} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover">
                Iniciar Importación
              </button>
            </>
          )}
          {(step === 'success' || step === 'error') && (
            <button
              type="button"
              onClick={() => { if(step==='success') onSuccess(); handleClose(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportGoogleSheetModal;