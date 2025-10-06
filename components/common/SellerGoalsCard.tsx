import React, { useState, useEffect, useMemo } from 'react';
import { User, Prospect, ProspectStage } from '../../types';
import Card from './Card';

const DailyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MonthlyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

interface SellerGoalsCardProps {
  user: User;
  prospects: Prospect[];
}

const ProgressBar = ({ current, goal }: { current: number, goal: number }) => {
    const percentage = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
    const isMet = current >= goal;
    return (
        <div className="w-full bg-brand-bg rounded-full h-2.5 mt-1">
            <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${isMet ? 'bg-green-500' : 'bg-brand-primary'}`} 
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

const SellerGoalsCard: React.FC<SellerGoalsCardProps> = ({ user, prospects }) => {
    const [goals, setGoals] = useState<{ monthly?: number; daily?: number }>({});

    useEffect(() => {
        const monthlyGoalRaw = localStorage.getItem(`sportclub-crm-goal-seller-monthly-${user.id}`);
        const dailyGoalRaw = localStorage.getItem(`sportclub-crm-goal-seller-daily-${user.id}`);
        
        const monthly = monthlyGoalRaw ? parseInt(monthlyGoalRaw, 10) : undefined;
        const daily = dailyGoalRaw ? parseInt(dailyGoalRaw, 10) : undefined;

        setGoals({ 
            monthly: isNaN(monthly!) ? undefined : monthly,
            daily: isNaN(daily!) ? undefined : daily,
        });
    }, [user.id]);

    const conversions = useMemo(() => {
        const sellerProspects = prospects.filter(p => p.assignedTo === user.id);
        const wonProspects = sellerProspects.filter(p => p.stage === ProspectStage.Won);

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const daily = wonProspects.filter(p => new Date(p.updatedAt) >= startOfDay).length;
        const monthly = wonProspects.filter(p => new Date(p.updatedAt) >= startOfMonth).length;

        return { daily, monthly };
    }, [prospects, user.id]);

    return (
        <Card title="Mis Objetivos" className="mb-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Goal */}
                <div className="flex items-center gap-4 p-4 bg-brand-bg/60 rounded-lg">
                    <div className="flex-shrink-0">
                        <DailyIcon />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-brand-text-primary">Progreso Diario</h4>
                        {goals.daily !== undefined ? (
                            <>
                                <div className="flex justify-between items-baseline mt-1">
                                    <span className={`text-2xl font-bold ${conversions.daily >= goals.daily ? 'text-green-400' : 'text-brand-text-primary'}`}>{conversions.daily}</span>
                                    <span className="text-sm text-brand-text-muted">/ {goals.daily}</span>
                                </div>
                                <ProgressBar current={conversions.daily} goal={goals.daily} />
                            </>
                        ) : (
                            <p className="text-brand-text-secondary mt-1">
                                Conversiones hoy: <span className="font-bold text-xl text-brand-text-primary">{conversions.daily}</span>
                                <span className="text-xs ml-2">(Sin objetivo)</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Monthly Goal */}
                <div className="flex items-center gap-4 p-4 bg-brand-bg/60 rounded-lg">
                    <div className="flex-shrink-0">
                        <MonthlyIcon />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-brand-text-primary">Progreso Mensual</h4>
                        {goals.monthly !== undefined ? (
                            <>
                                <div className="flex justify-between items-baseline mt-1">
                                    <span className={`text-2xl font-bold ${conversions.monthly >= goals.monthly ? 'text-green-400' : 'text-brand-text-primary'}`}>{conversions.monthly}</span>
                                    <span className="text-sm text-brand-text-muted">/ {goals.monthly}</span>
                                </div>
                                <ProgressBar current={conversions.monthly} goal={goals.monthly} />
                            </>
                        ) : (
                             <p className="text-brand-text-secondary mt-1">
                                Conversiones este mes: <span className="font-bold text-xl text-brand-text-primary">{conversions.monthly}</span>
                                <span className="text-xs ml-2">(Sin objetivo)</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SellerGoalsCard;