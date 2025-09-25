import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { api } from '../../services/api';
import { Prospect, User, Role, ProspectStage } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import AddProspectModal from '../modals/AddProspectModal';
// FIX: Changed to a named import because the component is now a named export.
import { EditProspectModal } from '../modals/EditProspectModal';
import ImportProspectsModal from '../modals/ImportProspectsModal';
import ReassignProspectsModal from '../modals/ReassignProspectsModal';
import { PROSPECT_STAGES, PROSPECT_SOURCES } from '../../constants';

const ImportGoogleSheetModal = lazy(() => import('../modals/ImportGoogleSheetModal'));

const STAGE_COLORS: Record<string, string> = {
    [ProspectStage.New]: 'bg-blue-900/60 text-blue-200',
    [ProspectStage.Contacted]: 'bg-indigo-900/60 text-indigo-200',
    [ProspectStage.Trial]: 'bg-yellow-400/20 text-yellow-300',
    [ProspectStage.Won]: 'bg-green-900/60 text-green-200',
    [ProspectStage.Lost]: 'bg-red-900/60 text-red-200',
};

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const ImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const GoogleSheetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM11.5 19H8.5V17.5H11.5V19ZM11.5 16H8.5V14.5H11.5V16ZM11.5 13H8.5V11.5H11.5V13ZM15.5 19H12.5V11.5H15.5V19Z" fill="#34A853"/>
        <path d="M13 9H18.5L13 3.5V9Z" fill="#B0BEC5"/>
    </svg>
);


const ReassignIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);


