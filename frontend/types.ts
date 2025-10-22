// FIX: Add React import for React.FC type.
import type React from 'react';

export interface MenuItem {
  id: string;
  name: string;
  image?: string;
}

export interface MenuCategory {
  title: 'ENTRÉES' | 'PLATS' | 'LÉGUMES' | 'DESSERTS';
  items: MenuItem[];
}

export type DayOfWeek = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI';

export type WeeklyMenu = {
  [key in DayOfWeek]: MenuCategory[];
};

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  subject: string;
  messages: Message[];
  isRead: boolean;
  lastMessageTimestamp: string;
  isArchived?: boolean;
}

export interface SidebarLink {
  name: string;
  href: string;
  icon: React.FC<any>;
}

export interface FeatureCardData {
  title: string;
  description: string;
  icon: React.FC<any>;
  href: string;
}

export interface ActuItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export type ActivityCategory = 'Menu' | 'Utilisateurs' | 'Messages' | 'Paramètres';

export interface SiteActivity {
  id: string;
  category: ActivityCategory;
  description: string;
  timestamp: Date;
  icon: React.FC<any>;
  user?: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    category: 'boisson' | 'sandwich' | 'dessert' | 'plat';
    imageUrl: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}
export interface AppearanceSettings {
    logo: string;
    backgroundType: 'color' | 'image';
    backgroundValue: string;
    header?: {
        titleText: string;
        backgroundColor: string;
        titleColor: string;
        titleFontFamily: string;
    };
    menu?: {
        backgroundColor: string;
        textColor: string;
        titleColor: string;
        fontSize: string;
        fontFamily: string;
    };
    footer?: {
        logo: string;
        backgroundColor: string;
        textColor: string;
        titleColor: string;
        fontFamily: string;
        descriptionText: string;
        copyrightText: string;
        showLinks: boolean;
        showSocial: boolean;
        showNewsletter: boolean;
    };
}

export interface Slide {
    id: string;
    type: 'image' | 'video' | 'html';
    source: string;
    title: string;
    description: string;
    titleColor: string;
    descriptionColor: string;
    titleFont: string;
    overlayColor: string;
}

export interface SliderSectionSettings {
    titleText: string;
    titleColor: string;
    titleFont: string;
    titleSize: string;
    subtitleText: string;
    subtitleColor: string;
    subtitleFont: string;
    subtitleSize: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}


// --- Restaurant Page Dynamic Content ---
export interface ConceptParagraph {
    id: string;
    text: string;
    image?: string;
    imagePosition?: 'left' | 'right';
}

export interface RestaurantValueCard {
    id: string;
    title: string;
    description: string;
    image?: string;
}

export interface ConceptSectionData {
    id: string;
    type: 'concept';
    title: string;
    paragraphs: ConceptParagraph[];
}

export interface ValuesSectionData {
    id: string;
    type: 'values';
    title: string;
    cards: RestaurantValueCard[];
}

export interface ImageSectionData {
    id: string;
    type: 'image';
    title: string;
    imageUrl: string;
    caption: string;
}

export interface VideoSectionData {
    id: string;
    type: 'video';
    title: string;
    videoUrl: string; 
    caption: string;
}

export type RestaurantSection = ConceptSectionData | ValuesSectionData | ImageSectionData | VideoSectionData;