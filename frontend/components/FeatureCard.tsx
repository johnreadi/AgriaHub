import React from 'react';
import type { FeatureCardData } from '../types';

interface FeatureCardProps extends FeatureCardData {
  onRechargeClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, href, onRechargeClick }) => {
  const iconColorClass = title === 'Nous contacter' ? 'text-red-500' : 'text-gray-500';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onRechargeClick) {
        e.preventDefault();
        onRechargeClick();
    } else if (href.startsWith('#')) {
        e.preventDefault();
        window.location.hash = href;
    }
  };

  return (
    <a href={href} onClick={handleClick} className="block group">
      <div className="bg-white p-6 rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 border border-gray-200/80 group-hover:border-agria-green/50 text-center h-full transform group-hover:-translate-y-1">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 group-hover:bg-agria-green-light p-4 rounded-full transition-colors duration-300">
            <Icon className={`h-10 w-10 ${iconColorClass} transition-colors duration-300 group-hover:text-agria-green-dark`} />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </a>
  );
};

export default FeatureCard;
