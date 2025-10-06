import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import { Task, User, Role, Prospect, Member, TaskStatus, TaskType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import CreateTaskModal from '../modals/CreateTaskModal';
import SetGoalsModal from '../modals/SetGoalsModal';
import { TASK_STATUSES, TASK_TYPES } from '../../constants';
import EmptyState from '../common/EmptyState';
import { formatDateTime } from '../../utils/dateFormatter';
import SellerGoalsCard from '../common/SellerGoalsCard';

type SortDirection = 'ascending' | 'descending';

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
    [TaskStatus.Pending]: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    [TaskStatus.Done]: 'bg-green-500/20 text-green-300 border border-green-500/30',
};

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const GoalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const SortIcon = ({ direction }: { direction: SortDirection | null }) => {
    if (!direction) return <span className="opacity-30">↕</span>;
    return direction === 'ascending' ? <span>▲</span> : <span>▼</span>;
};
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const CallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.834 8.834 0 01-4.195-1.125l-2.665.89c-.337.112-.718-.268-.606-.605l.89-2.665A8.834 8.834 0 012 10C2 6.134 5.582 3 10 3s8 3.134 8 7zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const VisitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;

const activityIcons: { [key in TaskType]: React.ReactElement } = {
    [TaskType.Note]: <NoteIcon />,
    [TaskType.Call]: <CallIcon />,
    [TaskType.Email]: <EmailIcon />,
    [TaskType.WhatsApp]: <WhatsAppIcon />,
    [TaskType.Visit]: <VisitIcon />,
};

