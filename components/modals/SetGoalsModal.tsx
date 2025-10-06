import React, { useState, useEffect, useMemo } from 'react';
import { User, Role, Prospect, ProspectStage, Branch } from '../../types';
import { BRANCHES } from '../../constants';
import { useAuth } from '../../hooks/useAuth';

interface SetGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellers: User[];
  prospects: Prospect[];
}

const MonthlyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const DailyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const SellerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BranchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1" /></svg>;

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`py-2 px-4 text-sm font-medium transition-colors ${isActive ? 'border-b-2 border-brand-primary text-brand-primary' : 'border-b-2 border-transparent text-brand-text-secondary hover:text-brand-text-primary'}`}
    >
        {children}
    </button>
);

const ProgressIndicator = ({ current, goal }: { current?: number, goal?: string }) => {
    if (current === undefined) return <span className="text-xs text-brand-text-muted text-center">-</span>;
    
    const goalNum = parseInt(goal || '', 10);
    const hasGoal = !isNaN(goalNum) && goal !== '';
    
    if (!hasGoal) return <span className="text-xs text-brand-text-muted text-center">Actual: {current}</span>;

    const met = current >= goalNum;

    return (
        <span className={`text-xs font-semibold text-center ${met ? 'text-green-400' : 'text-amber-400'}`}>
            {current} / {goalNum} {met && '✓'}
        </span>
    );
};


