import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Member, User, Role, MemberStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';

const MEMBER_STATUS_COLORS: Record<MemberStatus, string> = {
    [MemberStatus.Active]: 'bg-green-900/60 text-green-200',
    [MemberStatus.Overdue]: 'bg-red-900/60 text-red-200',
    [MemberStatus.Inactive]: 'bg-gray-700 text-gray-200',
};

const MembersView: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [membersData, usersData] = await Promise.all([
                    api.getMembers(),
                    api.getUsers()
                ]);
                setMembers(membersData);
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const filteredMembers = useMemo(() => {
        if (!user) return [];
        if (user.role === Role.Admin) {
            return members;
        }
        // Filter by branch for all other roles
        let branchMembers = members.filter(m => m.branch === user.branch);

        // Additionally filter for sellers to see only members they originated
        if (user.role === Role.Seller) {
            return branchMembers.filter(m => m.originalSeller === user.id);
        }

        return branchMembers;
    }, [members, user]);


    if (loading) return <Card>Cargando socios...</Card>;

    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;

    return (
        <div>
            <h1 className="text-3xl font-bold text-brand-text-primary mb-6">Socios del Gimnasio</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Nombre</th>
                                {user?.role === Role.Admin && <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Sucursal</th>}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Plan</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Vencimiento</th>
                                {canManage && <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Vendedor Origen</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-brand-text-primary">{member.name}</div>
                                    </td>
                                     {user?.role === Role.Admin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{member.branch}</td>
                                     )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-brand-text-secondary">{member.plan}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${MEMBER_STATUS_COLORS[member.status] || 'bg-gray-700 text-gray-200'}`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                        {new Date(member.endDate).toLocaleDateString('es-AR')}
                                    </td>
                                    {canManage && (
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                          {userMap.get(member.originalSeller) || 'N/A'}
                                      </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredMembers.length === 0 && (
                    <div className="text-center py-10">
                        <h3 className="text-xl font-semibold text-brand-text-secondary">No se encontraron socios</h3>
                        <p className="text-brand-text-muted mt-2">No tienes socios asignados o no hay socios en el sistema.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MembersView;