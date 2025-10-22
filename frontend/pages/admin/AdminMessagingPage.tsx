import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Conversation, Message } from '../../types';
import { MESSAGES_STORAGE_KEY, MOCK_CONVERSATIONS, SUBSCRIBERS_STORAGE_KEY } from '../../constants';
import { SpinnerIcon, PaperPlaneIcon, MailIcon, PlusIcon, PaperclipIcon, CloseIcon, TrashIcon, ArchiveIcon, UnarchiveIcon, UserPlusIcon } from '../../components/icons/Icons';
import ReactQuill from 'react-quill';
import { useToast } from '../../components/ToastProvider';
import apiService from '../../src/services/api';

const formatConversationTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    const formattedDate = date.toLocaleDateString('fr-FR', dateOptions);
    const formattedTime = date.toLocaleTimeString('fr-FR', timeOptions);

    return `${formattedDate} ${formattedTime}`;
};

// Helper: map API conversation -> UI conversation
const mapConversationListItem = (conv: any): Conversation => {
    const lastMsg = Array.isArray(conv.messages) && conv.messages.length > 0 ? conv.messages[0] : null;
    const lastTs = lastMsg?.createdAt || conv.updatedAt || conv.createdAt || new Date().toISOString();
    const userName = conv.user ? `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() : (conv.userName || 'Utilisateur');
    return {
        id: String(conv.id),
        userId: conv.user?.id ?? conv.userId,
        userName,
        userEmail: conv.user?.email ?? conv.userEmail ?? '',
        subject: conv.subject || '',
        isRead: true, // l'API marque les messages comme lus au fetch détaillé
        isArchived: conv.status === 'closed',
        lastMessageTimestamp: lastTs,
        messages: conv.messages ? conv.messages.map((m: any) => ({
            id: String(m.id),
            sender: m.senderId === (conv.user?.id ?? conv.userId) ? 'user' : 'admin',
            text: m.content,
            timestamp: m.createdAt,
        })) : [],
    } as Conversation;
};

const AdminMessagingPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [viewMode, setViewMode] = useState<'conversation' | 'compose'>('conversation');
    const [composeData, setComposeData] = useState({ to: '', subject: '', content: '' });
    const [attachment, setAttachment] = useState<File | null>(null);
    const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived'>('active');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Charger la liste des conversations via l'API
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const resp = await apiService.listConversations();
                const list = (resp && resp.data) ? resp.data : resp;
                const mapped = Array.isArray(list) ? list.map(mapConversationListItem) : [];
                setConversations(mapped);
                const sorted = [...mapped].filter(c => !c.isArchived).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
                if (sorted.length > 0) {
                    setSelectedConversationId(sorted[0].id);
                }
            } catch (e) {
                console.error('Erreur lors du chargement des conversations', e);
                addToast('Erreur lors du chargement des conversations.', 'error');
                setConversations([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [addToast]);

    const sortedConversations = useMemo(() => {
        const filtered = conversations.filter(c => {
            return archiveFilter === 'active' ? !c.isArchived : c.isArchived;
        });
        return filtered.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
    }, [conversations, archiveFilter]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId) || null;
    }, [conversations, selectedConversationId]);
    
    const handleSelectConversation = useCallback(async (conversationId: string) => {
        setViewMode('conversation');
        setSelectedConversationId(conversationId);
        try {
            const resp = await apiService.getConversation(conversationId);
            const data = (resp && resp.data) ? resp.data : resp;
            const conv = data.conversation || {};
            const messages = data.messages || [];
            const mappedConv = mapConversationListItem(conv);
            mappedConv.isRead = true;
            mappedConv.messages = messages.map((m: any) => ({
                id: String(m.id),
                sender: m.senderId === mappedConv.userId ? 'user' : 'admin',
                text: m.content,
                timestamp: m.createdAt,
            })) as Message[];
            setConversations(prev => prev.map(c => c.id === mappedConv.id ? mappedConv : c));
        } catch (e) {
            console.error('Erreur lors du chargement de la conversation', e);
            addToast('Erreur lors du chargement de la conversation.', 'error');
        }
    }, [addToast]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedConversation || isSending) return;
        setIsSending(true);
        try {
            const resp = await apiService.sendMessage(selectedConversationId as string, { content: replyText });
            const msgData = (resp && resp.data) ? resp.data : resp;
            const newMessage: Message = {
                id: String(msgData.id),
                sender: 'admin',
                text: msgData.content || replyText,
                timestamp: msgData.createdAt || new Date().toISOString(),
            };
            setConversations(prev => prev.map(c => 
                c.id === selectedConversationId ? { ...c, messages: [...(c.messages || []), newMessage], lastMessageTimestamp: newMessage.timestamp } : c
            ));
            addToast('Réponse envoyée.', 'success');
        } catch (e) {
            console.error('Erreur lors de l\'envoi du message', e);
            addToast('Échec de l\'envoi du message.', 'error');
        } finally {
            setReplyText('');
            setAttachment(null);
            setIsSending(false);
        }
    };
    
    const handleSendNewMessage = async () => {
        if (!composeData.subject.trim() || !composeData.content.trim() || isSending) {
            addToast('Veuillez remplir le sujet et le contenu.', 'error');
            return;
        }
        setIsSending(true);
        try {
            const created = await apiService.createConversation({ subject: composeData.subject });
            const createdConv = (created && created.data) ? created.data : created;
            const newConvId = String(createdConv.id);
            await apiService.sendMessage(newConvId, { content: composeData.content });
            const detail = await apiService.getConversation(newConvId);
            const data = (detail && detail.data) ? detail.data : detail;
            const mappedConv = mapConversationListItem(data.conversation || createdConv);
            mappedConv.messages = (data.messages || []).map((m: any) => ({
                id: String(m.id),
                sender: m.senderId === mappedConv.userId ? 'user' : 'admin',
                text: m.content,
                timestamp: m.createdAt,
            })) as Message[];
            setConversations(prev => [mappedConv, ...prev]);
            setComposeData({ to: '', subject: '', content: '' });
            setAttachment(null);
            setIsSending(false);
            setViewMode('conversation');
            setSelectedConversationId(mappedConv.id);
            addToast('Conversation créée et message envoyé.', 'success');
        } catch (e) {
            console.error('Erreur lors de la création d\'une nouvelle conversation', e);
            addToast('Création de conversation disponible uniquement avec le schéma actuel. Pour contacter un utilisateur spécifique, utilisez une conversation existante.', 'info');
            setIsSending(false);
        }
    };

    const handleDeleteConversation = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.")) return;
        try {
            await apiService.deleteConversation(id);
            const updated = conversations.filter(c => c.id !== id);
            setConversations(updated);
            if (selectedConversationId === id) {
                const nextConv = sortedConversations.find(c => c.id !== id);
                setSelectedConversationId(nextConv ? nextConv.id : null);
            }
            addToast('Conversation supprimée.', 'success');
        } catch (e) {
            console.error('Erreur lors de la suppression de la conversation', e);
            addToast('Suppression impossible (permissions insuffisantes ou erreur serveur).', 'error');
        }
    };

    const handleArchiveConversation = async (id: string, archive: boolean) => {
        try {
            await apiService.updateConversation(id, { status: archive ? 'closed' : 'open' });
            const updated = conversations.map(c => c.id === id ? { ...c, isArchived: archive, isRead: true } : c);
            setConversations(updated);
            if (selectedConversationId === id && archive) {
                setSelectedConversationId(null);
            }
            addToast(archive ? 'Conversation archivée.' : 'Conversation désarchivée.', 'success');
        } catch (e) {
            console.error('Erreur lors de la mise à jour du statut de la conversation', e);
            addToast('Échec de la mise à jour du statut.', 'error');
        }
    };

    const handleAddUserToNewsletter = async (email: string, name: string) => {
        try {
            // Validation email basique
            if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                addToast("Email invalide pour l'inscription newsletter.", 'error');
                return;
            }
            const [firstName, ...rest] = (name || '').trim().split(' ');
            const lastName = rest.join(' ');
            await apiService.addSubscriber({ email, firstName, lastName });
            addToast(`${name || email} a été ajouté à la liste de la newsletter.`, 'success');
        } catch (e: any) {
            console.error('Erreur lors de l\'ajout à la newsletter', e);
            const msg = (e?.message || '').toLowerCase();
            if (msg.includes('abonné') || msg.includes('409') || msg.includes('400')) {
                addToast("Cet utilisateur est déjà inscrit à la newsletter.", 'info');
            } else {
                addToast('Ajout à la newsletter impossible.', 'error');
            }
        }
    };

    const handleAttachFileClick = () => attachmentInputRef.current?.click();

    const onAttachmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                addToast('La pièce jointe est trop lourde (max 5 Mo).', 'error');
                return;
            }
            setAttachment(file);
        }
    };
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><SpinnerIcon size="large" className="text-agria-green"/></div>;
    }
    
    const quillModules = { toolbar: [['bold', 'italic', 'underline'], ['link'], [{ 'list': 'ordered'}, { 'list': 'bullet' }]] };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-lg overflow-hidden">
            <input type="file" ref={attachmentInputRef} onChange={onAttachmentFileChange} className="hidden" />
            <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold text-gray-800">Messagerie</h1>
                        <button onClick={() => setViewMode('compose')} className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-1 px-3 rounded-lg text-sm flex items-center gap-1.5" title="Nouveau message">
                            <PlusIcon className="h-4 w-4" /> Nouveau
                        </button>
                    </div>
                    <div className="mt-4 flex border-b">
                        <button onClick={() => setArchiveFilter('active')} className={`py-2 px-4 text-sm font-semibold ${archiveFilter === 'active' ? 'border-b-2 border-agria-green text-agria-green' : 'text-gray-500 hover:bg-gray-100'}`}>
                           Boîte de réception
                        </button>
                        <button onClick={() => setArchiveFilter('archived')} className={`py-2 px-4 text-sm font-semibold ${archiveFilter === 'archived' ? 'border-b-2 border-agria-green text-agria-green' : 'text-gray-500 hover:bg-gray-100'}`}>
                            Archives
                        </button>
                    </div>
                </div>

                <ul className="overflow-y-auto flex-1">
                    {sortedConversations.map(conv => (
                        <li key={conv.id}>
                            <button onClick={() => handleSelectConversation(conv.id)} className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 focus:outline-none ${selectedConversationId === conv.id && viewMode === 'conversation' ? 'bg-agria-green-light' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <p className={`font-bold text-gray-800 ${!conv.isRead ? '' : ''}`}>{conv.userName}</p>
                                    {!conv.isRead && (<span className="w-2.5 h-2.5 bg-agria-green rounded-full mt-1.5 flex-shrink-0"></span>)}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{conv.subject}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatConversationTimestamp(conv.lastMessageTimestamp)}</p>
                            </button>
                        </li>
                    ))}
                    {sortedConversations.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Aucune conversation {archiveFilter === 'archived' ? 'archivée' : 'ici'}.
                        </div>
                    )}
                </ul>
            </div>

            <div className="hidden md:flex w-2/3 flex-col bg-gray-50">
                {viewMode === 'compose' ? (
                     <>
                        <header className="p-4 border-b border-gray-200 bg-white">
                            <h2 className="font-bold text-gray-800 text-lg">Nouveau Message</h2>
                        </header>
                         <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            <input type="email" placeholder="À : email@exemple.com" value={composeData.to} onChange={e => setComposeData(d => ({ ...d, to: e.target.value }))} className="w-full p-2 border-b-2" required />
                            <input type="text" placeholder="Sujet" value={composeData.subject} onChange={e => setComposeData(d => ({ ...d, subject: e.target.value }))} className="w-full p-2 border-b-2 font-semibold" required />
                            <ReactQuill theme="snow" value={composeData.content} onChange={c => setComposeData(d => ({ ...d, content: c }))} modules={quillModules} className="bg-white h-full" />
                         </div>
                         <footer className="p-4 border-t bg-white flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <button type="button" onClick={handleAttachFileClick} className="text-gray-500 hover:text-agria-green p-2" title="Joindre un fichier">
                                    <PaperclipIcon className="h-6 w-6" />
                                </button>
                                {attachment && (<div className="text-sm text-gray-600 flex items-center gap-2 bg-gray-100 p-1.5 rounded-md">
                                    <span className="truncate max-w-[200px]">{attachment.name}</span>
                                    <button onClick={() => setAttachment(null)}><CloseIcon className="h-4 w-4 text-red-500"/></button>
                                </div>)}
                             </div>
                            <button onClick={handleSendNewMessage} className="bg-agria-green text-white py-2 px-6 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50" disabled={isSending}>
                                {isSending ? <SpinnerIcon size="small" /> : <PaperPlaneIcon className="h-5 w-5"/>} Envoyer
                            </button>
                         </footer>
                     </>
                ) : selectedConversation ? (
                    <>
                        <header className="p-4 border-b border-gray-200 bg-white flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-gray-800">{selectedConversation.userName}</h2>
                                <p className="text-sm text-gray-500">{selectedConversation.subject}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => handleAddUserToNewsletter(selectedConversation.userEmail, selectedConversation.userName)} title="Ajouter aux contacts newsletter" className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><UserPlusIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleArchiveConversation(selectedConversation.id, !selectedConversation.isArchived)} title={selectedConversation.isArchived ? "Désarchiver" : "Archiver"} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
                                    {selectedConversation.isArchived ? <UnarchiveIcon className="h-5 w-5" /> : <ArchiveIcon className="h-5 w-5" />}
                                </button>
                                <button onClick={() => handleDeleteConversation(selectedConversation.id)} title="Supprimer" className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </header>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {selectedConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`rounded-2xl py-2 px-4 max-w-[80%] ${msg.sender === 'admin' ? 'bg-agria-green text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`} 
                                         style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', ... (msg.text.includes('<') && msg.text.includes('>') ? {} : {whiteSpace: 'pre-wrap'}) }}
                                         dangerouslySetInnerHTML={{ __html: msg.sender === 'admin' ? msg.text.replace(/<p><br><\/p>/g, '') : msg.text }}>
                                    </div>
                                     <span className="text-xs text-gray-500 flex-shrink-0 pb-1">
                                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <footer className="p-4 border-t bg-white flex flex-col gap-2">
                             <ReactQuill theme="snow" value={replyText} onChange={setReplyText} modules={quillModules} placeholder="Écrire une réponse..."/>
                             <div className="flex justify-between items-center mt-2">
                                 <div className="flex items-center gap-2">
                                    <button type="button" onClick={handleAttachFileClick} className="text-gray-500 hover:text-agria-green p-2" title="Joindre un fichier">
                                        <PaperclipIcon className="h-6 w-6" />
                                    </button>
                                    {attachment && (<div className="text-sm text-gray-600 flex items-center gap-2 bg-gray-100 p-1.5 rounded-md">
                                        <span className="truncate max-w-[200px]">{attachment.name}</span>
                                        <button onClick={() => setAttachment(null)}><CloseIcon className="h-4 w-4 text-red-500"/></button>
                                    </div>)}
                                 </div>
                                <button onClick={handleSendReply} className="bg-agria-green text-white p-2.5 rounded-full hover:bg-agria-green-dark disabled:bg-agria-green/50" disabled={!replyText.trim() || isSending} aria-label="Envoyer le message">
                                    {isSending ? <SpinnerIcon /> : <PaperPlaneIcon className="h-5 w-5"/>}
                                </button>
                             </div>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-400 p-4">
                        <MailIcon className="h-16 w-16 mb-4"/>
                        <h2 className="text-xl font-semibold">Votre messagerie</h2>
                        <p>Sélectionnez une conversation ou créez un nouveau message.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMessagingPage;