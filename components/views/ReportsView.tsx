import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector, Trapezoid } from 'recharts';
import { api } from '../../services/api';
import { Prospect, User, Role, ProspectStage, Task, TaskStatus, Branch } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import { BRANCHES } from '../../constants';
import SellerDetailModal from '../modals/SellerDetailModal';

// Let TypeScript know that the XLSX library is available globally
declare var XLSX: any;

type View = 'reports' | 'prospects' | 'members' | 'tasks';

interface ReportsViewProps {
  setCurrentView: (view: View) => void;
}

export interface SellerData {
  sellerId: string;
  sellerName: string;
  totalProspects: number;
  conversions: number;
  conversionRate: number;
  prospectsInTrial: number;
  funnelData: { name: string; value: number; fill: string }[];
  sourceData: { name: string; value: number }[];
}


const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-300" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CheckBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;

// Brand colors from the discipline guide
export const BRAND_CHART_COLORS = ['#E30513', '#FFD400', '#198ccd', '#4fbc22', '#ef8333', '#9CA3AF', '#FFFFFF'];

// Custom Tooltip for Funnel Chart
// FIX: The type definitions for recharts TooltipProps seem to be incorrect in this environment.
// Using `any` to bypass the type error on the `payload` property.
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-brand-sidebar p-3 rounded-lg border border-brand-border shadow-lg text-sm">
        <p className="font-bold flex items-center" style={{ color: data.payload.fill }}>
           {data.name}
        </p>
        <p className="text-brand-text-primary mt-1">
            Prospectos: <span className="font-semibold">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// New Active Shape for Pie Chart
// FIX: The type definitions for recharts SectorProps seem to be incorrect in this environment.
// Using `any` to bypass the type error on properties like `midAngle`.
const renderActivePieShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, startAngle, endAngle, fill, payload, percent = 0, value = 0 } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff" className="font-bold text-lg">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                className="drop-shadow-lg"
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 4}
                outerRadius={outerRadius + 8}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff" className="text-sm">{`${payload.name}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#9CA3AF" className="text-xs">
                {`(${value} prospectos)`}
            </text>
        </g>
    );
};


