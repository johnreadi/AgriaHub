import React, { useState, useEffect } from 'react';
import { FEATURE_CARDS_DATA } from '../constants';
import FeatureCard from '../components/FeatureCard';
import QRCode from 'qrcode';
import ServicesSlider from '../components/ServicesSlider';
import type { SliderSectionSettings } from '../types';
import apiService from '../src/services/api';

interface HomePageProps {
  onRechargeClick: () => void;
}


const DEFAULT_SECTION_SETTINGS: SliderSectionSettings = {
    titleText: 'Nos Services',
    titleColor: '#1f2937', // text-gray-800 from original
    titleFont: "'Playfair Display', serif", // font-serif from original
    titleSize: '2rem', // text-3xl from original, adjusted for better scaling
    subtitleText: 'Découvrez ce que nous pouvons vous offrir.',
    subtitleColor: '#6b7280', // text-gray-500 from original
    subtitleFont: "'Montserrat', sans-serif",
    subtitleSize: '1rem', // text-base
};

// Normalise les paramètres quelle que soit la forme renvoyée (Node: camelCase, PHP: snake_case)
const normalizeSliderSettings = (input: any): SliderSectionSettings => {
    const s = input || {};
    return {
        titleText: s.titleText ?? s.title_text ?? DEFAULT_SECTION_SETTINGS.titleText,
        titleColor: s.titleColor ?? s.title_color ?? DEFAULT_SECTION_SETTINGS.titleColor,
        titleFont: s.titleFont ?? s.title_font ?? DEFAULT_SECTION_SETTINGS.titleFont,
        titleSize: s.titleSize ?? s.title_size ?? DEFAULT_SECTION_SETTINGS.titleSize,
        subtitleText: s.subtitleText ?? s.subtitle_text ?? DEFAULT_SECTION_SETTINGS.subtitleText,
        subtitleColor: s.subtitleColor ?? s.subtitle_color ?? DEFAULT_SECTION_SETTINGS.subtitleColor,
        subtitleFont: s.subtitleFont ?? s.subtitle_font ?? DEFAULT_SECTION_SETTINGS.subtitleFont,
        subtitleSize: s.subtitleSize ?? s.subtitle_size ?? DEFAULT_SECTION_SETTINGS.subtitleSize,
    };
};

// Parse potentiellement une chaîne JSON en objet
const parseMaybeJson = (value: any) => {
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed;
        } catch (_) {
            return value;
        }
    }
    return value;
};

const QRCodeInstall: React.FC = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const appUrl = 'https://app.agriarouen.fr';

    useEffect(() => {
        QRCode.toDataURL(appUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
        .then(url => {
            setQrCodeUrl(url);
        })
        .catch(err => {
            console.error('Failed to generate QR code', err);
        });
    }, [appUrl]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center gap-4">
            {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code pour installer l'application" className="w-24 h-24" />
            ) : (
                <div className="w-24 h-24 bg-gray-200 animate-pulse rounded-md"></div>
            )}
            <div className="max-w-[180px]">
                <h3 className="font-semibold text-gray-800">Accès rapide mobile</h3>
                <p className="text-sm text-gray-500">Scannez pour ajouter l'application sur votre écran d'accueil.</p>
            </div>
        </div>
    );
};


const HomePage: React.FC<HomePageProps> = ({ onRechargeClick }) => {
  const [sliderSettings, setSliderSettings] = useState<SliderSectionSettings>(DEFAULT_SECTION_SETTINGS);

  useEffect(() => {
      const fetchSliderSettings = async () => {
          try {
              const res = await apiService.getSliderSettings();
              let raw: any = null;
              // Node: success/value ou data
              if (res?.value && typeof res.value !== 'undefined') {
                  raw = parseMaybeJson(res.value);
              } else if (res?.data && typeof res.data !== 'undefined') {
                  raw = parseMaybeJson(res.data);
              // SLIM/PHP: la valeur peut être directement sous 'slider' ou 'settings'
              } else if (res?.slider && typeof res.slider !== 'undefined') {
                  raw = parseMaybeJson(res.slider);
              } else if (res?.settings && typeof res.settings !== 'undefined') {
                  raw = parseMaybeJson(res.settings);
              // PHP classique: ok/item.value ou ok/items (liste de settings)
              } else if (res?.ok && res?.item?.value && typeof res.item.value !== 'undefined') {
                  raw = parseMaybeJson(res.item.value);
              } else if (res?.ok && Array.isArray(res.items)) {
                  const found = res.items.find((it: any) => it?.key === 'slider-section-settings' || it?.key === 'slider_section_settings');
                  if (found && typeof found.value !== 'undefined') {
                      raw = parseMaybeJson(found.value);
                  } else if (res.items[0]?.value !== undefined) {
                      raw = parseMaybeJson(res.items[0].value);
                  }
              // Fallback: l'objet renvoyé est directement les settings
              } else if (res && typeof res === 'object' && !Array.isArray(res)) {
                  raw = res;
              }

              if (raw) {
                  const mapped: SliderSectionSettings = normalizeSliderSettings(raw);
                  setSliderSettings(prev => ({ ...prev, ...mapped }));
              }
          } catch (e) {
              console.error('Failed to fetch slider section settings', e);
          }
      };
      fetchSliderSettings();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
        e.preventDefault();
        window.location.hash = href;
    }
  };

  return (
    <div className="w-full">
      <div className="text-center md:text-left mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Bienvenue au restaurant AGRIA ROUEN</h1>
        <p className="mt-2 text-lg text-gray-500">Votre restaurant administratif de référence</p>
      </div>

      <div className="flex justify-center md:justify-between items-center mb-12 flex-wrap gap-y-6">
        <div className="flex items-center space-x-4">
          <a
            href="#menu"
            onClick={(e) => handleNavClick(e, "#menu")}
            className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold px-6 py-3 rounded-md transition-colors shadow-sm"
          >
            Consulter le menu
          </a>
          <a
            href="#manger"
            onClick={(e) => handleNavClick(e, '#manger')}
            className="bg-transparent hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-md border border-gray-300 transition-colors shadow-sm"
          >
            Demander l'accès
          </a>
        </div>
        <div className="hidden md:block">
            <QRCodeInstall />
        </div>
      </div>

      <hr className="my-12 border-gray-200" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURE_CARDS_DATA.map((card) => (
          <FeatureCard key={card.title} {...card} onRechargeClick={card.href === '#recharge' ? onRechargeClick : undefined} />
        ))}
      </div>

      <hr className="my-16 border-gray-200" />

      <div className="mb-12 bg-white p-6 rounded-lg shadow-lg border border-gray-200 relative z-0">
        <h2 
            className="text-3xl font-bold text-center font-serif mb-2"
            style={{
                color: sliderSettings.titleColor,
                fontFamily: sliderSettings.titleFont,
                fontSize: sliderSettings.titleSize,
            }}
        >
            {sliderSettings.titleText}
        </h2>
        <p 
            className="text-center text-gray-500 mb-8"
            style={{
                color: sliderSettings.subtitleColor,
                fontFamily: sliderSettings.subtitleFont,
                fontSize: sliderSettings.subtitleSize,
            }}
        >
            {sliderSettings.subtitleText}
        </p>
        <ServicesSlider />
      </div>
    </div>
  );
};

export default HomePage;