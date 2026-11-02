import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  headerActions, 
  children, 
  footer, 
  widthClass = 'w-full max-w-md' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vsph-navy/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-lg border border-slate-200 ${widthClass} max-h-[90vh] flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 rounded-t-lg shrink-0">
          <h2 className="text-vsph-navy text-lg font-semibold tracking-tight">{title}</h2>
          <div className="flex items-center gap-3">
            {headerActions}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-vsph-navy hover:bg-vsph-grey rounded transition-colors bg-white border border-slate-200 shadow-sm shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-0 overflow-y-auto flex-1 bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-vsph-grey rounded-b-lg z-10 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