const ProspectsView: React.FC = () => {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [users, setUsers] = useState<User[]>([]);
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        setSelectedProspects([]);
        try {
            const [prospectsData, usersData] = await Promise.all([
                api.getProspects(),
                api.getUsers()
            ]);
            setProspects(prospectsData);
            setUsers(usersData.filter(u => u.role === Role.Seller || u.role === Role.Manager || u.role === Role.Admin));
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

    const filteredProspects = useMemo(() => {
        if (!user) return [];
    
        let prospectsToFilter = [...prospects];
    
        // 1. Role-based pre-filtering
        if (user.role === Role.Manager || user.role === Role.Viewer) {
            prospectsToFilter = prospectsToFilter.filter(p => p.branch === user.branch);
        } else if (user.role === Role.Seller) {
            prospectsToFilter = prospectsToFilter.filter(p => p.branch === user.branch && p.assignedTo === user.id);
        }
    
        // 2. UI-based filtering
        const hasStageFilter = stageFilter !== 'all';
        const hasSourceFilter = sourceFilter !== 'all';
        const hasSellerFilter = sellerFilter !== 'all' && (user.role === Role.Admin || user.role === Role.Manager);
    
        if (!hasStageFilter && !hasSourceFilter && !hasSellerFilter) {
            return prospectsToFilter;
        }
    
        return prospectsToFilter.filter(p => {
            const stageMatch = !hasStageFilter || p.stage === stageFilter;
            const sourceMatch = !hasSourceFilter || p.source === sourceFilter;
            const sellerMatch = !hasSellerFilter || p.assignedTo === sellerFilter;
            
            return stageMatch && sourceMatch && sellerMatch;
        });
    }, [prospects, user, stageFilter, sourceFilter, sellerFilter]);

    const handleAddSuccess = (newProspect: Prospect) => {
        setProspects(prev => [...prev, newProspect]);
        setAddModalOpen(false);
    };

    const handleEditSuccess = (updatedProspect: Prospect) => {
        setProspects(prev => prev.map(p => p.id === updatedProspect.id ? updatedProspect : p));
        setEditModalOpen(false);
        setSelectedProspect(null);
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
    }
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProspects(filteredProspects.map(p => p.id));
        } else {
            setSelectedProspects([]);
        }
    };

    const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        e.stopPropagation(); // prevent row click handler
        if (e.target.checked) {
            setSelectedProspects(prev => [...prev, id]);
        } else {
            setSelectedProspects(prev => prev.filter(prospectId => prospectId !== id));
        }
    };

    const handleReassignSuccess = () => {
        setReassignModalOpen(false);
        fetchData(); 
    };

    if (loading) return <Card>Cargando prospectos...</Card>;
    
    const canManage = user?.role === Role.Admin || user?.role === Role.Manager;

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-brand-text-primary">Prospectos</h1>
                <div className="flex flex-wrap items-center justify-end gap-2">
                     {selectedProspects.length > 0 && canManage && (
                         <button
                            onClick={() => setReassignModalOpen(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-black bg-brand-accent rounded-md hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                        >
                            <ReassignIcon />
                            Reasignar ({selectedProspects.length})
                        </button>
                    )}
                    {canManage && (
                        <>
                            <button
                                onClick={() => setGoogleSheetModalOpen(true)}
                                className="flex items-center px-4 py-2 text-sm font-medium text-black bg-brand-accent rounded-md hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                            >
                                <GoogleSheetIcon />
                                Importar desde Google Sheet
                            </button>
                             <button
                                onClick={() => setImportModalOpen(true)}
                                className="flex items-center px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                <ImportIcon />
                                Importar Bajas (Excel)
                            </button>
                        </>
                    )}
                    {(canManage || user?.role === Role.Seller) && (
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                        >
                            <AddIcon />
                            Agregar Prospecto
                        </button>
                    )}
                </div>
            </div>
            
            <Card className="mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="stageFilter" className="block text-sm font-medium text-brand-text-secondary">Etapa</label>
                        <select id="stageFilter" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-surface text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                            <option value="all">Todas</option>
                            {PROSPECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sourceFilter" className="block text-sm font-medium text-brand-text-secondary">Origen</label>
                        <select id="sourceFilter" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-surface text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                            <option value="all">Todos</option>
                            {PROSPECT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {canManage && (
                        <div>
                            <label htmlFor="sellerFilter" className="block text-sm font-medium text-brand-text-secondary">Vendedor</label>
                            <select id="sellerFilter" value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-surface text-brand-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                <option value="all">Todos</option>
                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <button onClick={resetFilters} className="w-full px-4 py-2 text-sm font-medium text-brand-text-primary bg-brand-border rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-gray-800">
                            <tr>
                                {canManage && (
                                    <th scope="col" className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary"
                                            checked={!loading && filteredProspects.length > 0 && selectedProspects.length === filteredProspects.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Etapa</th>
                                {user?.role === Role.Admin && <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Sucursal</th>}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Interés</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Próxima Acción</th>
                                {canManage && <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Asignado a</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-brand-surface divide-y divide-brand-border">
                            {filteredProspects.map((prospect) => (
                                <tr key={prospect.id} onClick={() => handleRowClick(prospect)} className={`hover:bg-white/5 ${user?.role !== Role.Viewer ? 'cursor-pointer' : ''}`}>
                                     {canManage && (
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary"
                                                checked={selectedProspects.includes(prospect.id)}
                                                onChange={(e) => handleSelectOne(e, prospect.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                     )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-brand-text-primary">{prospect.name}</div>
                                        <div className="text-xs text-brand-text-muted">{prospect.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STAGE_COLORS[prospect.stage] || 'bg-gray-700 text-gray-200'}`}>
                                            {prospect.stage}
                                        </span>
                                    </td>
                                    {user?.role === Role.Admin && (
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                          {prospect.branch}
                                      </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{prospect.interest}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                        {prospect.nextActionDate ? new Date(prospect.nextActionDate).toLocaleDateString('es-AR') : 'N/A'}
                                    </td>
                                    {canManage && (
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                                          {userMap.get(prospect.assignedTo) || 'N/A'}
                                      </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredProspects.length === 0 && (
                    <div className="text-center py-10">
                        <h3 className="text-xl font-semibold text-brand-text-secondary">No se encontraron prospectos</h3>
                        <p className="text-brand-text-muted mt-2">Intenta ajustar los filtros o agrega un nuevo prospecto.</p>
                    </div>
                )}
            </Card>

            <AddProspectModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSuccess={handleAddSuccess}
                sellers={sellers}
            />
            
            <EditProspectModal
                isOpen={isEditModalOpen}
                onClose={() => { setEditModalOpen(false); setSelectedProspect(null); }}
                onSuccess={handleEditSuccess}
                users={users}
                prospect={selectedProspect}
            />

            <Suspense fallback={<div></div>}>
                <ImportGoogleSheetModal
                    isOpen={isGoogleSheetModalOpen}
                    onClose={() => setGoogleSheetModalOpen(false)}
                    onSuccess={() => {
                        setGoogleSheetModalOpen(false);
                        fetchData(); // Refetch data on successful import
                    }}
                    sellers={sellers}
                />
            </Suspense>


            <ImportProspectsModal
                isOpen={isImportModalOpen}
                onClose={() => setImportModalOpen(false)}
                onSuccess={() => {
                    setImportModalOpen(false);
                    fetchData(); // Refetch data on successful import
                }}
                sellers={sellers}
            />
            
            <ReassignProspectsModal
                isOpen={isReassignModalOpen}
                onClose={() => setReassignModalOpen(false)}
                onSuccess={handleReassignSuccess}
                sellers={sellers}
                prospectsToReassign={prospects.filter(p => selectedProspectsSet.has(p.id))}
            />

        </div>
    );
};

export default ProspectsView;