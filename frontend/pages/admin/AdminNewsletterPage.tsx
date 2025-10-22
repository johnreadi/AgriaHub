import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill';
import { TrashIcon, SendIcon, MailIcon, ChartBarIcon, CalendarIcon, UsersIcon, ClockIcon, CloseIcon, PaperclipIcon, SpinnerIcon } from '../../components/icons/Icons';
import { useToast } from '../../components/ToastProvider';

import apiService from '../../src/services/api.js';

const SCHEDULED_NEWSLETTERS_KEY = 'agria-scheduled-newsletters';

type ScheduledItem = {
    id: string;
    date: string; // ISO string for date
    time: string;
    subject: string;
    content: string;
    attachment?: { name: string; type: string };
};

const toBase64 = (file: File): Promise<string | null> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


// ... existing code ...
// Ajouter le type pour les abonnés récupérés via l'API
interface SubscriberItem {
    id: number;
    email: string;
    isActive: boolean;
    createdAt?: string;
    firstName?: string;
    lastName?: string;
}

// --- Scheduling Tab Props ---
 type SchedulingTabProps = {
    scheduledItems: ScheduledItem[];
    setScheduledItems: React.Dispatch<React.SetStateAction<ScheduledItem[]>>;
    currentSubject: string;
    currentContent: string;
    currentAttachment: File | null;
    onScheduleSuccess: () => void;
 };
// --- Scheduling Modal ---
 type ScheduleModalProps = {
     onClose: () => void;
     onSchedule: (time: string) => void;
     selectedDatesCount: number;
 };
 const ScheduleModal: React.FC<ScheduleModalProps> = ({ onClose, onSchedule, selectedDatesCount }) => {
     const [time, setTime] = useState('09:00');
 
     const handleSchedule = () => {
         onSchedule(time);
     };
     
     return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
             <div className="bg-white rounded-lg shadow-xl w-full max-w-sm transform" onClick={e => e.stopPropagation()}>
                  <div className="p-6">
                     <h3 className="text-lg font-bold text-gray-800 mb-2">Planifier pour {selectedDatesCount} jour(s)</h3>
                     <p className="text-gray-600 mb-4">Choisissez l'heure d'envoi pour les dates sélectionnées.</p>
                      <div>
                         <label htmlFor="time" className="block text-sm font-medium text-gray-700">Heure d'envoi</label>
                         <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} required className="mt-1 block w-full input-style"/>
                      </div>
                 </div>
                 <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse rounded-b-lg">
                     <button type="button" onClick={handleSchedule} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-agria-green text-base font-medium text-white hover:bg-agria-green-dark sm:ml-3">Planifier</button>
                     <button type="button" onClick={onClose} className="mt-3 w-full sm:w-auto sm:mt-0 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                 </div>
             </div>
         </div>
     );
 };
