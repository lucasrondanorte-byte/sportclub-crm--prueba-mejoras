import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import { Task, User, Role, Prospect, Member, TaskStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import CreateTaskModal from '../modals/CreateTaskModal';
import SetGoalsModal from '../modals/SetGoalsModal';
import { TASK_STATUSES } from '../../constants';

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
    [TaskStatus.Pending]: 'bg-amber-900/60 text-amber-200',
    [TaskStatus.Done]: 'bg-green-900/60 text-green-200',
};

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const GoalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
    </svg>
);

const TasksView: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isGoalsModalOpen, setGoalsModalOpen] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [sellerFilter, setSellerFilter] = useState('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tasksData, usersData, prospectsData, membersData] = await Promise.all([
                api.getTasks(),
                api.getUsers(),
                api.getProspects(),
                api.getMembers(),
            ]);
            setTasks(tasksData); // Sorting is now handled in useMemo
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
    const sellers = useMemo(() => {
        if (!user) return [];
        if (user.role === Role.Admin) {
            return users.filter(u => u.role === Role.Seller || u.role === Role.Manager);
        }
        return users.filter(u => (u.role === Role.Seller || u.role === Role.Manager) && u.branch === user.branch);
    }, [users, user]);

    const filteredTasks = useMemo(() => {
        if (!user) return [];
        let tasksToFilter = tasks;

        // Filter tasks based on the branch of the related entity
        if (user.role !== Role.Admin) {
            tasksToFilter = tasksToFilter.filter(t => {
                const relatedEntity = relatedToMap.get(t.relatedTo);
                return relatedEntity?.branch === user.branch;
            });
        }
        
        // Filter by assigned user for non-admin/manager roles
        if (user.role === Role.Seller) {
            tasksToFilter = tasksToFilter.filter(t => t.assignedTo === user.id);
        }
        
        const finalFilteredTasks = tasksToFilter.filter(t => {
            const statusMatch = statusFilter === 'all' || t.status === statusFilter;
            const sellerMatch = sellerFilter === 'all' || t.assignedTo === sellerFilter;

            return (user.role === Role.Admin || user.role === Role.Manager) ? (statusMatch && sellerMatch) : statusMatch;
        });

        // Sort tasks by date consistently
        return finalFilteredTasks.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    }, [tasks, user, statusFilter, sellerFilter, relatedToMap]);

    const handleCreateSuccess = () => {
        setCreateModalOpen(false);
        fetchData(); // Refetch all data to get the new task(s)
    };

    const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
        try {
            const updatedTask = await api.updateTask({ ...task, status: newStatus });
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        } catch (error) {
            console.error("Failed to update task status", error);
        }
    };

    if (loading) return <Card>Cargando tareas...</Card>;

    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                <h1 className="text-3xl font-bold text-brand-text-primary">Mis Tareas</h1>
                <div className="flex items-center gap-2">
                    {canManage && (
                         <button
                            onClick={() => setGoalsModalOpen(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            <GoalIcon />
                            Establecer Objetivos
                        </button>
                    )}
                    {(canManage || user?.role === Role.Seller) && (
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            <AddIcon />
                            Crear Tarea
                        </button>
                    )}
                </div>
            </div>
            
            <Card className="mb-4 p-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-brand-text-secondary">Estado</label>
                        <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-surface text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary capitalize">
                            <option value="all">Todos</option>
                            {TASK_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                        </select>
                    </div>
                    {canManage && (
                        <div>
                            <label htmlFor="sellerFilter" className="block text-sm font-medium text-brand-text-secondary">Asignado a</label>
                            <select id="sellerFilter" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-surface text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                <option value="all">Todos</option>
                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Tarea y Vencimiento</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Contacto</th>
                                {canManage && <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Asignado a</th>}
                                <th scope="col" className="relative px-4 py-2"><span className="sr-only">Completar</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className={`${task.status === 'hecha' ? 'opacity-60' : ''}`}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${TASK_STATUS_COLORS[task.status] || 'bg-gray-700 text-gray-200'}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${task.status === 'hecha' ? 'line-through text-brand-text-muted' : 'text-brand-text-primary'}`}>{task.title}</div>
                                        <div className="text-xs text-brand-text-muted">
                                            <span className="capitalize">{task.type}</span> &middot; {new Date(task.dateTime).toLocaleString('es-AR', {
                                                year: '2-digit',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-brand-text-secondary">{relatedToMap.get(task.relatedTo)?.name || 'N/A'}</div>
                                        {user?.role === Role.Admin && (
                                            <div className="text-xs text-brand-text-muted">{relatedToMap.get(task.relatedTo)?.branch || 'N/A'}</div>
                                        )}
                                    </td>
                                    {canManage && (
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-text-secondary">
                                          {userMap.get(task.assignedTo) || 'N/A'}
                                      </td>
                                    )}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        {task.status === TaskStatus.Pending && (
                                            <button onClick={() => handleStatusChange(task, TaskStatus.Done)} className="text-green-400 hover:text-green-300">
                                                Completar
                                            </button>
                                        )}
                                         {task.status === TaskStatus.Done && (
                                            <button onClick={() => handleStatusChange(task, TaskStatus.Pending)} className="text-brand-accent hover:text-brand-accent-hover">
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
                    <div className="text-center py-10">
                        <h3 className="text-xl font-semibold text-brand-text-secondary">No se encontraron tareas</h3>
                        <p className="text-brand-text-muted mt-2">Intenta ajustar los filtros o crea una nueva tarea.</p>
                    </div>
                )}
            </Card>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                sellers={sellers}
                prospects={prospects}
                members={members}
            />
            
            <SetGoalsModal
                isOpen={isGoalsModalOpen}
                onClose={() => setGoalsModalOpen(false)}
            />
        </div>
    );
};

export default TasksView;