// FIX: Added props interface to accept setNotification from Dashboard
interface TasksViewProps {
    setNotification: (notification: { message: string; type: 'success' | 'error' } | null) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ setNotification }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isGoalsModalOpen, setGoalsModalOpen] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sellerFilter, setSellerFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'next24h' | 'thisWeek' | 'overdue'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>({ key: 'dateTime', direction: 'ascending' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tasksData, usersData, prospectsData, membersData] = await Promise.all([
                api.getTasks(),
                api.getUsers(),
                api.getProspects(),
                api.getMembers(),
            ]);
            setTasks(tasksData);
            setUsers(usersData);
            setProspects(prospectsData);
            setMembers(membersData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const relatedToMap = useMemo(() => {
        const map = new Map<string, {name: string, branch: string}>();
        prospects.forEach(p => map.set(p.id, {name: p.name, branch: p.branch}));
        members.forEach(m => map.set(m.id, {name: m.name, branch: m.branch}));
        return map;
    }, [prospects, members]);
    
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    
    // This list includes sellers and managers, for filtering purposes in the view.
    const assignableUsersForFilter = useMemo(() => {
        if (!user) return [];
        if (user.role === Role.Admin) {
            return users.filter(u => u.role === Role.Seller || u.role === Role.Manager);
        }
        return users.filter(u => (u.role === Role.Seller || u.role === Role.Manager) && u.branch === user.branch);
    }, [users, user]);
    
    // This list is ONLY for sellers, to be used in the task creation modal for assignment.
    const assignableSellers = useMemo(() => {
        if (!user) return [];
        if (user.role === Role.Admin) {
            // Admins can assign to any seller.
            return users.filter(u => u.role === Role.Seller);
        }
        // Managers can assign to sellers within their branch.
        return users.filter(u => u.role === Role.Seller && u.branch === user.branch);
    }, [users, user]);


    const filteredTasks = useMemo(() => {
        if (!user) return [];
        let tasksToFilter = tasks;

        // --- PRE-FILTERING (permissions) ---
        if (user.role !== Role.Admin) {
            tasksToFilter = tasksToFilter.filter(t => {
                const relatedEntity = relatedToMap.get(t.relatedTo);
                return relatedEntity?.branch === user.branch;
            });
        }
        if (user.role === Role.Seller) {
            tasksToFilter = tasksToFilter.filter(t => t.assignedTo === user.id);
        }

        // --- UI FILTERING ---
        tasksToFilter = tasksToFilter.filter(t => {
            const statusMatch = statusFilter === 'all' || t.status === statusFilter;
            const sellerMatch = sellerFilter === 'all' || t.assignedTo === sellerFilter;
            const typeMatch = typeFilter === 'all' || t.type === typeFilter;

            const now = new Date();
            const taskDate = new Date(t.dateTime);
            let dateMatch = true;
            if (dateFilter !== 'all') {
                switch (dateFilter) {
                    case 'next24h':
                        const tomorrow = new Date();
                        tomorrow.setDate(now.getDate() + 1);
                        dateMatch = taskDate >= now && taskDate <= tomorrow;
                        break;
                    case 'thisWeek':
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay());
                        startOfWeek.setHours(0, 0, 0, 0);
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        endOfWeek.setHours(23, 59, 59, 999);
                        dateMatch = taskDate >= startOfWeek && taskDate <= endOfWeek;
                        break;
                    case 'overdue':
                        dateMatch = taskDate < now && t.status === TaskStatus.Pending;
                        break;
                }
            }
            
            return statusMatch && sellerMatch && typeMatch && dateMatch;
        });
        
        // --- SORTING ---
        if (sortConfig !== null) {
            tasksToFilter.sort((a, b) => {
                const { key, direction } = sortConfig;
                const aValue = a[key as keyof Task];
                const bValue = b[key as keyof Task];
                if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return tasksToFilter;

    }, [tasks, user, statusFilter, sellerFilter, dateFilter, typeFilter, relatedToMap, sortConfig]);

    const handleCreateSuccess = () => {
        setCreateModalOpen(false);
        setNotification({ message: 'Tarea(s) creada(s) con éxito.', type: 'success' });
        fetchData();
    };

    const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
        try {
            const updatedTask = await api.updateTask({ ...task, status: newStatus });
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            setNotification({ message: `Tarea marcada como ${newStatus === TaskStatus.Done ? 'completada' : 'pendiente'}.`, type: 'success' });
        } catch (error) {
            console.error("Failed to update task status", error);
            setNotification({ message: 'Error al actualizar la tarea.', type: 'error' });
        }
    };

    const handleSort = (key: string) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const resetFilters = () => {
        setStatusFilter('all');
        setSellerFilter('all');
        setDateFilter('all');
        setTypeFilter('all');
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
            <button className="flex items-center gap-2 group" onClick={() => handleSort(sortKey)}>
                {label}
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                    <SortIcon direction={sortConfig?.key === sortKey ? sortConfig.direction : null} />
                </span>
            </button>
        </th>
    );

    if (loading) return <Card>Cargando tareas...</Card>;

    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-2">
                <h1 className="text-3xl font-bold text-brand-text-primary">Gestión de Tareas</h1>
                <div className="flex items-center gap-2" data-tutorial="tasks-actions">
                    {canManage && (
                         <button
                            onClick={() => setGoalsModalOpen(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg hover:bg-white/10"
                        >
                            <GoalIcon />
                            Establecer Objetivos
                        </button>
                    )}
                    {(canManage || user?.role === Role.Seller) && (
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/30"
                        >
                            <AddIcon />
                            Crear Tarea
                        </button>
                    )}
                </div>
            </div>

            {user?.role === Role.Seller && !loading && (
                <div data-tutorial="seller-goals">
                    <SellerGoalsCard user={user} prospects={prospects} />
                </div>
            )}
            
            <Card>
                 <div data-tutorial="tasks-filters" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-brand-text-secondary">Estado</label>
                        <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input capitalize">
                            <option value="all">Todos</option>
                            {TASK_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateFilter" className="block text-sm font-medium text-brand-text-secondary">Vencimiento</label>
                        <select id="dateFilter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="form-input">
                            <option value="all">Cualquier fecha</option>
                            <option value="next24h">Próximas 24h</option>
                            <option value="thisWeek">Esta semana</option>
                            <option value="overdue">Vencidas</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="typeFilter" className="block text-sm font-medium text-brand-text-secondary">Tipo</label>
                        <select id="typeFilter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input capitalize">
                            <option value="all">Todos</option>
                            {TASK_TYPES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                        </select>
                    </div>
                    {canManage && (
                        <div>
                            <label htmlFor="sellerFilter" className="block text-sm font-medium text-brand-text-secondary">Asignado a</label>
                            <select id="sellerFilter" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="form-input">
                                <option value="all">Todos</option>
                                {assignableUsersForFilter.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                     <div className={!canManage ? "lg:col-start-5" : ""}>
                        <button onClick={resetFilters} className="w-full justify-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg shadow-sm hover:bg-white/10">
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </Card>

            <Card>
                <div data-tutorial="tasks-table" className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-brand-border">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Tipo</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Título / Relacionado con</th>
                                {canManage && <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Asignado a</th>}
                                <SortableHeader label="Vence" sortKey="dateTime" />
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Estado</th>
                                <th scope="col" className="relative px-4 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task, index) => (
                                <tr key={task.id} className={`border-b border-brand-border transition-colors duration-200 ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/5'} ${task.status === 'hecha' ? 'opacity-60' : ''}`}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${task.status === TaskStatus.Done ? 'bg-green-500/10 text-green-300' : 'bg-amber-500/10 text-amber-300'}`}>
                                            <span className="opacity-80 scale-110">{activityIcons[task.type]}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <p className={`font-semibold truncate ${task.status === 'hecha' ? 'line-through text-brand-text-muted' : 'text-brand-text-primary'}`}>{task.title}</p>
                                        <p className="text-xs text-brand-text-muted">Para: <strong>{relatedToMap.get(task.relatedTo)?.name || 'N/A'}</strong></p>
                                    </td>
                                    {canManage && (
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-text-secondary">{userMap.get(task.assignedTo) || 'N/A'}</td>
                                    )}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-text-secondary">{formatDateTime(task.dateTime)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                         <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${TASK_STATUS_COLORS[task.status]}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                         {task.status === TaskStatus.Pending && (
                                            <button onClick={() => handleStatusChange(task, TaskStatus.Done)} className="px-3 py-1.5 text-xs font-semibold text-green-900 bg-green-400 rounded-md hover:bg-green-500 transition-colors">
                                                Completar
                                            </button>
                                        )}
                                        {task.status === TaskStatus.Done && (
                                            <button onClick={() => handleStatusChange(task, TaskStatus.Pending)} className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-400 rounded-md hover:bg-amber-500 transition-colors">
                                                Reabrir
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredTasks.length === 0 && (
                     <EmptyState 
                        title="No se encontraron tareas"
                        message="Intenta ajustar los filtros o crea una nueva tarea."
                    />
                )}
            </Card>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                sellers={assignableSellers}
                prospects={prospects}
                members={members}
            />
            
            <SetGoalsModal
                isOpen={isGoalsModalOpen}
                onClose={() => setGoalsModalOpen(false)}
                sellers={assignableSellers}
                prospects={prospects}
            />
        </div>
    );
};

export default TasksView;