const SchedulingTab: React.FC<SchedulingTabProps> = ({ scheduledItems, setScheduledItems, currentSubject, currentContent, currentAttachment, onScheduleSuccess }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const { addToast } = useToast();

    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const refreshScheduledFromApi = useCallback(async () => {
        try {
            const resp = await apiService.listCampaigns({ page: 1, limit: 200, status: 'scheduled' });
            const rows = resp?.campaigns || [];
            const items = rows
                .filter((c: any) => c.scheduledFor)
                .map((c: any) => ({
                    id: String(c.id),
                    date: new Date(c.scheduledFor).toISOString(),
                    time: new Date(c.scheduledFor).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    subject: c.subject || c.title || 'Campagne',
                    content: c.content || '',
                }))
                .filter((item: ScheduledItem) => {
                    const d = new Date(item.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                });
            setScheduledItems(items);
        } catch (error) {
            console.error('Erreur de chargement des campagnes planifiées:', error);
            addToast('Impossible de récupérer les campagnes planifiées.', 'error');
        }
    }, [addToast, month, year, setScheduledItems]);

    useEffect(() => {
        refreshScheduledFromApi();
    }, [refreshScheduledFromApi]);

    const changeMonth = (offset: number) => {
        const next = new Date(year, month + offset, 1);
        setCurrentDate(next);
        setSelectedDates([]);
        // Rafraîchir après changement de mois
        setTimeout(() => refreshScheduledFromApi(), 0);
    };

    // Ajout: gestion du clic sur un jour (déplacer depuis global)
    const handleDayClick = (day: number) => {
        const clickedDate = new Date(year, month, day);
        const clickedDateString = clickedDate.toISOString().split('T')[0];

        setSelectedDates(prev => {
            if (prev.includes(clickedDateString)) {
                return prev.filter(d => d !== clickedDateString);
            } else {
                return [...prev, clickedDateString];
            }
        });
    };

    const handleOpenSchedulerModal = () => {
        const strippedContent = currentContent.replace(/<(.|\n)*?>/g, '').trim();
        if (!currentSubject.trim() || !strippedContent) {
            addToast("Veuillez d'abord composer une newsletter avec un sujet et un contenu.", 'error');
            return;
        }
        setIsModalOpen(true);
    };

    const handleScheduleConfirm = async (time: string) => {
        const [hh, mm] = time.split(':');
        try {
            const promises = selectedDates.map(async (dateStr) => {
                const scheduledDate = new Date(`${dateStr}T${hh}:${mm}:00`);
                const payload = {
                    title: currentSubject,
                    subject: currentSubject,
                    content: currentContent,
                    scheduledFor: scheduledDate.toISOString(),
                    targetAudience: 'all',
                    template: 'default'
                };
                await apiService.createCampaign(payload);
            });
            await Promise.all(promises);
            addToast(`${selectedDates.length} newsletter(s) planifiée(s) pour ${time}.`, 'success');
            onScheduleSuccess();
            setIsModalOpen(false);
            setSelectedDates([]);
            await refreshScheduledFromApi();
        } catch (error) {
            console.error('Erreur lors de la planification:', error);
            addToast('La planification a échoué.', 'error');
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette planification ?")) {
            try {
                await apiService.deleteCampaign(id);
                addToast('Planification supprimée.', 'success');
                await refreshScheduledFromApi();
            } catch (error) {
                console.error('Erreur suppression planification:', error);
                addToast('Échec de la suppression.', 'error');
            }
        }
    };

    const renderCalendar = () => {
        const blanks = Array((firstDayOfMonth + 6) % 7).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const calendarDays = [...blanks, ...days];

        return calendarDays.map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="border rounded-lg bg-gray-50"></div>;
            
            const dayDate = new Date(year, month, day);
            const dayDateString = dayDate.toISOString().split('T')[0];
            const isToday = dayDate.toDateString() === new Date().toDateString();
            const isSelected = selectedDates.includes(dayDateString);
            
            const scheduledForDay = scheduledItems.filter(item => 
                new Date(item.date).toDateString() === dayDate.toDateString()
            );

            const cellClasses = `border p-1 sm:p-2 rounded-lg h-24 sm:h-32 flex flex-col cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-200 border-blue-400' : 'hover:bg-agria-green/10'
            }`;

            return (
                <div key={day} onClick={() => handleDayClick(day)} className={cellClasses}>
                    <span className={`text-xs sm:text-base font-semibold ${isToday ? 'text-white bg-agria-green rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-auto text-xs">
                        {scheduledForDay.map(item => (
                             <div key={item.id} title={`${item.subject} à ${item.time}`} className="relative group p-1 bg-green-100 text-green-800 rounded text-left">
                                <div className="flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3 flex-shrink-0"/>
                                    <span className="font-semibold truncate text-xs">{item.subject}</span>
                                    {item.attachment && <span className="flex-shrink-0 ml-auto" title={item.attachment.name}>
                                        <PaperclipIcon className="h-3 w-3 text-gray-600" /></span>}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(item.id); }}
                                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    };

    const canSchedule = selectedDates.length > 0 && currentSubject.trim() !== '' && currentContent.replace(/<(.|\n)*?>/g, '').trim() !== '';

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h3 className="text-xl font-bold text-capitalize">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center font-bold text-gray-500 mb-2">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
            </div>
            <div className="mt-4 text-center">
                 <button 
                    onClick={handleOpenSchedulerModal}
                    disabled={!canSchedule}
                    className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                     Planifier pour la sélection ({selectedDates.length})
                 </button>
            </div>
            {isModalOpen && (
                <ScheduleModal 
                    onClose={() => setIsModalOpen(false)}
                    onSchedule={handleScheduleConfirm}
                    selectedDatesCount={selectedDates.length}
                />
            )}
        </div>
    );
};

// --- Main Page Component ---
const AdminNewsletterPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'management' | 'stats' | 'scheduling'>('management');
    const { addToast } = useToast();
    
    // Lifted State
    const [subject, setSubject] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);

    // Planification gérée via l'API côté serveur; pas d'utilisation de localStorage ici.
    useEffect(() => {
        setScheduledItems([]);
    }, []);

    // Pas de persistance locale; SchedulingTab rafraîchit les données depuis l'API.
    useEffect(() => {}, [scheduledItems]);
    
    const resetComposer = () => {
        setSubject('');
        setEditorContent('');
        setAttachment(null);
    };


    const tabs = [
        { id: 'management', name: 'Gestion de Newsletter', icon: MailIcon },
        { id: 'stats', name: "Statistiques d'envois", icon: ChartBarIcon },
        { id: 'scheduling', name: 'Planification', icon: CalendarIcon },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-700 mb-4">Gestion de la Newsletter</h1>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-agria-green text-agria-green-dark'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="h-5 w-5" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-6">
                {activeTab === 'management' && <NewsletterManagement 
                    subject={subject}
                    setSubject={setSubject}
                    editorContent={editorContent}
                    setEditorContent={setEditorContent}
                    attachment={attachment}
                    setAttachment={setAttachment}
                    onSendSuccess={resetComposer}
                />}
                {activeTab === 'stats' && <StatisticsTab />}
                {activeTab === 'scheduling' && <SchedulingTab
                    scheduledItems={scheduledItems}
                    setScheduledItems={setScheduledItems}
                    currentSubject={subject}
                    currentContent={editorContent}
                    currentAttachment={attachment}
                    onScheduleSuccess={resetComposer}
                 />}
            </div>
             <style>{`
                .input-style {
                    padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                }
                .input-style:focus {
                    outline: 2px solid transparent; outline-offset: 2px; border-color: #009A58; box-shadow: 0 0 0 2px #009A58;
                }
                .quill-editor {
                    display: flex; flex-direction: column; height: 100%;
                }
                .quill-editor .ql-container.ql-snow {
                    flex-grow: 1; overflow-y: auto; border-bottom-left-radius: 0.375rem; border-bottom-right-radius: 0.375rem;
                }
                 .quill-editor .ql-toolbar.ql-snow {
                    border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem;
                }
                .text-capitalize::first-letter {
                    text-transform: uppercase;
                }
             `}</style>
        </div>
    );
};

export default AdminNewsletterPage;

// --- Statistics Tab Component ---
const StatisticsTab: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getNewsletterStats();
                setStats(data);
            } catch (e: any) {
                console.error('Erreur de récupération des statistiques:', e);
                setError(e?.message || 'Échec de chargement des statistiques');
                addToast('Impossible de charger les statistiques.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [addToast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 text-gray-600">
                <SpinnerIcon className="h-5 w-5 mr-2" /> Chargement des statistiques...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-md">
                {error}
            </div>
        );
    }

    // Sécuriser l’accès aux champs
    const subscribers = stats?.subscribers || {};
    const campaigns = stats?.campaigns || {};

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><UsersIcon className="h-5 w-5"/> Abonnés</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-gray-900">{subscribers.total ?? '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Actifs</p>
                        <p className="text-2xl font-bold text-gray-900">{subscribers.active ?? '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Désinscrits</p>
                        <p className="text-2xl font-bold text-gray-900">{subscribers.unsubscribed ?? '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Nouveaux (30j)</p>
                        <p className="text-2xl font-bold text-gray-900">{subscribers.newLast30Days ?? '-'}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MailIcon className="h-5 w-5"/> Campagnes</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Envoyées</p>
                        <p className="text-2xl font-bold text-gray-900">{campaigns.sent ?? '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Planifiées</p>
                        <p className="text-2xl font-bold text-gray-900">{campaigns.scheduled ?? '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Échouées</p>
                        <p className="text-2xl font-bold text-gray-900">{campaigns.failed ?? '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md border">
                        <p className="text-sm text-gray-600">Brouillons</p>
                        <p className="text-2xl font-bold text-gray-900">{campaigns.draft ?? '-'}</p>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ClockIcon className="h-5 w-5"/> Activité récente</h3>
                <div className="space-y-2">
                    {(stats?.recentCampaigns || []).length > 0 ? (
                        (stats?.recentCampaigns || []).map((c: any) => (
                            <div key={c.id} className="p-3 bg-gray-50 rounded-md border flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-700 truncate">{c.subject || c.title || 'Campagne'}</span>
                                <span className="text-xs text-gray-500 ml-auto">{(c.status || '').toUpperCase()}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500">Aucune activité récente.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Management Tab Component ---
 type NewsletterManagementProps = {
     subject: string;
     setSubject: (value: string) => void;
     editorContent: string;
     setEditorContent: (value: string) => void;
     attachment: File | null;
     setAttachment: (file: File | null) => void;
     onSendSuccess: () => void;
 };
 const NewsletterManagement: React.FC<NewsletterManagementProps> = ({ subject, setSubject, editorContent, setEditorContent, attachment, setAttachment, onSendSuccess }) => {
     const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
     const [selectedSubscribers, setSelectedSubscribers] = useState<number[]>([]);
     const [searchTerm, setSearchTerm] = useState('');
     const [isSending, setIsSending] = useState(false);
     const { addToast } = useToast();
 
     const loadSubscribers = useCallback(async () => {
         try {
             const data = await apiService.listSubscribers({ page: 1, limit: 100 })
             const list: SubscriberItem[] = data?.subscribers || []
             setSubscribers(list)
             setSelectedSubscribers(list.map(s => s.id))
         } catch (error) {
             console.error('Failed to load subscribers:', error)
             addToast('Erreur lors du chargement des abonnés depuis l’API.', 'error')
         }
     }, [addToast])
 
     useEffect(() => {
         loadSubscribers()
     }, [loadSubscribers])
 
     const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
         const file = event.target.files?.[0]
         if (!file) return
 
         const reader = new FileReader()
         reader.onload = async (e) => {
             const text = e.target?.result as string
             const emails = text.split(/[\n,;]+/).map(email => email.trim()).filter(email => /^\S+@\S+\.\S+$/.test(email))
 
             if (emails.length === 0) {
                 addToast('Aucune adresse email valide trouvée dans le fichier.', 'error')
                 return
             }
 
             let success = 0
             let failures = 0
             const results = await Promise.allSettled(emails.map(email => apiService.addSubscriber({ email })))
             results.forEach(r => {
                 if (r.status === 'fulfilled') success++
                 else failures++
             })
 
             await loadSubscribers()
 
             const message = `${success} abonné(s) importé(s). ${failures} erreur(s).`
             addToast(message, 'success')
         }
 
         reader.readAsText(file)
         event.target.value = ''
     }
 
     const handleDeleteSubscriber = async (idToDelete: number) => {
         if (window.confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) {
             try {
                 await apiService.removeSubscriber(idToDelete)
                 addToast('Abonné supprimé.', 'success')
                 await loadSubscribers()
             } catch (error) {
                 console.error('Erreur suppression abonné:', error)
                 addToast('Échec de la suppression.', 'error')
             }
         }
     }
     
     const filteredSubscribers = useMemo(() => {
         return subscribers.filter(s => s.email.toLowerCase().includes(searchTerm.toLowerCase()))
     }, [subscribers, searchTerm])
 
     const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
         if (e.target.checked) {
             setSelectedSubscribers(filteredSubscribers.map(s => s.id))
         } else {
             setSelectedSubscribers([])
         }
     }
 
     const handleSelectOne = (id: number, isChecked: boolean) => {
         if (isChecked) {
             setSelectedSubscribers(prev => [...prev, id])
         } else {
             setSelectedSubscribers(prev => prev.filter(s => s !== id))
         }
     }
 
     const handleSendNewsletter = async (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault()
         const strippedContent = editorContent.replace(/<(.|\n)*?>/g, '').trim()
         if (!subject.trim() || !strippedContent) {
             addToast('Veuillez remplir le sujet et le contenu de la newsletter.', 'error')
             return
         }
         if (selectedSubscribers.length === 0) {
             addToast('Veuillez sélectionner au moins un destinataire.', 'error')
             return
         }
         
         setIsSending(true)
         try {
             // Créer une campagne (brouillon), puis la déclencher via l’API
             const created = await apiService.createCampaign({ title: subject, subject, content: editorContent })
             await apiService.sendCampaign(created.id)
 
             addToast(`Newsletter envoyée via l’API.`, 'success')
             onSendSuccess()
         } catch (error) {
             console.error("Erreur lors de l'envoi de la newsletter:", error)
             addToast("Une erreur est survenue lors de l'envoi.", 'error')
         } finally {
             setIsSending(false)
         }
     }
     
     const quillModules = {
         toolbar: [
             [{ 'header': [1, 2, 3, false] }],
             ['bold', 'italic', 'underline','strike', 'blockquote'],
             [{'list': 'ordered'}, {'list': 'bullet'}],
             ['link', 'image'],
             [{ 'color': [] }, { 'background': [] }],
             ['clean']
         ],
     }
     
     const isAllFilteredSelected = filteredSubscribers.length > 0 && selectedSubscribers.length === filteredSubscribers.length
 
     return (
         <div className="grid lg:grid-cols-5 gap-8">
             <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg border">
                 <h3 className="text-xl font-bold text-gray-800 mb-4">Abonnés ({selectedSubscribers.length} / {filteredSubscribers.length} sél.)</h3>
                 <div className="flex flex-col sm:flex-row gap-2 mb-4">
                     <label htmlFor="file-upload" className="w-full text-center cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors">
                         Importer (CSV, TXT)
                     </label>
                     <input id="file-upload" type="file" className="hidden" onChange={handleFileImport} accept=".csv,.txt" />
                 </div>
                 <input type="search" placeholder="Rechercher un email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green mb-2"/>
                 <div className="flex items-center p-2 border-b border-t border-gray-200">
                     <input type="checkbox" id="select-all" className="h-4 w-4 rounded border-gray-300 text-agria-green focus:ring-agria-green" checked={isAllFilteredSelected} onChange={handleSelectAll} disabled={filteredSubscribers.length === 0}/>
                     <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">Tout sélectionner / désélectionner</label>
                 </div>
                 <ul className="h-80 overflow-y-auto space-y-1 mt-2 pr-2">
                     {filteredSubscribers.length > 0 ? filteredSubscribers.map(item => (
                         <li key={item.id} className="flex items-center p-2 bg-white rounded-md shadow-sm">
                             <input type="checkbox" id={`cb-${item.id}`} className="h-4 w-4 rounded border-gray-300 text-agria-green focus:ring-agria-green" checked={selectedSubscribers.includes(item.id)} onChange={(e) => handleSelectOne(item.id, e.target.checked)}/>
                             <label htmlFor={`cb-${item.id}`} className="ml-2 text-sm text-gray-700 truncate flex-1">{item.email}</label>
                             <button onClick={() => handleDeleteSubscriber(item.id)} className="text-red-500 hover:text-red-700 p-1 ml-2" title="Supprimer l'abonné"><TrashIcon className="h-4 w-4"/></button>
                         </li>
                     )) : (<li className="text-center text-gray-500 text-sm py-8">Aucun abonné trouvé.</li>)}
                 </ul>
             </div>
             <div className="lg:col-span-3">
                 <form onSubmit={handleSendNewsletter} className="bg-gray-50 p-4 rounded-lg border h-full flex flex-col">
                     <h3 className="text-xl font-bold text-gray-800 mb-4">Composer une newsletter</h3>
                     <div className="space-y-4 flex-grow flex flex-col">
                         <div>
                             <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Sujet</label>
                             <input type="text" name="subject" id="subject" required value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 block w-full input-style"/>
                         </div>
                         <div className="flex-grow flex flex-col min-h-[350px]">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                             <div className="bg-white rounded-md overflow-hidden flex-grow flex flex-col">
                                 <ReactQuill theme="snow" value={editorContent} onChange={setEditorContent} modules={quillModules} className="quill-editor"/>
                             </div>
                         </div>
                         <button 
                             type="submit" 
                             className="w-full bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-auto disabled:opacity-50 disabled:cursor-not-allowed" 
                             disabled={isSending || selectedSubscribers.length === 0 || !subject.trim() || !editorContent.replace(/<(.|\n)*?>/g, '').trim()}
                         >
                             {isSending ? <SpinnerIcon /> : <SendIcon />}
                             {isSending ? 'Envoi en cours...' : 'Envoyer via API'}
                         </button>
                     </div>
                 </form>
             </div>
         </div>
     )
 }