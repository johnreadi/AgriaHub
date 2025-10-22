

import type { SidebarLink, FeatureCardData, Conversation, ActuItem } from './types';
import {
  HomeIcon,
  RestaurantIcon,
  CreditCardIcon,
  PencilIcon,
  ClipboardListIcon,
  InfoIcon,
  ScaleIcon,
  PhoneIcon,
  PlateWithCutleryIcon,
  RedPhoneIcon,
  DashboardIcon,
  UsersIcon,
  SettingsIcon,
  MailIcon,
  SendIcon,
  SliderIcon,
} from './components/icons/Icons';
import React from 'react';

export const SIDEBAR_LINKS: SidebarLink[] = [
  { name: 'Accueil', href: '#', icon: HomeIcon },
  { name: 'Mon restaurant', href: '#restaurant', icon: RestaurantIcon },
  { name: 'Je recharge ma carte', href: '#recharge', icon: CreditCardIcon },
  { name: 'Je souhaite manger à l\'AGRIA', href: '#manger', icon: PencilIcon },
  { name: 'Je consulte le menu', href: '#menu', icon: ClipboardListIcon },
  { name: 'Infos utiles', href: '#info', icon: InfoIcon },
  { name: 'Prestations traiteur', href: '#traiteur', icon: ScaleIcon },
  { name: 'Je contacte mon resto', href: '#contact', icon: PhoneIcon },
];

export const ADMIN_SIDEBAR_LINKS: SidebarLink[] = [
  { name: 'Tableau de bord', href: '#admin/dashboard', icon: DashboardIcon },
  { name: 'Mon Restaurant', href: '#admin/restaurant', icon: RestaurantIcon },
  { name: 'Messagerie', href: '#admin/messagerie', icon: MailIcon },
  { name: 'Newsletter', href: '#admin/newsletter', icon: SendIcon },
  { name: 'Gestion du Menu', href: '#admin/menu', icon: ClipboardListIcon },
  { name: 'Utilisateurs', href: '#admin/users', icon: UsersIcon },
  { name: 'Infos Utiles', href: '#admin/info', icon: InfoIcon },
  { name: 'Prestations Traiteur', href: '#admin/traiteur', icon: ScaleIcon },
  { name: 'Paramètres', href: '#admin/settings', icon: SettingsIcon },
  { name: 'Slider', href: '#admin/slider', icon: SliderIcon },
];

export const NAV_LINKS: { name: string, href: string }[] = [
    { name: 'Accueil', href: '#'},
    { name: 'Menu', href: '#menu' },
    { name: 'Contact', href: '#contact' },
    { name: 'Prestations traiteur', href: '#traiteur' },
];

export const BOTTOM_NAV_LINKS: SidebarLink[] = [
    { name: 'Accueil', href: '#', icon: HomeIcon },
    { name: 'Restaurant', href: '#restaurant', icon: RestaurantIcon },
    { name: 'Menu', href: '#menu', icon: ClipboardListIcon },
    { name: 'Contact', href: '#contact', icon: PhoneIcon },
];

export const VALUES_DATA: { title: string; description: string; icon: React.ReactNode }[] = [
  {
    title: 'Partenariat',
    description: 'Collaboration avec des producteurs locaux pour des produits de qualité.',
    icon: React.createElement(ScaleIcon, { className: "h-10 w-10" }),
  },
  {
    title: 'Savoir-faire',
    description: 'Équipe de cuisiniers passionnés proposant des recettes savoureuses.',
    icon: React.createElement(PencilIcon, { className: "h-10 w-10" }),
  },
];

export const FEATURE_CARDS_DATA: FeatureCardData[] = [
  {
    title: 'Menu du jour',
    description: 'Découvrez nos plats du jour et spécialités',
    icon: ClipboardListIcon,
    href: '#menu',
  },
  {
    title: 'Service traiteur',
    description: 'Organisez vos événements professionnels',
    icon: PlateWithCutleryIcon,
    href: '#traiteur',
  },
  {
    title: 'Recharger ma carte',
    description: 'Gérez facilement le solde de votre carte',
    icon: CreditCardIcon,
    href: '#recharge',
  },
   {
    title: 'Notre restaurant',
    description: 'Découvrez notre concept, notre équipe et nos valeurs.',
    icon: RestaurantIcon,
    href: '#restaurant',
  },
  {
    title: 'Nous contacter',
    description: 'Une question ? Contactez notre équipe',
    icon: RedPhoneIcon,
    href: '#contact',
  },
];