const SetGoalsModal: React.FC<SetGoalsModalProps> = ({ isOpen, onClose, sellers, prospects }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === Role.Admin;
    const isManager = user?.role === Role.Manager;

    const [monthlyConversionGoal, setMonthlyConversionGoal] = useState<string>('');
    const [dailyConversionGoal, setDailyConversionGoal] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'rate' | 'seller' | 'branch'>(isManager ? 'seller' : 'rate');
    const [sellerGoals, setSellerGoals] = useState<Record<string, { monthly: string; daily: string }>>({});
    const [branchGoals, setBranchGoals] = useState<Record<string, { monthly: string; daily: string }>>({});
    const [goalSaveMessage, setGoalSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

     const { sellerConversions, branchConversions } = useMemo(() => {
        if (!prospects) return { sellerConversions: {}, branchConversions: {} };

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const dailyProspects = prospects.filter(p => new Date(p.createdAt) >= startOfDay);
        const monthlyProspects = prospects.filter(p => new Date(p.createdAt) >= startOfMonth);

        const calculateConversions = (prospectList: Prospect[]) => {
            const conversions = prospectList.filter(p => p.stage === ProspectStage.Won);
            
            const bySeller = sellers.reduce((acc, seller) => {
                acc[seller.id] = conversions.filter(p => p.assignedTo === seller.id).length;
                return acc;
            }, {} as Record<string, number>);

            const byBranch = BRANCHES.reduce((acc, branch) => {
                acc[branch as Branch] = conversions.filter(p => p.branch === branch).length;
                return acc;
            }, {} as Record<string, number>);

            return { bySeller, byBranch };
        };

        const dailyData = calculateConversions(dailyProspects);
        const monthlyData = calculateConversions(monthlyProspects);
        
        const finalSellerConversions = sellers.reduce((acc, seller) => {
            acc[seller.id] = {
                daily: dailyData.bySeller[seller.id] || 0,
                monthly: monthlyData.bySeller[seller.id] || 0,
            };
            return acc;
        }, {} as Record<string, { daily: number, monthly: number }>);
        
        const finalBranchConversions = BRANCHES.reduce((acc, branch) => {
            acc[branch as Branch] = {
                daily: dailyData.byBranch[branch as Branch] || 0,
                monthly: monthlyData.byBranch[branch as Branch] || 0,
            };
            return acc;
        }, {} as Record<string, { daily: number, monthly: number }>);

        return { sellerConversions: finalSellerConversions, branchConversions: finalBranchConversions };
    }, [prospects, sellers]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(isManager ? 'seller' : 'rate');

            const savedMonthlyGoal = localStorage.getItem('sportclub-crm-monthly-conversion-goal') || '';
            setMonthlyConversionGoal(savedMonthlyGoal);
            const savedDailyGoal = localStorage.getItem('sportclub-crm-daily-conversion-goal') || '';
            setDailyConversionGoal(savedDailyGoal);
            
            const loadedSellerGoals: Record<string, { monthly: string; daily: string }> = {};
            sellers.forEach(seller => {
                const monthlyGoal = localStorage.getItem(`sportclub-crm-goal-seller-monthly-${seller.id}`) || '';
                const dailyGoal = localStorage.getItem(`sportclub-crm-goal-seller-daily-${seller.id}`) || '';
                loadedSellerGoals[seller.id] = { monthly: monthlyGoal, daily: dailyGoal };
            });
            setSellerGoals(loadedSellerGoals);

            const loadedBranchGoals: Record<string, { monthly: string; daily: string }> = {};
            BRANCHES.forEach(branch => {
                 const monthlyGoal = localStorage.getItem(`sportclub-crm-goal-branch-monthly-${branch}`) || localStorage.getItem(`sportclub-crm-goal-branch-${branch}`) || '';
                 const dailyGoal = localStorage.getItem(`sportclub-crm-goal-branch-daily-${branch}`) || '';
                 loadedBranchGoals[branch] = { monthly: monthlyGoal, daily: dailyGoal };
            });
            setBranchGoals(loadedBranchGoals);

        } else {
            setGoalSaveMessage(null);
        }
    }, [isOpen, sellers, isManager]);

    const handleSellerGoalChange = (sellerId: string, goalType: 'monthly' | 'daily', value: string) => {
        setSellerGoals(prev => ({
            ...prev,
            [sellerId]: {
                ...(prev[sellerId] || { monthly: '', daily: '' }),
                [goalType]: value,
            },
        }));
    };

    const handleBranchGoalChange = (branch: string, goalType: 'monthly' | 'daily', value: string) => {
        setBranchGoals(prev => ({
            ...prev,
            [branch]: {
                ...(prev[branch] || { monthly: '', daily: '' }),
                [goalType]: value,
            },
        }));
    };

    const handleSaveGoals = () => {
        setGoalSaveMessage(null);

        if (isAdmin) {
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
                setGoalSaveMessage({ text: 'Por favor, ingrese valores válidos entre 0 y 100 para las tasas.', type: 'error'});
                setTimeout(() => setGoalSaveMessage(null), 3000);
                return;
            }
            
            localStorage.setItem('sportclub-crm-monthly-conversion-goal', monthlyConversionGoal);
            localStorage.setItem('sportclub-crm-daily-conversion-goal', dailyConversionGoal);
            
            Object.entries(branchGoals).forEach(([branch, goals]) => {
                const goalsObject = goals as { monthly: string; daily: string };
                 if (goalsObject.monthly && goalsObject.monthly.trim() !== '') {
                    localStorage.setItem(`sportclub-crm-goal-branch-monthly-${branch}`, goalsObject.monthly);
                } else {
                    localStorage.removeItem(`sportclub-crm-goal-branch-monthly-${branch}`);
                }
                localStorage.removeItem(`sportclub-crm-goal-branch-${branch}`); // Remove old key if exists

                if (goalsObject.daily && goalsObject.daily.trim() !== '') {
                    localStorage.setItem(`sportclub-crm-goal-branch-daily-${branch}`, goalsObject.daily);
                } else {
                    localStorage.removeItem(`sportclub-crm-goal-branch-daily-${branch}`);
                }
            });
        }
        
        Object.entries(sellerGoals).forEach(([sellerId, goals]) => {
            const goalsObject = goals as { monthly: string; daily: string };
            if (goalsObject.monthly && goalsObject.monthly.trim() !== '') {
                localStorage.setItem(`sportclub-crm-goal-seller-monthly-${sellerId}`, goalsObject.monthly);
            } else {
                localStorage.removeItem(`sportclub-crm-goal-seller-monthly-${sellerId}`);
            }
            if (goalsObject.daily && goalsObject.daily.trim() !== '') {
                localStorage.setItem(`sportclub-crm-goal-seller-daily-${sellerId}`, goalsObject.daily);
            } else {
                localStorage.removeItem(`sportclub-crm-goal-seller-daily-${sellerId}`);
            }
        });

        setGoalSaveMessage({ text: 'Objetivos guardados con éxito.', type: 'success' });
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-brand-border flex-shrink-0">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Establecer Objetivos de Conversión</h2>
                    <p className="text-sm text-brand-text-secondary">Estas metas se usarán en los reportes para medir el rendimiento.</p>
                     <div className="mt-4 border-b border-brand-border -mb-6 -mx-6 px-4">
                        {isAdmin && (
                            <TabButton isActive={activeTab === 'rate'} onClick={() => setActiveTab('rate')}>Tasa de Conversión (%)</TabButton>
                        )}
                        <TabButton isActive={activeTab === 'seller'} onClick={() => setActiveTab('seller')}>Por Vendedor (Nº)</TabButton>
                        {isAdmin && (
                            <TabButton isActive={activeTab === 'branch'} onClick={() => setActiveTab('branch')}>Por Sede (Nº)</TabButton>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {activeTab === 'rate' && (
                        <>
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
                        </>
                    )}
                    {activeTab === 'seller' && (
                        <div>
                             <div className="flex items-center gap-2 mb-4">
                                <SellerIcon />
                                <h3 className="text-lg font-semibold text-brand-text-primary">Objetivos por Vendedor (Nº conversiones)</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-5 items-center gap-x-3 gap-y-1 px-2 py-1">
                                    <span className="text-xs font-bold text-brand-text-secondary uppercase col-span-1">Vendedor</span>
                                    <span className="text-xs font-bold text-brand-text-secondary uppercase text-center col-span-2">Mensual</span>
                                    <span className="text-xs font-bold text-brand-text-secondary uppercase text-center col-span-2">Diario</span>
                                </div>
                                {sellers.length > 0 ? sellers.map(seller => (
                                    <div key={seller.id} className="grid grid-cols-5 items-center gap-x-3 gap-y-1">
                                        <label htmlFor={`seller-goal-monthly-${seller.id}`} className="text-sm text-brand-text-secondary truncate col-span-1">{seller.name}</label>
                                        <input
                                            type="number"
                                            id={`seller-goal-monthly-${seller.id}`}
                                            value={sellerGoals[seller.id]?.monthly || ''}
                                            onChange={(e) => handleSellerGoalChange(seller.id, 'monthly', e.target.value)}
                                            className="block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-center"
                                            placeholder="Nº"
                                            min="0"
                                            step="1"
                                        />
                                        <ProgressIndicator current={sellerConversions[seller.id]?.monthly} goal={sellerGoals[seller.id]?.monthly} />
                                        <input
                                            type="number"
                                            id={`seller-goal-daily-${seller.id}`}
                                            value={sellerGoals[seller.id]?.daily || ''}
                                            onChange={(e) => handleSellerGoalChange(seller.id, 'daily', e.target.value)}
                                            className="block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-center"
                                            placeholder="Nº"
                                            min="0"
                                            step="1"
                                        />
                                         <ProgressIndicator current={sellerConversions[seller.id]?.daily} goal={sellerGoals[seller.id]?.daily} />
                                    </div>
                                )) : <p className="text-sm text-brand-text-muted text-center">No hay vendedores para asignar objetivos.</p>}
                            </div>
                        </div>
                    )}
                     {activeTab === 'branch' && (
                        <div>
                             <div className="flex items-center gap-2 mb-4">
                                <BranchIcon />
                                <h3 className="text-lg font-semibold text-brand-text-primary">Objetivos por Sede (Nº conversiones)</h3>
                            </div>
                           <div className="space-y-3">
                                <div className="grid grid-cols-5 items-center gap-x-3 gap-y-1 px-2 py-1">
                                    <span className="text-xs font-bold text-brand-text-secondary uppercase col-span-1">Sede</span>
                                    <span className="text-xs font-bold text-brand-text-secondary uppercase text-center col-span-2">Mensual</span>
                                    <span className="text-xs font-bold text-brand-text-secondary uppercase text-center col-span-2">Diario</span>
                                </div>
                                {BRANCHES.map(branch => (
                                    <div key={branch} className="grid grid-cols-5 items-center gap-x-3 gap-y-1">
                                        <label htmlFor={`branch-goal-monthly-${branch}`} className="text-sm text-brand-text-secondary truncate col-span-1">{branch}</label>
                                        <input
                                            type="number"
                                            id={`branch-goal-monthly-${branch}`}
                                            value={branchGoals[branch]?.monthly || ''}
                                            onChange={(e) => handleBranchGoalChange(branch, 'monthly', e.target.value)}
                                            className="block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-center"
                                            placeholder="Nº"
                                            min="0"
                                            step="1"
                                        />
                                        <ProgressIndicator current={branchConversions[branch as Branch]?.monthly} goal={branchGoals[branch]?.monthly} />

                                        <input
                                            type="number"
                                            id={`branch-goal-daily-${branch}`}
                                            value={branchGoals[branch]?.daily || ''}
                                            onChange={(e) => handleBranchGoalChange(branch, 'daily', e.target.value)}
                                            className="block w-full p-2 border border-brand-border bg-brand-bg text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-center"
                                            placeholder="Nº"
                                            min="0"
                                            step="1"
                                        />
                                        <ProgressIndicator current={branchConversions[branch as Branch]?.daily} goal={branchGoals[branch]?.daily} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {goalSaveMessage && <p className={`text-center text-sm mt-4 ${goalSaveMessage.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>{goalSaveMessage.text}</p>}
                </div>

                <div className="px-6 py-4 bg-black/20 border-t border-brand-border flex justify-end gap-3 flex-shrink-0">
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