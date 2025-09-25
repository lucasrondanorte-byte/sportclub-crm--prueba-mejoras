import React, { useState, useEffect } from 'react';

interface SetGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MonthlyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const DailyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

const SetGoalsModal: React.FC<SetGoalsModalProps> = ({ isOpen, onClose }) => {
    const [monthlyConversionGoal, setMonthlyConversionGoal] = useState<string>('');
    const [dailyConversionGoal, setDailyConversionGoal] = useState<string>('');
    const [goalSaveMessage, setGoalSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        if (isOpen) {
            const savedMonthlyGoal = localStorage.getItem('sportclub-crm-monthly-conversion-goal') || '';
            setMonthlyConversionGoal(savedMonthlyGoal);
            const savedDailyGoal = localStorage.getItem('sportclub-crm-daily-conversion-goal') || '';
            setDailyConversionGoal(savedDailyGoal);
        } else {
            setGoalSaveMessage(null);
        }
    }, [isOpen]);

    const handleSaveGoals = () => {
        setGoalSaveMessage(null);
        let hasError = false;
        const monthlyGoalValue = parseFloat(monthlyConversionGoal);
        if (monthlyConversionGoal !== '' && (isNaN(monthlyGoalValue) || monthlyGoalValue < 0 || monthlyGoalValue > 100)) {
            hasError = true;
        }
        const dailyGoalValue = parseFloat(dailyConversionGoal);
        if (dailyConversionGoal !== '' && (isNaN(dailyGoalValue) || dailyGoalValue < 0 || dailyGoalValue > 100)) {
            hasError = true;
        }

        if (hasError) {
            setGoalSaveMessage({ text: 'Por favor, ingrese valores válidos entre 0 y 100.', type: 'error'});
            setTimeout(() => setGoalSaveMessage(null), 3000);
        } else {
            localStorage.setItem('sportclub-crm-monthly-conversion-goal', monthlyConversionGoal);
            localStorage.setItem('sportclub-crm-daily-conversion-goal', dailyConversionGoal);
            setGoalSaveMessage({ text: 'Objetivos guardados con éxito.', type: 'success' });
            setTimeout(() => {
                onClose();
            }, 1500);
        }
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-lg m-4">
                <div className="p-6 border-b border-brand-border">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Establecer Objetivos de Conversión</h2>
                    <p className="text-sm text-brand-text-secondary">Estas metas se usarán en los reportes para medir el rendimiento.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-bg flex items-center justify-center border border-brand-border">
                            <MonthlyIcon />
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="monthlyConversionGoal" className="block text-sm font-semibold text-brand-text-primary">
                                Meta de Conversión Mensual
                            </label>
                            <p className="text-xs text-brand-text-muted">Objetivo de prospectos ganados para el mes actual.</p>
                            <div className="relative mt-2">
                                <input
                                    type="number"
                                    id="monthlyConversionGoal"
                                    value={monthlyConversionGoal}
                                    onChange={(e) => setMonthlyConversionGoal(e.target.value)}
                                    className="block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary pr-8"
                                    placeholder="Ej: 25"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-bg flex items-center justify-center border border-brand-border">
                            <DailyIcon />
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="dailyConversionGoal" className="block text-sm font-semibold text-brand-text-primary">
                                Meta de Conversión Diaria
                            </label>
                             <p className="text-xs text-brand-text-muted">Objetivo de prospectos ganados para el día de hoy.</p>
                            <div className="relative mt-2">
                                <input
                                    type="number"
                                    id="dailyConversionGoal"
                                    value={dailyConversionGoal}
                                    onChange={(e) => setDailyConversionGoal(e.target.value)}
                                    className="block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary pr-8"
                                    placeholder="Ej: 30"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {goalSaveMessage && <p className={`text-center text-sm mt-2 ${goalSaveMessage.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>{goalSaveMessage.text}</p>}
                </div>

                <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border border border-transparent rounded-md shadow-sm hover:bg-gray-600">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleSaveGoals} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-primary-hover">
                        Guardar Objetivos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetGoalsModal;
