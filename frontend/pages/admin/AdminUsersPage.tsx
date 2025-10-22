import React, { useState, useMemo, useEffect } from 'react';
import apiService from '../../src/services/api';
import { useToast } from '../../components/ToastProvider';

// Define the User type
interface User {
  id: number;
  name: string;
  email: string;
  company: string;
  status: 'Actif' | 'En attente' | 'Bloqué';
  creationDate: string;
}

// Mock User Data (retiré) — on n'utilise plus de données locales ni de démonstration pour les utilisateurs
// const mockUsers: User[] = [];

// Reusable Status Badge Component
const StatusBadge = ({ status }: { status: 'Actif' | 'En attente' | 'Bloqué' }) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    const statusClasses = {
        'Actif': "bg-green-100 text-green-800",
        'En attente': "bg-yellow-100 text-yellow-800",
        'Bloqué': "bg-red-100 text-red-800",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

// Type for the user being edited/created
type EditableUser = Partial<User>;

// Modal Form Component for Adding/Editing Users
const UserFormModal: React.FC<{
    user: EditableUser;
    onSave: (user: EditableUser) => void;
    onClose: () => void;
}> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState<EditableUser>(user);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{user.id ? 'Modifier' : 'Ajouter'} un utilisateur</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom complet</label>
                                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green focus:border-agria-green"/>
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
                                <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green focus:border-agria-green"/>
                            </div>
                             <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700">Entreprise</label>
                                <input type="text" name="company" id="company" value={formData.company || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green focus:border-agria-green"/>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                                <select name="status" id="status" value={formData.status || 'Actif'} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-agria-green focus:border-agria-green sm:text-sm rounded-md">
                                    <option>Actif</option>
                                    <option>En attente</option>
                                    <option>Bloqué</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-agria-green text-base font-medium text-white hover:bg-agria-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agria-green sm:ml-3 sm:w-auto sm:text-sm">
                            Sauvegarder
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
    
    const { addToast } = useToast();

    // Load users from API on component mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getUsers();
            if (response.users) {
                setUsers(response.users);
            } else {
                // Ne plus utiliser de données locales ou de démonstration
                setUsers([]);
                addToast('Aucun utilisateur trouvé dans la base de données', 'info');
            }
        } catch (error) {
            console.error("Failed to load users from API", error);
            // Ne plus utiliser de fallback localStorage/mock
            setUsers([]);
            addToast('Erreur lors du chargement des utilisateurs depuis la base MySQL.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => {
                if (statusFilter === 'Tous') return true;
                return user.status === statusFilter;
            })
            .filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [users, searchTerm, statusFilter]);
    
    const handleAddNew = () => {
        setEditingUser({ name: '', email: '', company: '', status: 'Actif' });
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
            try {
                await apiService.deleteUser(userId);
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
                addToast('Utilisateur supprimé avec succès', 'success');
            } catch (error) {
                console.error("Failed to delete user", error);
                const msg = (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : 'Erreur lors de la suppression de l\'utilisateur';
                addToast(msg, 'error');
            }
        }
    };

    const handleSave = async (userToSave: EditableUser) => {
        try {
            if (userToSave.id) {
                // Update existing user
                const updatedUser = await apiService.updateUser(userToSave.id, userToSave);
                setUsers(prevUsers => 
                    prevUsers.map(u => u.id === userToSave.id ? { ...u, ...updatedUser.user } as User : u)
                );
                addToast('Utilisateur modifié avec succès', 'success');
            } else {
                // Add new user
                const newUserData = {
                    name: userToSave.name || '',
                    email: userToSave.email || '',
                    company: userToSave.company || '',
                    status: userToSave.status || 'En attente',
                };
                const createdUser = await apiService.createUser(newUserData);
                setUsers(prevUsers => [...prevUsers, createdUser.user]);
                addToast('Utilisateur créé avec succès', 'success');
            }
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Failed to save user", error);
            const msg = (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : 'Erreur lors de la sauvegarde de l\'utilisateur';
            addToast(msg, 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-700">Gestion des Utilisateurs</h1>
                <button onClick={handleAddNew} className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Ajouter un utilisateur
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Rechercher des utilisateurs"
                />
                <select
                    className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filtrer les utilisateurs par statut"
                >
                    <option>Tous</option>
                    <option>Actif</option>
                    <option>En attente</option>
                    <option>Bloqué</option>
                </select>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="p-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.company}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.creationDate).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900">Modifier</button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 ml-4">Supprimer</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Aucun utilisateur trouvé.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isModalOpen && editingUser && (
                <UserFormModal 
                    user={editingUser}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminUsersPage;