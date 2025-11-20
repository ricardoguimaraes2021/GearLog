import { ReactNode, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  animationType?: 'fade' | 'slide' | 'slideUp';
}

export default function PageTransition({ children, animationType = 'fade' }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        // Small delay before fade in
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
        prevLocationRef.current = location.pathname;
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    switch (animationType) {
      case 'slide':
        return `${baseClasses} ${isAnimating ? '-translate-x-4 opacity-0' : 'translate-x-0 opacity-100'}`;
      case 'slideUp':
        return `${baseClasses} ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`;
      case 'fade':
      default:
        return `${baseClasses} ${isAnimating ? 'opacity-0' : 'opacity-100'}`;
    }
  };

  return (
    <div className={getAnimationClasses()} style={{ minHeight: 'inherit' }}>
      {displayChildren}
    </div>
  );
}