export const RESTAURANT_CONTEXT_FOR_AI = `
Informations sur le restaurant Agria Rouen:
- Nom: Agria Rouen
- Type: Restaurant Administratif Inter-Entreprises
- Adresse: 2 Rue Saint-Sever, 76100 Rouen
- Téléphone: 02 32 18 97 80
- Email: secretariatagria@free.fr
- Horaires d'ouverture: **Lundi - Vendredi** de 11h20 à 13h30. Fermé le Samedi et Dimanche.
- Valeurs:
  - Partenariat: Collaboration avec des producteurs locaux pour des produits de qualité, dans le respect de la loi EGALIM.
  - Savoir-faire: Équipe de cuisiniers passionnés proposant des recettes savoureuses.
- Menu: Le menu change chaque semaine. Il est géré via un espace d'administration. Il est disponible sur la section 'MENU' du site. Inutile de donner des exemples de plats, invitez plutôt l'utilisateur à consulter la page.
- Mission: Offrir une pause déjeuner gourmande et équilibrée dans une ambiance conviviale et chaleureuse.
`;

export const MESSAGES_STORAGE_KEY = 'agria-messages';
export const SUBSCRIBERS_STORAGE_KEY = 'agria-newsletter-subscribers';

export const INITIAL_ACTU_DATA: ActuItem[] = [
  {
    id: 'actu-1',
    title: 'Bienvenue sur le nouveau site de l\'AGRIA !',
    date: '15 octobre 2024',
    content: 'Nous sommes ravis de vous présenter notre nouveau site web. Explorez les nouvelles fonctionnalités, consultez le menu et rechargez votre carte en toute simplicité.'
  },
  {
    id: 'actu-2',
    title: 'Semaine spéciale produits locaux',
    date: '12 octobre 2024',
    content: 'Toute cette semaine, notre chef met à l\'honneur les produits de nos partenaires locaux. Venez déguster des plats authentiques et savoureux !'
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv-1',
        userId: 2,
        userName: 'Bob Dubois',
        userEmail: 'bob.dubois@example.com',
        subject: 'Question sur l\'accès',
        isRead: true,
        isArchived: false,
        lastMessageTimestamp: '2024-05-20T10:30:00Z',
        messages: [
            { id: 'msg-1-1', sender: 'user', text: 'Bonjour, j\'ai fait une demande d\'accès hier et je n\'ai pas encore de retour. Pouvez-vous vérifier ? Cordialement, Bob.', timestamp: '2024-05-20T10:30:00Z' },
            { id: 'msg-1-2', sender: 'admin', text: 'Bonjour Bob, nous avons bien reçu votre demande. Elle est en cours de validation, vous recevrez un email de confirmation très bientôt.', timestamp: '2024-05-20T11:00:00Z' },
        ]
    },
    {
        id: 'conv-2',
        userId: 6,
        userName: 'Fiona Garcia',
        userEmail: 'fiona.garcia@example.com',
        subject: 'Demande de devis traiteur',
        isRead: false,
        isArchived: false,
        lastMessageTimestamp: '2024-05-21T14:00:00Z',
        messages: [
            { id: 'msg-2-1', sender: 'user', text: 'Bonjour, je souhaiterais obtenir un devis pour un cocktail dînatoire pour 30 personnes pour le 15 juin prochain. Merci de me recontacter. Fiona Garcia.', timestamp: '2024-05-21T14:00:00Z' },
        ]
    },
    {
        id: 'conv-3',
        userId: 1,
        userName: 'Alice Martin',
        userEmail: 'alice.martin@example.com',
        subject: 'Allergènes dans le menu de mardi',
        isRead: true,
        isArchived: false,
        lastMessageTimestamp: '2024-05-21T09:15:00Z',
        messages: [
            { id: 'msg-3-1', sender: 'user', text: 'Bonjour, le plat de poisson de mardi contient-il des produits laitiers ? Je suis intolérante au lactose. Merci !', timestamp: '2024-05-21T09:15:00Z' },
        ]
    }
];