import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { User, Role } from '../../types';
import Card from '../common/Card';
import EditUserModal from '../modals/EditUserModal';
import { useAuth } from '../../hooks/useAuth';

const ROLE_COLORS: Record<Role, string> = {
    [Role.Admin]: 'bg-yellow-500/20 text-yellow-300',
    [Role.Manager]: 'bg-red-500/20 text-red-300',
    [Role.Seller]: 'bg-blue-500/20 text-blue-300',
    [Role.Viewer]: 'bg-gray-500/20 text-gray-300',
};

// FIX: Added props interface to accept setNotification from Dashboard
interface UsersViewProps {
    setNotification: (notification: { message: string; type: 'success' | 'error' } | null) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ setNotification }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { user: currentUser } = useAuth();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const usersData = await api.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredUsers = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === Role.Admin) {
            return users;
        }
        if (currentUser.role === Role.Manager) {
            return users.filter(u => u.branch === currentUser.branch && u.role !== Role.Admin);
        }
        return [];
    }, [users, currentUser]);

    const handleEditSuccess = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setEditModalOpen(false);
        setSelectedUser(null);
        setNotification({ message: 'Usuario actualizado con éxito.', type: 'success' });
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditModalOpen(true);
    };

    if (loading) return <Card>Cargando usuarios...</Card>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-brand-text-primary">Gestión de Usuarios</h1>
                <p className="text-brand-text-secondary">
                    {currentUser?.role === Role.Admin ? "Gestiona usuarios de todas las sucursales." : `Gestiona usuarios de la sucursal ${currentUser?.branch}.`}
                </p>
            </div>

            <Card>
                <div data-tutorial="users-table" className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Sucursal</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Rol</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-brand-text-primary">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-brand-text-secondary">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{user.branch}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${ROLE_COLORS[user.role] || 'bg-gray-700 text-gray-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleEditClick(user)} className="font-medium text-brand-primary hover:text-brand-primary-hover">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => { setEditModalOpen(false); setSelectedUser(null); }}
                onSuccess={handleEditSuccess}
                user={selectedUser}
            />

        </div>
    );
};

export default UsersView;