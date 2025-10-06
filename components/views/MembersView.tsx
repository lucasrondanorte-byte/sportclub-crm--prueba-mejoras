import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../services/api';
import { Member, User, Role, Task, TaskStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import EditMemberModal from '../modals/EditMemberModal';
import EmptyState from '../common/EmptyState';

type SortDirection = 'ascending' | 'descending';

const TaskStatusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const SortIcon = ({ direction }: { direction: SortDirection | null }) => {
    if (!direction) return <span className="opacity-30">↕</span>;
    return direction === 'ascending' ? <span>▲</span> : <span>▼</span>;
};
const WhatsAppListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.834 8.834 0 01-4.195-1.125l-2.665.89c-.337.112-.718-.268-.606-.605l.89-2.665A8.834 8.834 0 012 10C2 6.134 5.582 3 10 3s8 3.134 8 7zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;

// FIX: Added props interface to accept setNotification from Dashboard
interface MembersViewProps {
  setNotification: (notification: { message: string; type: 'success' | 'error' } | null) => void;
}

const MembersView: React.FC<MembersViewProps> = ({ setNotification }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // Filter states
    const [taskFilter, setTaskFilter] = useState<'all' | 'with' | 'without'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>({ key: 'createdAt', direction: 'descending' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [membersData, usersData, tasksData] = await Promise.all([
                api.getMembers(),
                api.getUsers(),
                api.getTasks()
            ]);
            setMembers(membersData);
            setUsers(usersData);
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

    const memberIdsWithPendingTasks = useMemo(() => {
        return new Set(tasks.filter(t => t.status === TaskStatus.Pending).map(t => t.relatedTo));
    }, [tasks]);

    const filteredMembers = useMemo(() => {
        if (!user) return [];
        let membersToProcess = [...members];

        // Role-based pre-filtering
        if (user.role === Role.Manager || user.role === Role.Viewer) {
            membersToProcess = membersToProcess.filter(m => m.branch === user.branch);
        } else if (user.role === Role.Seller) {
            membersToProcess = membersToProcess.filter(m => m.originalSeller === user.id);
        }

        // UI-based filtering
        membersToProcess = membersToProcess.filter(m => {
            const hasPendingTask = memberIdsWithPendingTasks.has(m.id);
            const taskMatch = taskFilter === 'all' || (taskFilter === 'with' && hasPendingTask) || (taskFilter === 'without' && !hasPendingTask);
            return taskMatch;
        });

        // Sorting
        if (sortConfig !== null) {
            membersToProcess.sort((a, b) => {
                const { key, direction } = sortConfig;
                let aValue: any;
                let bValue: any;

                if (key === 'pendingTask') {
                    aValue = memberIdsWithPendingTasks.has(a.id);
                    bValue = memberIdsWithPendingTasks.has(b.id);
                } else if (key === 'originalSeller') {
                    aValue = userMap.get(a.originalSeller)?.toLowerCase() || 'zzzz';
                    bValue = userMap.get(b.originalSeller)?.toLowerCase() || 'zzzz';
                } else {
                    aValue = a[key as keyof Member];
                    bValue = b[key as keyof Member];
                }

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        return membersToProcess;
    }, [members, user, taskFilter, sortConfig, memberIdsWithPendingTasks, userMap]);

    const handleSort = (key: string) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleRowClick = (member: Member) => {
        if(user?.role !== Role.Viewer) {
            setSelectedMember(member);
            setEditModalOpen(true);
        }
    };
    
    const handleModalSuccess = () => {
        setEditModalOpen(false);
        setSelectedMember(null);
        setNotification({ message: 'Socio actualizado con éxito.', type: 'success' });
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

    if (loading) return <Card><div className="h-96 flex items-center justify-center">Cargando socios...</div></Card>;

    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-brand-text-primary">Socios del Gimnasio</h1>

             <Card>
                 <div data-tutorial="members-filters" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="taskFilter" className="block text-sm font-medium text-brand-text-secondary">Tareas</label>
                        <select id="taskFilter" value={taskFilter} onChange={(e) => setTaskFilter(e.target.value as any)} className="form-input">
                            <option value="all">Todos</option>
                            <option value="with">Con tarea pendiente</option>
                            <option value="without">Sin tarea pendiente</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card>
                <div data-tutorial="members-table" className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-brand-border">
                            <tr>
                                <SortableHeader label="Nombre" sortKey="name" />
                                {user?.role === Role.Admin && <SortableHeader label="Sucursal" sortKey="branch" />}
                                <SortableHeader label="Plan" sortKey="plan" />
                                <SortableHeader label="Tarea Pendiente" sortKey="pendingTask" />
                                <SortableHeader label="Última Acción" sortKey="lastActionDate" />
                                {canManage && <SortableHeader label="Vendedor Origen" sortKey="originalSeller" />}
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member, index) => (
                                <tr key={member.id} onClick={() => handleRowClick(member)} className={`border-b border-brand-border transition-colors duration-200 ${user?.role !== Role.Viewer ? 'cursor-pointer' : ''} ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/5'} hover:bg-brand-primary/10`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-brand-text-primary">{member.name}</div>
                                    </td>
                                     {user?.role === Role.Admin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{member.branch}</td>
                                     )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-brand-text-secondary">{member.plan}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {memberIdsWithPendingTasks.has(member.id) ? <TaskStatusIcon /> : <span className="text-gray-500">-</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                        {member.lastActionDate ? new Date(member.lastActionDate).toLocaleDateString('es-AR') : 'N/A'}
                                    </td>
                                    {canManage && (
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                          {userMap.get(member.originalSeller) || 'N/A'}
                                      </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {member.phone && (
                                            <a
                                                href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
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
                 {filteredMembers.length === 0 && (
                     <EmptyState 
                        title="No se encontraron socios"
                        message="Intenta ajustar los filtros o verifica si hay socios en el sistema."
                    />
                )}
            </Card>
            <EditMemberModal
                isOpen={isEditModalOpen}
                onClose={() => { setEditModalOpen(false); setSelectedMember(null); }}
                onSuccess={handleModalSuccess}
                users={users}
                member={selectedMember}
            />
        </div>
    );
};

export default MembersView;