const ReportsView: React.FC<ReportsViewProps> = ({ setCurrentView }) => {
    const { user } = useAuth();
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [branchFilter, setBranchFilter] = useState('all');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [pieActiveIndex, setPieActiveIndex] = useState(-1);
    const [funnelActiveIndex, setFunnelActiveIndex] = useState(-1);
    const [monthlyConversionGoal, setMonthlyConversionGoal] = useState<number | null>(null);
    const [dailyConversionGoal, setDailyConversionGoal] = useState<number | null>(null);
    const [sellerGoals, setSellerGoals] = useState<Record<string, { monthly?: number; daily?: number }>>({});
    const [branchGoals, setBranchGoals] = useState<Record<string, number>>({});
    const [timePeriod, setTimePeriod] = useState<'monthly' | 'daily'>('monthly');
    const [isDataMenuOpen, setDataMenuOpen] = useState(false);
    const [isSellerModalOpen, setSellerModalOpen] = useState(false);
    const [selectedSellerData, setSelectedSellerData] = useState<SellerData | null>(null);
    const dataMenuRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) {
                setDataMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dataMenuRef]);

    const sellers = useMemo(() => users.filter(u => u.role === Role.Seller), [users]);

    useEffect(() => {
        setLoading(true);
        const savedMonthlyGoal = localStorage.getItem('sportclub-crm-monthly-conversion-goal');
        if (savedMonthlyGoal && savedMonthlyGoal !== '') setMonthlyConversionGoal(parseFloat(savedMonthlyGoal)); else setMonthlyConversionGoal(null);
        
        const savedDailyGoal = localStorage.getItem('sportclub-crm-daily-conversion-goal');
        if (savedDailyGoal && savedDailyGoal !== '') setDailyConversionGoal(parseFloat(savedDailyGoal)); else setDailyConversionGoal(null);
        
        Promise.all([api.getProspects(), api.getUsers(), api.getTasks()])
            .then(([prospectsData, usersData, tasksData]) => {
                setProspects(prospectsData);
                setUsers(usersData);
                setTasks(tasksData);
            })
            .catch(error => console.error("Failed to fetch report data", error))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (sellers.length > 0) {
            const loadedSellerGoals: Record<string, { monthly?: number; daily?: number }> = {};
            sellers.forEach(seller => {
                const monthlyGoalRaw = localStorage.getItem(`sportclub-crm-goal-seller-monthly-${seller.id}`);
                const dailyGoalRaw = localStorage.getItem(`sportclub-crm-goal-seller-daily-${seller.id}`);
                
                const monthlyGoal = monthlyGoalRaw && !isNaN(parseInt(monthlyGoalRaw, 10)) ? parseInt(monthlyGoalRaw, 10) : undefined;
                const dailyGoal = dailyGoalRaw && !isNaN(parseInt(dailyGoalRaw, 10)) ? parseInt(dailyGoalRaw, 10) : undefined;

                if (monthlyGoal !== undefined || dailyGoal !== undefined) {
                  loadedSellerGoals[seller.id] = { monthly: monthlyGoal, daily: dailyGoal };
                }
            });
            setSellerGoals(loadedSellerGoals);
        }
    
        const loadedBranchGoals: Record<string, number> = {};
        BRANCHES.forEach(branch => {
            const goal = localStorage.getItem(`sportclub-crm-goal-branch-${branch}`);
            if (goal && !isNaN(parseInt(goal, 10))) {
                loadedBranchGoals[branch] = parseInt(goal, 10);
            }
        });
        setBranchGoals(loadedBranchGoals);
    }, [sellers]);


    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const pendingTasksForSeller = useMemo(() => {
        if (!user || user.role !== Role.Seller) {
            return [];
        }
        return tasks.filter(task =>
            task.assignedTo === user.id &&
            task.status === TaskStatus.Pending
        );
    }, [tasks, user]);

    const filteredProspects = useMemo(() => {
        if (!user) return [];
        let prospectsToFilter = prospects;

        if (user.role === Role.Admin) {
            if (branchFilter !== 'all') {
                prospectsToFilter = prospectsToFilter.filter(p => p.branch === branchFilter);
            }
        } else { // For Manager, Seller, Viewer
            prospectsToFilter = prospectsToFilter.filter(p => p.branch === user.branch);
        }
        return prospectsToFilter;
    }, [prospects, user, branchFilter]);
    
    const monthlyProspects = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return filteredProspects.filter(p => new Date(p.createdAt) >= startOfMonth);
    }, [filteredProspects]);

    const dailyProspects = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return filteredProspects.filter(p => new Date(p.createdAt) >= startOfDay);
    }, [filteredProspects]);

    const timePeriodProspects = useMemo(() => {
        return timePeriod === 'monthly' ? monthlyProspects : dailyProspects;
    }, [timePeriod, monthlyProspects, dailyProspects]);

    const monthlyConversionRateData = useMemo(() => {
        const total = monthlyProspects.length;
        if (total === 0) return { rate: '0.0', won: 0, total: 0 };
        const won = monthlyProspects.filter(p => p.stage === ProspectStage.Won).length;
        const rate = (won / total) * 100;
        return { rate: rate.toFixed(1), won, total };
    }, [monthlyProspects]);

    const dailyConversionRateData = useMemo(() => {
        const total = dailyProspects.length;
        if (total === 0) return { rate: '0.0', won: 0, total: 0 };
        const won = dailyProspects.filter(p => p.stage === ProspectStage.Won).length;
        const rate = (won / total) * 100;
        return { rate: rate.toFixed(1), won, total };
    }, [dailyProspects]);

    const salesFunnelData = useMemo(() => {
        const stageCounts = timePeriodProspects.reduce((acc, p) => {
            acc[p.stage] = (acc[p.stage] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { name: ProspectStage.New, value: stageCounts[ProspectStage.New] || 0, fill: BRAND_CHART_COLORS[2] },
            { name: ProspectStage.Contacted, value: stageCounts[ProspectStage.Contacted] || 0, fill: BRAND_CHART_COLORS[1] },
            { name: ProspectStage.Trial, value: stageCounts[ProspectStage.Trial] || 0, fill: BRAND_CHART_COLORS[6] },
            { name: ProspectStage.Won, value: stageCounts[ProspectStage.Won] || 0, fill: BRAND_CHART_COLORS[3] },
        ].sort((a,b)=> b.value - a.value);
    }, [timePeriodProspects]);

    const sellerPerformanceData = useMemo(() => {
        if (!user) return [];
        const stats: Record<string, { conversions: number; total: number }> = sellers.reduce((acc, seller) => {
            acc[seller.id] = { conversions: 0, total: 0 };
            return acc;
        }, {} as Record<string, { conversions: number; total: number }>);

        timePeriodProspects.forEach(prospect => {
            if (stats[prospect.assignedTo]) {
                stats[prospect.assignedTo].total++;
                if (prospect.stage === ProspectStage.Won) {
                    stats[prospect.assignedTo].conversions++;
                }
            }
        });
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);

        const sellersToDisplay = sellers.filter(seller => {
            if (user.role === Role.Admin) {
                return branchFilter === 'all' || seller.branch === branchFilter;
            }
            if (user.role === Role.Manager) {
                return seller.branch === user.branch;
            }
            if (user.role === Role.Seller) {
                return seller.id === user.id;
            }
            return false;
        });

        return sellersToDisplay.map(seller => {
            const sellerStats = stats[seller.id] || { conversions: 0, total: 0 };
            const conversionRate = sellerStats.total > 0 ? (sellerStats.conversions / sellerStats.total) * 100 : 0;
            
            let dynamicGoal, adjustment;
            const baseMonthlyGoal = sellerGoals[seller.id]?.monthly;
            const baseDailyGoal = sellerGoals[seller.id]?.daily;

            if (timePeriod === 'daily' && baseDailyGoal !== undefined) {
                const yesterdayConversions = prospects.filter(p =>
                    p.assignedTo === seller.id &&
                    p.stage === ProspectStage.Won &&
                    new Date(p.updatedAt) >= startOfYesterday &&
                    new Date(p.updatedAt) <= endOfYesterday
                ).length;
                
                const yesterdayDelta = yesterdayConversions - baseDailyGoal;
                dynamicGoal = Math.max(1, baseDailyGoal - yesterdayDelta);
                adjustment = -yesterdayDelta;
            }

            return {
                sellerId: seller.id,
                sellerName: seller.name,
                conversions: sellerStats.conversions,
                totalProspects: sellerStats.total,
                conversionRate: parseFloat(conversionRate.toFixed(1)),
                goal: timePeriod === 'monthly' ? baseMonthlyGoal : baseDailyGoal,
                dynamicGoal: dynamicGoal,
                adjustment: adjustment,
            };
        }).sort((a, b) => b.conversions - a.conversions);
    }, [prospects, timePeriodProspects, sellers, user, branchFilter, sellerGoals, timePeriod]);

    const branchPerformanceData = useMemo(() => {
        const stats: Record<string, { conversions: number }> = BRANCHES.reduce((acc, branch) => {
            acc[branch] = { conversions: 0 };
            return acc;
        }, {} as Record<string, { conversions: number }>);

        timePeriodProspects.forEach(prospect => {
            if (stats[prospect.branch]) {
                if (prospect.stage === ProspectStage.Won) {
                    stats[prospect.branch].conversions++;
                }
            }
        });

        let branchesToDisplay: string[] = [...BRANCHES];
        if (user?.role === Role.Manager || user?.role === Role.Seller || user?.role === Role.Viewer) {
            branchesToDisplay = [user.branch];
        } else if (user?.role === Role.Admin && branchFilter !== 'all') {
            branchesToDisplay = [branchFilter];
        }

        return branchesToDisplay.map(branch => {
            const branchStats = stats[branch] || { conversions: 0 };
            const goal = branchGoals[branch];
            return {
                branchName: branch,
                conversions: branchStats.conversions,
                goal: goal,
            };
        }).sort((a, b) => b.conversions - a.conversions);
    }, [timePeriodProspects, branchGoals, user, branchFilter]);


    const leadsBySourceData = useMemo(() => {
        const sources = timePeriodProspects.reduce((acc, p) => {
            acc[p.source] = (acc[p.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(sources).map(([name, value]) => ({ name, value }));
    }, [timePeriodProspects]);
    
    const handleExportExcel = () => {
        const dataToExport = filteredProspects.map(p => ({
            "ID": p.id,
            "Nombre": p.name,
            "Email": p.email,
            "Teléfono": p.phone || '',
            "Sucursal": p.branch,
            "Etapa": p.stage,
            "Origen": p.source,
            "Interés": p.interest,
            "Vendedor Asignado": userMap.get(p.assignedTo) || 'N/A',
            "Fecha Creación": new Date(p.createdAt).toLocaleDateString('es-AR'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos");
        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `reporte_prospectos_${date}.xlsx`);
    };

    const handleExportAllData = () => {
        try {
            const backupData: { [key: string]: any } = {};
            const keysToBackup = [
                'sportclub-crm-users', 'sportclub-crm-prospects', 'sportclub-crm-members',
                'sportclub-crm-tasks', 'sportclub-crm-interactions'
            ];
            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) backupData[key] = JSON.parse(item);
            });
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `sportclub-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Error exporting data:", error);
        }
    };
    
    const handleImportAllData = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImportError(null);
        setImportSuccess(null);
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                const requiredKeys = ['sportclub-crm-users', 'sportclub-crm-prospects'];
                if (!requiredKeys.every(key => key in data)) {
                    throw new Error("El archivo de backup no tiene el formato correcto.");
                }
                if (window.confirm("¿Estás seguro? Esta acción sobreescribirá todos los datos actuales.")) {
                    Object.keys(data).forEach(key => localStorage.setItem(key, JSON.stringify(data[key])));
                    setImportSuccess("Datos restaurados con éxito. La aplicación se recargará.");
                    setTimeout(() => window.location.reload(), 2000);
                }
            } catch (err: any) {
                setImportError(`Error al importar: ${err.message}`);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };
    
    const renderActiveFunnelShape = (props: any) => {
        const { x, y, upperWidth, lowerWidth, height, activeIndex } = props;
        const isActive = props.index === activeIndex;
        const scale = isActive ? 1.04 : 1.0;
        const cx = x + Math.max(upperWidth, lowerWidth) / 2;
        const cy = y + height / 2;
        return <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`}><Trapezoid {...props} /></g>;
    };

    const onPieMouseEnter = useCallback((_: any, index: number) => setPieActiveIndex(index), []);
    const onPieMouseLeave = useCallback(() => setPieActiveIndex(-1), []);
    const handleFunnelChartEnter = useCallback((e: any) => e.activeTooltipIndex > -1 && setFunnelActiveIndex(e.activeTooltipIndex), []);
    const handleFunnelChartLeave = useCallback(() => setFunnelActiveIndex(-1), []);
    const handleLegendEnter = useCallback((o: any) => setFunnelActiveIndex(salesFunnelData.findIndex((entry) => entry.name === o.value)), [salesFunnelData]);
    const handleLegendLeave = useCallback(() => setFunnelActiveIndex(-1), []);
    
    const handleSellerRowClick = (sellerPerformance: (typeof sellerPerformanceData)[0]) => {
        const sellerProspects = prospects.filter(p => p.assignedTo === sellerPerformance.sellerId);
        const funnelData = [ProspectStage.New, ProspectStage.Contacted, ProspectStage.Trial, ProspectStage.Won, ProspectStage.Lost]
            .map((stage, index) => ({
                name: stage,
                value: sellerProspects.filter(p => p.stage === stage).length,
                fill: BRAND_CHART_COLORS[index % BRAND_CHART_COLORS.length]
            })).filter(item => item.value > 0);
        const sourceData = Object.entries(sellerProspects.reduce((acc, p) => {
                acc[p.source] = (acc[p.source] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));
        const prospectsInTrial = sellerProspects.filter(p => p.stage === ProspectStage.Trial).length;
        setSelectedSellerData({ ...sellerPerformance, prospectsInTrial, funnelData, sourceData });
        setSellerModalOpen(true);
    };

    const renderCustomLegend = (props: any) => {
        const { payload, onMouseEnter, onMouseLeave } = props;
        return (
            <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-brand-text-secondary">
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center cursor-pointer" onMouseEnter={() => onMouseEnter(entry, index)} onMouseLeave={() => onMouseLeave(entry, index)}>
                    <span className="w-3 h-3 mr-2 rounded-sm" style={{ backgroundColor: entry.color, display: 'inline-block' }}></span>
                    <span>{entry.value}</span>
                </div>
            ))}
            </div>
        );
    };

    const TimePeriodFilter = ({ period, setPeriod }: { period: 'monthly' | 'daily', setPeriod: (p: 'monthly' | 'daily') => void }) => (
        <div className="absolute top-4 right-4 bg-brand-bg p-1 rounded-lg text-sm z-10">
            <button onClick={() => setPeriod('monthly')} className={`px-3 py-1 rounded-md ${period === 'monthly' ? 'bg-brand-surface shadow text-brand-primary font-semibold' : 'text-brand-text-secondary'}`}>Mes</button>
            <button onClick={() => setPeriod('daily')} className={`px-3 py-1 rounded-md ${period === 'daily' ? 'bg-brand-surface shadow text-brand-primary font-semibold' : 'text-brand-text-secondary'}`}>Hoy</button>
        </div>
    );
    
    const KpiCard = ({ title, value, subtext, icon, goal, goalMet, timePeriod, setTimePeriod }: any) => {
        const rateValue = parseFloat(value);
        const progressWidth = isNaN(rateValue) ? 0 : Math.min(100, rateValue);
        return (
            <Card className="relative flex flex-col justify-between">
                <TimePeriodFilter period={timePeriod} setPeriod={setTimePeriod} />
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-brand-text-primary">{title}</h3>
                        <p className="text-xs text-brand-text-muted">{subtext}</p>
                    </div>
                    <div className={`p-2 bg-brand-surface rounded-lg text-brand-primary`}>
                        {icon}
                    </div>
                </div>
                <div className="mt-4">
                    <p className={`text-5xl font-bold ${goal !== null ? (goalMet ? 'text-green-400' : 'text-amber-400') : 'text-brand-text-primary'}`}>{value}</p>
                    {goal !== null && (
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-brand-text-muted">
                                <span>Progreso</span>
                                <span>Objetivo: {goal}%</span>
                            </div>
                            <div className="w-full bg-brand-bg rounded-full h-2.5 mt-1">
                                <div className={`h-2.5 rounded-full transition-all duration-500 ${goalMet ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${progressWidth}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    const PIE_COLORS = BRAND_CHART_COLORS;
    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;
    
    const periodText = timePeriod === 'monthly' ? 'Este Mes' : 'Hoy';
    const baseTitle = user?.role === Role.Seller ? "Mi Rendimiento" : `Rendimiento de Vendedores`;
    let branchInfo = '';
    if (canManage) {
        if (branchFilter !== 'all') {
            branchInfo = `(${branchFilter})`;
        } else if (user?.role === Role.Manager) {
            branchInfo = `(${user.branch})`;
        }
    }
    const performanceTableTitle = `${baseTitle} (${periodText}) ${branchInfo}`.trim();

    if (loading) return <Card>Cargando reportes...</Card>;
    if (user?.role === Role.Viewer && prospects.length === 0) return <Card>No hay datos para mostrar.</Card>;
    
    const conversionData = timePeriod === 'monthly' ? monthlyConversionRateData : dailyConversionRateData;
    const currentGoal = timePeriod === 'monthly' ? monthlyConversionGoal : dailyConversionGoal;
    const currentRate = parseFloat(conversionData.rate);
    const goalMet = currentGoal !== null && currentRate >= currentGoal;

    return (
        <div className="space-y-6">
             <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text-primary">Reportes y Estadísticas</h1>
                    <h2 className="text-md font-medium text-brand-text-secondary mt-1">
                        {user?.role === Role.Admin ? `Estadísticas Generales ${branchFilter !== 'all' ? `(${branchFilter})` : '(Todas las sucursales)'}` : `Estadísticas de Sucursal (${user?.branch})`}
                    </h2>
                </div>
                {(canManage) && (
                    <div className="flex flex-wrap items-center gap-3">
                        {user?.role === Role.Admin && (
                            <div className="flex items-center gap-2">
                                <label htmlFor="branchFilter" className="text-sm font-medium text-brand-text-secondary">Sucursal:</label>
                                <select id="branchFilter" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="p-2 border border-brand-border bg-brand-surface text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-sm">
                                    <option value="all">Todas</option>
                                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        )}
                        <div data-tutorial="data-management" className="flex items-center gap-3">
                            <button onClick={handleExportExcel} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-accent bg-brand-accent/10 border border-brand-accent/30 rounded-md hover:bg-brand-accent hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"><DownloadIcon />Exportar a Excel</button>
                            {user?.role === Role.Admin && (
                                <div ref={dataMenuRef} className="relative">
                                    <button onClick={() => setDataMenuOpen(prev => !prev)} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-surface border border-brand-border rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"><CogIcon /><span className="ml-2">Datos</span></button>
                                    {isDataMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-64 origin-top-right bg-brand-surface border border-brand-border rounded-md shadow-lg z-10 transition-opacity duration-200">
                                            <div className="p-4 space-y-3">
                                                <h4 className="font-semibold text-brand-text-primary">Copias de Seguridad</h4>
                                                <p className="text-xs text-brand-text-muted">Realiza copias de seguridad o restaura todos los datos desde un archivo JSON.</p>
                                                <button onClick={() => { handleExportAllData(); setDataMenuOpen(false); }} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary-hover">Exportar Backup</button>
                                                <label htmlFor="import-backup-input" className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border rounded-md hover:bg-brand-border/80 cursor-pointer">Importar Backup<input id="import-backup-input" type="file" className="hidden" accept=".json" onChange={(e) => { handleImportAllData(e); setDataMenuOpen(false); }}/></label>
                                                {importError && <p className="text-xs text-red-600 mt-1">{importError}</p>}
                                                {importSuccess && <p className="text-xs text-green-600 mt-1">{importSuccess}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {pendingTasksForSeller.length > 0 && (
                <Card className="bg-amber-900/30 border border-amber-700 shadow-lg">
                    <div className="flex items-center"><div className="flex-shrink-0"><BellIcon /></div><div className="ml-4 flex-grow"><h4 className="text-lg font-semibold text-amber-200">¡Atención! Tareas Pendientes</h4><p className="text-amber-300">Tienes <span className="font-bold">{pendingTasksForSeller.length}</span> {pendingTasksForSeller.length === 1 ? 'tarea pendiente' : 'tareas pendientes'} que requieren tu acción.</p></div><button onClick={() => setCurrentView('tasks')} className="ml-4 px-4 py-2 text-sm font-semibold text-amber-900 bg-brand-accent rounded-md hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors">Ver Tareas</button></div>
                </Card>
            )}

            <div data-tutorial="kpi-cards" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard title="Tasa de Conversión" value={`${conversionData.rate}%`} subtext={`(${conversionData.won} de ${conversionData.total} prospectos)`} icon={<TrendingUpIcon />} goal={currentGoal} goalMet={goalMet} timePeriod={timePeriod} setTimePeriod={setTimePeriod} />
                <KpiCard title="Prospectos Ganados" value={conversionData.won} subtext={timePeriod === 'monthly' ? 'nuevos socios este mes' : 'nuevos socios hoy'} icon={<CheckBadgeIcon />} goal={null} timePeriod={timePeriod} setTimePeriod={setTimePeriod} />
            </div>

            <div data-tutorial="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Embudo de Ventas"><ResponsiveContainer width="100%" height={350}><FunnelChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }} onMouseEnter={handleFunnelChartEnter} onMouseLeave={handleFunnelChartLeave}><Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} /><Funnel dataKey="value" data={salesFunnelData} isAnimationActive={false} {...{ activeIndex: funnelActiveIndex }} shape={renderActiveFunnelShape}><LabelList position="center" fill="#fff" stroke="none" dataKey="value" style={{ fontWeight: 'bold' }} /></Funnel><Legend content={renderCustomLegend} onMouseEnter={handleLegendEnter} onMouseLeave={handleLegendLeave} /></FunnelChart></ResponsiveContainer></Card>
                <Card title="Origen de Prospectos"><ResponsiveContainer width="100%" height={350}><PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}><Pie data={leadsBySourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} fill="#8884d8" labelLine={false} isAnimationActive={true} {...{ activeIndex: pieActiveIndex }} activeShape={renderActivePieShape} onMouseEnter={onPieMouseEnter} onMouseLeave={onPieMouseLeave}>{leadsBySourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></Card>
            </div>
            
            <div data-tutorial="performance-tables" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {canManage || user?.role === Role.Seller ? (
                    <Card title={performanceTableTitle} className="lg:col-span-2">
                        <div className="overflow-x-auto">
                            <table className="min-w-full"><thead className="border-b border-brand-border"><tr><th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Ranking</th><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Vendedor</th><th scope="col" className="px-6 py-3 text-center text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Prospectos</th><th scope="col" className="px-6 py-3 text-center text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Conversiones</th><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider min-w-[200px]">Objetivo / Progreso</th></tr></thead>
                                <tbody className="divide-y divide-brand-border">
                                    {sellerPerformanceData.map((seller, index) => {
                                        const rank = index + 1;
                                        let rankClasses = 'bg-brand-primary text-white';
                                        if (rank === 1) rankClasses = 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black';
                                        if (rank === 2) rankClasses = 'bg-gradient-to-br from-gray-300 to-gray-500 text-black';
                                        if (rank === 3) rankClasses = 'bg-gradient-to-br from-amber-600 to-orange-700 text-white';
                                        
                                        const isDailyDynamic = timePeriod === 'daily' && seller.dynamicGoal !== undefined;
                                        const displayGoal = isDailyDynamic ? seller.dynamicGoal : seller.goal;
                                        const progressPercent = displayGoal !== undefined && displayGoal > 0 ? Math.min(100, (seller.conversions / displayGoal) * 100) : 0;

                                        return (
                                        <tr key={seller.sellerId} onClick={() => canManage && handleSellerRowClick(seller)} className={`transition-colors ${canManage ? 'hover:bg-white/10 cursor-pointer' : ''} ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/5'}`}>
                                            <td className="px-4 py-4 whitespace-nowrap"><span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-md ${rankClasses}`}>{rank}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{seller.sellerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary text-center font-semibold">{seller.totalProspects}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 text-center font-bold">{seller.conversions}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                {displayGoal !== undefined ? (
                                                    <div>
                                                        <div className="flex justify-between items-center text-xs text-brand-text-muted">
                                                            <div className="flex items-baseline gap-2">
                                                                <span>{seller.conversions} / {displayGoal}</span>
                                                                {isDailyDynamic && seller.adjustment !== 0 && (
                                                                     <span className={`font-mono ${seller.adjustment > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        ({seller.adjustment > 0 ? `-${seller.adjustment}` : `+${Math.abs(seller.adjustment)}`} de ayer)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span>{progressPercent.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="w-full bg-brand-border/50 rounded-full h-2 mt-1">
                                                            <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : null}
                {canManage ? (
                    <Card title={`Rendimiento por Sede (${periodText})`} className="lg:col-span-2">
                        <div className="overflow-x-auto">
                             <table className="min-w-full"><thead className="border-b border-brand-border"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Sede</th><th scope="col" className="px-6 py-3 text-center text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Conversiones</th><th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider min-w-[200px]">Objetivo / Progreso</th></tr></thead>
                                <tbody className="divide-y divide-brand-border">
                                    {branchPerformanceData.map((branch, index) => (
                                        <tr key={branch.branchName} className={`${index % 2 === 0 ? 'bg-transparent' : 'bg-white/5'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{branch.branchName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 text-center font-bold">{branch.conversions}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                 {branch.goal !== undefined ? (
                                                    <div>
                                                        <div className="flex justify-between text-xs text-brand-text-muted">
                                                            <span>{branch.conversions} / {branch.goal}</span>
                                                            <span>{branch.goal > 0 ? ((branch.conversions / branch.goal) * 100).toFixed(0) : 0}%</span>
                                                        </div>
                                                        <div className="w-full bg-brand-border/50 rounded-full h-2 mt-1">
                                                            <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${branch.goal > 0 ? Math.min(100, (branch.conversions / branch.goal) * 100) : 0}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    </Card>
                ) : null}
            </div>

            <SellerDetailModal isOpen={isSellerModalOpen} onClose={() => setSellerModalOpen(false)} data={selectedSellerData}/>
        </div>
    );
};

export default ReportsView;