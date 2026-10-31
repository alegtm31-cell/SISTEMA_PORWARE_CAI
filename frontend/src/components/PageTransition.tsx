import React from 'react';

interface PageTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

/**
 * PageTransition: Envoltorio que añade una animación fluida de entrada
 * (opacidad + desplazamiento de 10px hacia arriba en 240ms) cada vez que cambia 'viewKey'.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ viewKey, children }) => {
  return (
    <div key={viewKey} className="view-enter" style={{ width: '100%', minWidth: 0 }}>
      {children}
    </div>
  );
};
