import React, { useState, useEffect } from 'react';
import { Prospect, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

interface ReassignProspectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sellers: User[];
  prospectsToReassign: Prospect[];
}

const ReassignProspectsModal: React.FC<ReassignProspectsModalProps> = ({ isOpen, onClose, onSuccess, sellers, prospectsToReassign }) => {
    const { user } = useAuth();
    const [mode, setMode] = useState<'random' | 'single'>('random');
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
    const [singleSellerId, setSingleSellerId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setMode('random');
            setSelectedSellers([]);
            setSingleSellerId('');
            setIsSubmitting(false);
            setError(null);
        }
    }, [isOpen]);

    const handleSellerToggle = (sellerId: string) => {
        setSelectedSellers(prev => 
            prev.includes(sellerId) ? prev.filter(id => id !== sellerId) : [...prev, sellerId]
        );
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        setError(null);
        
        try {
            const updatePromises = prospectsToReassign.map(prospect => {
                let assignedTo = prospect.assignedTo;
                if (mode === 'random' && selectedSellers.length > 0) {
                    assignedTo = selectedSellers[Math.floor(Math.random() * selectedSellers.length)];
                } else if (mode === 'single' && singleSellerId) {
                    assignedTo = singleSellerId;
                }
                
                const updatedProspect = { ...prospect, assignedTo, updatedBy: user.id };
                return api.updateProspect(updatedProspect);
            });
            await Promise.all(updatePromises);
            onSuccess();
        } catch (error) {
            console.error("Failed to reassign prospects", error);
            setError("Ocurrió un error al reasignar. Por favor, intente de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isSubmitDisabled = isSubmitting || (mode === 'random' && selectedSellers.length === 0) || (mode === 'single' && !singleSellerId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-lg m-4">
                <div className="p-6 border-b border-brand-border">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Reasignar Prospectos</h2>
                    <p className="text-sm text-brand-text-secondary">
                        Estás a punto de reasignar {prospectsToReassign.length} {prospectsToReassign.length === 1 ? 'prospecto' : 'prospectos'}.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-2">Método de Asignación</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input type="radio" name="assignmentMode" value="random" checked={mode === 'random'} onChange={() => setMode('random')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary" />
                                <span className="ml-2 text-sm text-brand-text-primary">Aleatoria</span>
                            </label>
                            <label className="flex items-center">
                                <input type="radio" name="assignmentMode" value="single" checked={mode === 'single'} onChange={() => setMode('single')} className="h-4 w-4 text-brand-primary focus:ring-brand-primary" />
                                <span className="ml-2 text-sm text-brand-text-primary">A un vendedor específico</span>
                            </label>
                        </div>
                    </div>

                    {mode === 'random' && (
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Vendedores para distribución</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-brand-border rounded-md">
                                {sellers.map(seller => (
                                    <label key={seller.id} className="flex items-center p-2 rounded-md hover:bg-white/5 cursor-pointer">
                                        <input type="checkbox" checked={selectedSellers.includes(seller.id)} onChange={() => handleSellerToggle(seller.id)} className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary" />
                                        <span className="ml-3 text-sm font-medium text-brand-text-primary">{seller.name}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedSellers.length === 0 && <p className="text-xs text-red-500 mt-1">Selecciona al menos un vendedor.</p>}
                        </div>
                    )}

                    {mode === 'single' && (
                        <div>
                             <label htmlFor="singleSeller" className="block text-sm font-medium text-brand-text-secondary">Asignar todos a</label>
                             <select id="singleSeller" value={singleSellerId} onChange={(e) => setSingleSellerId(e.target.value)} className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm p-2 text-brand-text-primary focus:ring-brand-primary focus:border-brand-primary">
                                <option value="" disabled>Seleccionar vendedor...</option>
                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                             {!singleSellerId && <p className="text-xs text-red-500 mt-1">Debes seleccionar un vendedor.</p>}
                        </div>
                    )}
                     {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                </div>

                <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border border-transparent rounded-md shadow-sm hover:bg-gray-600">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover disabled:opacity-50 flex items-center">
                         {isSubmitting ? <><Spinner /> <span className="ml-2">Reasignando...</span></> : 'Confirmar Reasignación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReassignProspectsModal;