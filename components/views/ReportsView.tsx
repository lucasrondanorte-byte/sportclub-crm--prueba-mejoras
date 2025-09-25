import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector, Trapezoid, SectorProps, TooltipProps } from 'recharts';
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


const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const DotsVerticalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);


const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
);

// Brand colors from the discipline guide
export const BRAND_CHART_COLORS = ['#c1292c', '#198ccd', '#f2d031', '#4fbc22', '#99c9be', '#3e3939', '#ef8333'];

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


    useEffect(() => {
        setLoading(true);
        const savedMonthlyGoal = localStorage.getItem('sportclub-crm-monthly-conversion-goal');
        if (savedMonthlyGoal && savedMonthlyGoal !== '') {
            setMonthlyConversionGoal(parseFloat(savedMonthlyGoal));
        } else {
            setMonthlyConversionGoal(null);
        }
        const savedDailyGoal = localStorage.getItem('sportclub-crm-daily-conversion-goal');
        if (savedDailyGoal && savedDailyGoal !== '') {
            setDailyConversionGoal(parseFloat(savedDailyGoal));
        } else {
            setDailyConversionGoal(null);
        }
        
        Promise.all([api.getProspects(), api.getUsers(), api.getTasks()])
            .then(([prospectsData, usersData, tasksData]) => {
                setProspects(prospectsData);
                setUsers(usersData);
                setTasks(tasksData);
            })
            .catch(error => console.error("Failed to fetch report data", error))
            .finally(() => setLoading(false));
    }, []);

    const sellers = useMemo(() => users.filter(u => u.role === Role.Seller), [users]);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const overdueTasks = useMemo(() => {
        if (!user || user.role !== Role.Seller) {
            return [];
        }
        const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
        const now = new Date().getTime();
        return tasks.filter(task =>
            task.assignedTo === user.id &&
            task.status === TaskStatus.Pending &&
            (now - new Date(task.dateTime).getTime()) > fortyEightHoursInMs
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
        const stageCounts = filteredProspects.reduce((acc, p) => {
            acc[p.stage] = (acc[p.stage] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return [
            { name: ProspectStage.New, value: stageCounts[ProspectStage.New] || 0, fill: BRAND_CHART_COLORS[2] },
            { name: ProspectStage.Contacted, value: stageCounts[ProspectStage.Contacted] || 0, fill: BRAND_CHART_COLORS[1] },
            { name: ProspectStage.Trial, value: stageCounts[ProspectStage.Trial] || 0, fill: BRAND_CHART_COLORS[6] },
            { name: ProspectStage.Won, value: stageCounts[ProspectStage.Won] || 0, fill: BRAND_CHART_COLORS[3] },
        ].sort((a,b)=> b.value - a.value);
    }, [filteredProspects]);

    const sellerPerformanceData = useMemo(() => {
        if (!user) return [];
        const stats: Record<string, { conversions: number; total: number }> = sellers.reduce((acc, seller) => {
            acc[seller.id] = { conversions: 0, total: 0 };
            return acc;
        }, {} as Record<string, { conversions: number; total: number }>);

        // Use the full 'prospects' list for a historical view, ignoring filters.
        prospects.forEach(prospect => {
            if (stats[prospect.assignedTo]) {
                stats[prospect.assignedTo].total++;
                if (prospect.stage === ProspectStage.Won) {
                    stats[prospect.assignedTo].conversions++;
                }
            }
        });

        const sellersToDisplay = sellers.filter(seller => {
            const hasStats = stats[seller.id] && stats[seller.id].total > 0;
            if (!hasStats) return false;

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
            return {
                sellerId: seller.id,
                sellerName: seller.name,
                conversions: sellerStats.conversions,
                totalProspects: sellerStats.total,
                conversionRate: parseFloat(conversionRate.toFixed(1)),
            };
        }).sort((a, b) => b.conversions - a.conversions);
    }, [prospects, sellers, user, branchFilter]);

    const leadsBySourceData = useMemo(() => {
        const sources = filteredProspects.reduce((acc, p) => {
            acc[p.source] = (acc[p.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(sources).map(([name, value]) => ({ name, value }));
    }, [filteredProspects]);
    
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

        // Optional: style headers
        // This is more complex and usually requires a library like xlsx-style
        // For simplicity, we'll keep it unstyled but functional.

        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `reporte_prospectos_${date}.xlsx`);
    };

    const handleExportAllData = () => {
        try {
            const backupData: { [key: string]: any } = {};
            const keysToBackup = [
                'sportclub-crm-users',
                'sportclub-crm-prospects',
                'sportclub-crm-members',
                'sportclub-crm-tasks',
                'sportclub-crm-interactions'
            ];
            
            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    backupData[key] = JSON.parse(item);
                }
            });
            
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            link.href = url;
            link.download = `sportclub-crm-backup-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Ocurrió un error al exportar los datos.");
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
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File content is not readable.");
                }
                const data = JSON.parse(text);

                const requiredKeys = [
                    'sportclub-crm-users',
                    'sportclub-crm-prospects',
                    'sportclub-crm-members',
                    'sportclub-crm-tasks',
                    'sportclub-crm-interactions'
                ];

                const hasRequiredKeys = requiredKeys.every(key => key in data);
                if (!hasRequiredKeys) {
                    throw new Error("El archivo de backup no tiene el formato correcto. Faltan claves esenciales.");
                }

                if (!window.confirm("¿Estás seguro? Esta acción sobreescribirá todos los datos actuales con el contenido del archivo de backup. Esta acción no se puede deshacer.")) {
                    return;
                }

                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                });

                setImportSuccess("Datos restaurados con éxito. La aplicación se recargará.");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (err: any) {
                console.error("Error importing data:", err);
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

        return (
            <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`}>
                <Trapezoid {...props} />
            </g>
        );
    };

    const onPieMouseEnter = useCallback((_: any, index: number) => {
        setPieActiveIndex(index);
    }, []);

    const onPieMouseLeave = useCallback(() => {
        setPieActiveIndex(-1);
    }, []);

    const handleFunnelChartEnter = useCallback((e: any) => {
        if (e.activeTooltipIndex > -1) {
            setFunnelActiveIndex(e.activeTooltipIndex);
        }
    }, []);
    
    const handleFunnelChartLeave = useCallback(() => {
        setFunnelActiveIndex(-1);
    }, []);

    const handleLegendEnter = useCallback((o: any) => {
        const { value } = o;
        const index = salesFunnelData.findIndex((entry) => entry.name === value);
        setFunnelActiveIndex(index);
    }, [salesFunnelData]);

    const handleLegendLeave = useCallback(() => {
        setFunnelActiveIndex(-1);
    }, []);
    
    const handleSellerRowClick = (sellerPerformance: (typeof sellerPerformanceData)[0]) => {
        const sellerProspects = prospects.filter(p => p.assignedTo === sellerPerformance.sellerId);

        const funnelData = [
            ProspectStage.New, ProspectStage.Contacted, ProspectStage.Trial, ProspectStage.Won, ProspectStage.Lost
        ].map((stage, index) => ({
            name: stage,
            value: sellerProspects.filter(p => p.stage === stage).length,
            fill: BRAND_CHART_COLORS[index % BRAND_CHART_COLORS.length]
        })).filter(item => item.value > 0);

        const sourceData = Object.entries(
            sellerProspects.reduce((acc, p) => {
                acc[p.source] = (acc[p.source] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }));

        const prospectsInTrial = sellerProspects.filter(p => p.stage === ProspectStage.Trial).length;

        setSelectedSellerData({
            ...sellerPerformance,
            prospectsInTrial,
            funnelData,
            sourceData,
        });
        setSellerModalOpen(true);
    };


    const renderCustomLegend = (props: any) => {
        const { payload, onMouseEnter, onMouseLeave } = props;
        return (
            <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-brand-text-secondary">
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} 
                     className="flex items-center cursor-pointer"
                     onMouseEnter={() => onMouseEnter(entry, index)}
                     onMouseLeave={() => onMouseLeave(entry, index)}>
                    <span className="w-3 h-3 mr-2 rounded-sm" style={{ backgroundColor: entry.color, display: 'inline-block' }}></span>
                    <span>{entry.value}</span>
                </div>
            ))}
            </div>
        );
    };

    const TimePeriodFilter = ({ period, setPeriod }: { period: 'monthly' | 'daily', setPeriod: (p: 'monthly' | 'daily') => void }) => (
        <div className="absolute top-4 right-4 bg-gray-950 p-1 rounded-lg text-sm">
            <button
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1 rounded-md ${period === 'monthly' ? 'bg-brand-surface shadow text-brand-primary font-semibold' : 'text-brand-text-secondary'}`}
            >
                Mes
            </button>
            <button
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1 rounded-md ${period === 'daily' ? 'bg-brand-surface shadow text-brand-primary font-semibold' : 'text-brand-text-secondary'}`}
            >
                Hoy
            </button>
        </div>
    );

    const PIE_COLORS = BRAND_CHART_COLORS;
    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;
    const performanceTableTitle = user?.role === Role.Seller ? "Mi Rendimiento" : `Rendimiento de Vendedores ${branchFilter !== 'all' ? `(${branchFilter})` : user?.role === Role.Manager ? `(${user.branch})` : ''}`;

    if (loading) return <Card>Cargando reportes...</Card>;
    if (user?.role === Role.Viewer && prospects.length === 0) return <Card>No hay datos para mostrar.</Card>;
    
    const conversionData = timePeriod === 'monthly' ? monthlyConversionRateData : dailyConversionRateData;
    const currentGoal = timePeriod === 'monthly' ? monthlyConversionGoal : dailyConversionGoal;
    const currentRate = parseFloat(conversionData.rate);
    const goalMet = currentGoal !== null && currentRate >= currentGoal;
    const rateColorClass = currentGoal !== null ? (goalMet ? 'text-green-400' : 'text-amber-400') : 'text-green-400';

    return (
        <div>
             <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-brand-text-primary">Reportes y Estadísticas</h1>
                
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
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-black bg-brand-accent rounded-md hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                        >
                            <DownloadIcon />
                            Exportar a Excel
                        </button>
                        {user?.role === Role.Admin && (
                            <div ref={dataMenuRef} className="relative">
                                <button
                                    onClick={() => setDataMenuOpen(prev => !prev)}
                                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                >
                                    <DotsVerticalIcon />
                                    <span className="ml-2">Administrar Datos</span>
                                </button>
                                {isDataMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 origin-top-right bg-brand-surface border border-brand-border rounded-md shadow-lg z-10">
                                        <div className="p-4 space-y-3">
                                            <h4 className="font-semibold text-brand-text-primary">Copias de Seguridad</h4>
                                            <p className="text-xs text-brand-text-muted">Realiza copias de seguridad o restaura todos los datos desde un archivo JSON.</p>
                                            <button
                                                onClick={() => { handleExportAllData(); setDataMenuOpen(false); }}
                                                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary-hover"
                                            >
                                                Exportar Backup
                                            </button>
                                            <label
                                                htmlFor="import-backup-input"
                                                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border rounded-md shadow-sm hover:bg-gray-600 cursor-pointer"
                                            >
                                                Importar Backup
                                                <input
                                                    id="import-backup-input"
                                                    type="file"
                                                    className="hidden"
                                                    accept=".json"
                                                    onChange={(e) => { handleImportAllData(e); setDataMenuOpen(false); }}
                                                />
                                            </label>
                                            {importError && <p className="text-xs text-red-600 mt-1">{importError}</p>}
                                            {importSuccess && <p className="text-xs text-green-600 mt-1">{importSuccess}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {overdueTasks.length > 0 && (
                <Card className="mb-6 bg-amber-900/30 border border-amber-700 shadow-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                           <BellIcon />
                        </div>
                        <div className="ml-4 flex-grow">
                            <h4 className="text-lg font-semibold text-amber-200">¡Atención! Tareas Atrasadas</h4>
                            <p className="text-amber-300">
                                Tienes <span className="font-bold">{overdueTasks.length}</span> {overdueTasks.length === 1 ? 'tarea atrasada' : 'tareas atrasadas'} que requieren tu acción inmediata.
                            </p>
                        </div>
                        <button 
                            onClick={() => setCurrentView('tasks')}
                            className="ml-4 px-4 py-2 text-sm font-semibold text-amber-900 bg-brand-accent rounded-md hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors"
                        >
                            Ver Tareas
                        </button>
                    </div>
                </Card>
            )}

            <h2 className="text-2xl font-bold text-brand-text-primary mb-4">
                {user?.role === Role.Admin ? `Estadísticas Generales ${branchFilter !== 'all' ? `(${branchFilter})` : '(Todas las sucursales)'}` : `Estadísticas de Sucursal (${user?.branch})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <Card className="relative">
                    <TimePeriodFilter period={timePeriod} setPeriod={setTimePeriod} />
                    <h3 className="text-xl font-semibold text-brand-text-primary mb-2">Tasa de Conversión</h3>
                    <div className="text-center py-4">
                        <p className={`text-6xl font-bold ${rateColorClass}`}>{conversionData.rate}%</p>
                         <div className="h-6 mt-1">
                           {currentGoal !== null && (
                                <p className="text-sm text-brand-text-muted">
                                    Objetivo: {currentGoal}%
                                </p>
                            )}
                        </div>
                        <p className="text-brand-text-muted mt-1">({conversionData.won} de {conversionData.total} prospectos)</p>
                    </div>
                </Card>
                 <Card className="relative">
                     <TimePeriodFilter period={timePeriod} setPeriod={setTimePeriod} />
                     <h3 className="text-xl font-semibold text-brand-text-primary mb-2">Prospectos Ganados</h3>
                     <div className="text-center py-4">
                        <p className="text-6xl font-bold text-brand-text-primary">{conversionData.won}</p>
                        <p className="text-brand-text-muted mt-2">
                           {timePeriod === 'monthly' ? 'nuevos socios este mes' : 'nuevos socios hoy'}
                        </p>
                    </div>
                 </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Embudo de Ventas">
                    <ResponsiveContainer width="100%" height={350}>
                        <FunnelChart 
                            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                            onMouseEnter={handleFunnelChartEnter}
                            onMouseLeave={handleFunnelChartLeave}
                        >
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                            <Funnel
                                dataKey="value"
                                data={salesFunnelData}
                                isAnimationActive={false}
// FIX: The type definitions for recharts Funnel seem to be incorrect, missing the `activeIndex` prop.
// Using object spread to bypass the type error.
                                {...{ activeIndex: funnelActiveIndex }}
                                shape={renderActiveFunnelShape}
                            >
                                <LabelList position="center" fill="#fff" stroke="none" dataKey="value" style={{ fontWeight: 'bold' }} />
                            </Funnel>
                             <Legend 
                                content={renderCustomLegend}
                                onMouseEnter={handleLegendEnter}
                                onMouseLeave={handleLegendLeave}
                             />
                        </FunnelChart>
                    </ResponsiveContainer>
                </Card>

                <Card title="Origen de Prospectos">
                     <ResponsiveContainer width="100%" height={350}>
                        <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                            <Pie 
                                data={leadsBySourceData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={100} 
                                innerRadius={60}
                                fill="#8884d8" 
                                labelLine={false}
                                isAnimationActive={true}
// FIX: The type definitions for recharts Pie seem to be incorrect, missing the `activeIndex` prop.
// Using object spread to bypass the type error.
                                {...{ activeIndex: pieActiveIndex }}
                                activeShape={renderActivePieShape}
                                onMouseEnter={onPieMouseEnter}
                                onMouseLeave={onPieMouseLeave}
                             >
                                {leadsBySourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                {canManage || user?.role === Role.Seller ? (
                    <Card title={performanceTableTitle} className="lg:col-span-2">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-brand-border">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Ranking</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Vendedor</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">Prospectos Asignados</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">Conversiones</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider min-w-[200px]">Tasa de Conversión</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-brand-surface divide-y divide-brand-border">
                                    {sellerPerformanceData.map((seller, index) => (
                                        <tr
                                            key={seller.sellerId}
                                            onClick={() => canManage && handleSellerRowClick(seller)}
                                            className={canManage ? 'hover:bg-white/10 cursor-pointer transition-colors' : ''}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-brand-primary'}`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{seller.sellerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary text-center font-semibold">{seller.totalProspects}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 text-center font-bold">{seller.conversions}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold w-12">{seller.conversionRate}%</span>
                                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                        <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${Math.min(100, seller.conversionRate)}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : null}
            </div>

            <SellerDetailModal
                isOpen={isSellerModalOpen}
                onClose={() => setSellerModalOpen(false)}
                data={selectedSellerData}
            />
        </div>
    );
};

export default ReportsView;