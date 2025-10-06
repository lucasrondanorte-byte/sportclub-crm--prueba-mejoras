import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { api } from '../../services/api';
import { Prospect, User, Role, ProspectStage, Task, TaskStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import AddProspectModal from '../modals/AddProspectModal';
import { EditProspectModal } from '../modals/EditProspectModal';
import ImportProspectsModal from '../modals/ImportProspectsModal';
import ReassignProspectsModal from '../modals/ReassignProspectsModal';
import { PROSPECT_STAGES, PROSPECT_SOURCES } from '../../constants';
import EmptyState from '../common/EmptyState';

const ImportGoogleSheetModal = lazy(() => import('../modals/ImportGoogleSheetModal'));

// Exclude 'Won' prospects from the view and filter options
const VIEWABLE_PROSPECT_STAGES = PROSPECT_STAGES.filter(s => s !== ProspectStage.Won);

type SortDirection = 'ascending' | 'descending';

const STAGE_COLORS: Record<string, string> = {
    [ProspectStage.New]: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    [ProspectStage.Contacted]: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    [ProspectStage.Trial]: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    [ProspectStage.Won]: 'bg-green-500/20 text-green-300 border border-green-500/30',
    [ProspectStage.Lost]: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const GoogleSheetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM11.5 19H8.5V17.5H11.5V19ZM11.5 16H8.5V14.5H11.5V16ZM11.5 13H8.5V11.5H11.5V13ZM15.5 19H12.5V11.5H15.5V19Z" fill="#34A853"/><path d="M13 9H18.5L13 3.5V9Z" fill="#B0BEC5"/></svg>;
const ReassignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const TaskStatusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const SortIcon = ({ direction }: { direction: SortDirection | null }) => {
    if (!direction) return <span className="opacity-30">↕</span>;
    return direction === 'ascending' ? <span>▲</span> : <span>▼</span>;
};
const WhatsAppListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.834 8.834 0 01-4.195-1.125l-2.665.89c-.337.112-.718-.268-.606-.605l.89-2.665A8.834 8.834 0 012 10C2 6.134 5.582 3 10 3s8 3.134 8 7zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;

// FIX: Added props interface to accept setNotification from Dashboard
interface ProspectsViewProps {
  setNotification: (notification: { message: string; type: 'success' | 'error' } | null) => void;
}

const ProspectsView: React.FC<ProspectsViewProps> = ({ setNotification }) => {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isGoogleSheetModalOpen, setGoogleSheetModalOpen] = useState(false);
    const [isReassignModalOpen, setReassignModalOpen] = useState(false);
    const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
    const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
    const selectedProspectsSet = useMemo(() => new Set(selectedProspects), [selectedProspects]);

    // Filter states
    const [stageFilter, setStageFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [sellerFilter, setSellerFilter] = useState('all');
    const [taskFilter, setTaskFilter] = useState<'all' | 'with' | 'without'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>({ key: 'createdAt', direction: 'descending' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setSelectedProspects([]);
        try {
            const [prospectsData, usersData, tasksData] = await Promise.all([
                api.getProspects(),
                api.getUsers(),
                api.getTasks()
            ]);
            setProspects(prospectsData);
            setUsers(usersData.filter(u => u.role === Role.Seller || u.role === Role.Manager || u.role === Role.Admin));
            setTasks(tasksData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const sellers = useMemo(() => {
        if (user?.role === Role.Admin) {
            return users.filter(u => u.role === Role.Seller);
        }
        if (user) {
            return users.filter(u => u.role === Role.Seller && u.branch === user.branch);
        }
        return [];
    }, [users, user]);

    const prospectIdsWithPendingTasks = useMemo(() => {
        return new Set(tasks.filter(t => t.status === TaskStatus.Pending).map(t => t.relatedTo));
    }, [tasks]);

    const processedProspects = useMemo(() => {
        if (!user) return [];
    
        let prospectsToProcess = prospects.filter(p => p.stage !== ProspectStage.Won);
    
        // Role-based pre-filtering
        if (user.role === Role.Manager || user.role === Role.Viewer) {
            prospectsToProcess = prospectsToProcess.filter(p => p.branch === user.branch);
        } else if (user.role === Role.Seller) {
            prospectsToProcess = prospectsToProcess.filter(p => p.assignedTo === user.id);
        }
    
        // UI-based filtering
        const hasSellerFilter = sellerFilter !== 'all' && (user.role === Role.Admin || user.role === Role.Manager);
        prospectsToProcess = prospectsToProcess.filter(p => {
            const stageMatch = stageFilter === 'all' || p.stage === stageFilter;
            const sourceMatch = sourceFilter === 'all' || p.source === sourceFilter;
            const sellerMatch = !hasSellerFilter || p.assignedTo === sellerFilter;
            
            const hasPendingTask = prospectIdsWithPendingTasks.has(p.id);
            const taskMatch = taskFilter === 'all' || (taskFilter === 'with' && hasPendingTask) || (taskFilter === 'without' && !hasPendingTask);

            return stageMatch && sourceMatch && sellerMatch && taskMatch;
        });

        // Sorting
        if (sortConfig !== null) {
            prospectsToProcess.sort((a, b) => {
                const { key, direction } = sortConfig;
                let aValue: any;
                let bValue: any;

                if (key === 'pendingTask') {
                    aValue = prospectIdsWithPendingTasks.has(a.id);
                    bValue = prospectIdsWithPendingTasks.has(b.id);
                } else if (key === 'assignedTo') {
                    aValue = userMap.get(a.assignedTo)?.toLowerCase() || 'zzzz';
                    bValue = userMap.get(b.assignedTo)?.toLowerCase() || 'zzzz';
                } else {
                    aValue = a[key as keyof Prospect];
                    bValue = b[key as keyof Prospect];
                }

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        return prospectsToProcess;
    }, [prospects, user, stageFilter, sourceFilter, sellerFilter, taskFilter, sortConfig, prospectIdsWithPendingTasks, userMap]);

    const handleSort = (key: string) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleAddSuccess = (newProspect: Prospect) => {
        setProspects(prev => [...prev, newProspect]);
        setAddModalOpen(false);
        setNotification({ message: 'Prospecto agregado con éxito.', type: 'success' });
    };

    const handleEditSuccess = (updatedProspect: Prospect) => {
        setEditModalOpen(false);
        setSelectedProspect(null);
        setNotification({ message: 'Prospecto actualizado con éxito.', type: 'success' });
        // Forzamos la recarga de datos para asegurar que el estado es consistente,
        // especialmente después de convertir un prospecto a socio, evitando que reaparezca.
        fetchData();
    };
    
    const handleRowClick = (prospect: Prospect) => {
        if(user?.role !== Role.Viewer) {
            setSelectedProspect(prospect);
            setEditModalOpen(true);
        }
    };

    const resetFilters = () => {
        setStageFilter('all');
        setSourceFilter('all');
        setSellerFilter('all');
        setTaskFilter('all');
    }
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProspects(processedProspects.map(p => p.id));
        } else {
            setSelectedProspects([]);
        }
    };

    const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        e.stopPropagation();
        if (e.target.checked) {
            setSelectedProspects(prev => [...prev, id]);
        } else {
            setSelectedProspects(prev => prev.filter(prospectId => prospectId !== id));
        }
    };

    const handleReassignSuccess = () => {
        setReassignModalOpen(false);
        setNotification({ message: `${selectedProspects.length} prospecto(s) reasignado(s) con éxito.`, type: 'success' });
        fetchData(); 
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
            <button className="flex items-center gap-2 group" onClick={() => handleSort(sortKey)}>
                {label}
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                    <SortIcon direction={sortConfig?.key === sortKey ? sortConfig.direction : null} />
                </span>
            </button>
        </th>
    );


    if (loading) return <Card><div className="h-96 flex items-center justify-center">Cargando prospectos...</div></Card>;
    
    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-brand-text-primary">Prospectos</h1>
                <div className="flex flex-wrap items-center justify-end gap-2" data-tutorial="prospects-actions">
                     {selectedProspects.length > 0 && canManage && (
                         <button onClick={() => setReassignModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-black bg-brand-accent rounded-lg hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-accent"><ReassignIcon />Reasignar ({selectedProspects.length})</button>
                    )}
                    {canManage && (
                        <>
                            <button onClick={() => setGoogleSheetModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-black bg-brand-accent rounded-lg hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-accent"><GoogleSheetIcon />Google Sheet</button>
                            <button onClick={() => setImportModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-gray-500"><ImportIcon />Importar Bajas</button>
                        </>
                    )}
                    {(canManage || user?.role === Role.Seller) && (
                        <button onClick={() => setAddModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-primary shadow-lg shadow-brand-primary/30"><AddIcon />Agregar Prospecto</button>
                    )}
                </div>
            </div>
            
            <Card>
                 <div data-tutorial="prospects-filters" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label htmlFor="stageFilter" className="block text-sm font-medium text-brand-text-secondary">Etapa</label>
                        <select id="stageFilter" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="form-input">
                            <option value="all">Todas</option>
                            {VIEWABLE_PROSPECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sourceFilter" className="block text-sm font-medium text-brand-text-secondary">Origen</label>
                        <select id="sourceFilter" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="form-input">
                            <option value="all">Todos</option>
                            {PROSPECT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="taskFilter" className="block text-sm font-medium text-brand-text-secondary">Tareas</label>
                        <select id="taskFilter" value={taskFilter} onChange={(e) => setTaskFilter(e.target.value as any)} className="form-input">
                            <option value="all">Todos</option>
                            <option value="with">Con tarea pendiente</option>
                            <option value="without">Sin tarea pendiente</option>
                        </select>
                    </div>
                    {canManage && (
                        <div>
                            <label htmlFor="sellerFilter" className="block text-sm font-medium text-brand-text-secondary">Vendedor</label>
                            <select id="sellerFilter" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="form-input">
                                <option value="all">Todos</option>
                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className={!canManage ? "lg:col-start-5" : ""}>
                        <button onClick={resetFilters} className="w-full justify-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg shadow-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-primary">
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </Card>

            <Card>
                <div data-tutorial="prospects-table" className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-brand-border">
                            <tr>
                                {canManage && (
                                    <th scope="col" className="px-4 py-4">
                                        <input type="checkbox" className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary" checked={!loading && processedProspects.length > 0 && selectedProspects.length === processedProspects.length} onChange={handleSelectAll}/>
                                    </th>
                                )}
                                <SortableHeader label="Nombre" sortKey="name" />
                                <SortableHeader label="Etapa" sortKey="stage" />
                                {user?.role === Role.Seller ? (
                                    <SortableHeader label="Tarea Pendiente" sortKey="pendingTask" />
                                ) : user?.role === Role.Admin && (
                                    <SortableHeader label="Sucursal" sortKey="branch" />
                                )}
                                <SortableHeader label="Interés" sortKey="interest" />
                                <SortableHeader label="Próxima Acción" sortKey="nextActionDate" />
                                {canManage && <SortableHeader label="Asignado a" sortKey="assignedTo" />}
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedProspects.map((prospect, index) => (
                                <tr key={prospect.id} onClick={() => handleRowClick(prospect)} className={`border-b border-brand-border transition-colors duration-200 ${user?.role !== Role.Viewer ? 'cursor-pointer' : ''} ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/5'} hover:bg-brand-primary/10`}>
                                     {canManage && (
                                        <td className="px-4 py-4">
                                            <input type="checkbox" className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary" checked={selectedProspects.includes(prospect.id)} onChange={(e) => handleSelectOne(e, prospect.id)} onClick={(e) => e.stopPropagation()}/>
                                        </td>
                                     )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-brand-text-primary">{prospect.name}</div>
                                        <div className="text-xs text-brand-text-muted">{prospect.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STAGE_COLORS[prospect.stage] || 'bg-gray-700 text-gray-200'}`}>{prospect.stage}</span>
                                    </td>
                                    {user?.role === Role.Seller ? (
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {prospectIdsWithPendingTasks.has(prospect.id) ? <TaskStatusIcon /> : <span className="text-gray-500">-</span>}
                                        </td>
                                    ) : user?.role === Role.Admin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{prospect.branch}</td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{prospect.interest}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                        {prospect.nextActionDate ? new Date(prospect.nextActionDate).toLocaleDateString('es-AR') : 'N/A'}
                                    </td>
                                    {canManage && (
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{userMap.get(prospect.assignedTo) || 'N/A'}</td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {prospect.phone && (
                                            <a
                                                href={`https://wa.me/${prospect.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center justify-center w-8 h-8 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 transition-all duration-200 hover:bg-green-500/20 hover:text-white hover:scale-110 hover:border-green-500/50"
                                                aria-label="Contactar por WhatsApp"
                                                title="Contactar por WhatsApp"
                                            >
                                                <WhatsAppListIcon />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {processedProspects.length === 0 && (
                    <EmptyState 
                        title="No se encontraron prospectos"
                        message="Intenta ajustar los filtros o agrega un nuevo prospecto."
                    />
                )}
            </Card>

            <AddProspectModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={handleAddSuccess} sellers={sellers}/>
            <EditProspectModal isOpen={isEditModalOpen} onClose={() => { setEditModalOpen(false); setSelectedProspect(null); }} onSuccess={handleEditSuccess} users={users} prospect={selectedProspect}/>
            <Suspense fallback={<div></div>}>
                <ImportGoogleSheetModal isOpen={isGoogleSheetModalOpen} onClose={() => setGoogleSheetModalOpen(false)} onSuccess={() => { setGoogleSheetModalOpen(false); fetchData(); setNotification({ message: 'Importación desde Google Sheet completada.', type: 'success' }); }} sellers={sellers}/>
            </Suspense>
            <ImportProspectsModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={() => { setImportModalOpen(false); fetchData(); setNotification({ message: 'Importación de bajas completada.', type: 'success' }); }} sellers={sellers} />
            <ReassignProspectsModal isOpen={isReassignModalOpen} onClose={() => setReassignModalOpen(false)} onSuccess={handleReassignSuccess} sellers={sellers} prospectsToReassign={prospects.filter(p => selectedProspectsSet.has(p.id))}/>
        </div>
    );
};

export default ProspectsView;