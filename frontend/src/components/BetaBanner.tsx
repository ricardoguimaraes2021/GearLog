import { useState } from 'react';
import { X } from 'lucide-react';

export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has dismissed the banner before
    return localStorage.getItem('betaBannerDismissed') !== 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('betaBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
            BETA
          </span>
          <p className="text-sm md:text-base">
            <strong>GearLog is in Beta.</strong> Uploaded images and files may not be stored permanently due to testing environment limitations.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          aria-label="Close banner"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
