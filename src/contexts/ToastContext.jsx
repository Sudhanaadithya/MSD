import React, { createContext, useState, useContext } from 'react';

export const ToastContext = createContext({});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Floating Action Notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-sm max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-md rounded-lg shadow-xl border flex items-start gap-sm animate-bounce-in transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-500/30'
                : toast.type === 'error'
                ? 'bg-red-950 text-red-100 border-red-500/30'
                : toast.type === 'warning'
                ? 'bg-amber-950 text-amber-100 border-amber-500/30'
                : 'bg-surface-container-high text-on-surface border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined text-xl mt-0.5">
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'error'
                ? 'error'
                : toast.type === 'warning'
                ? 'warning'
                : 'info'}
            </span>
            <div className="flex-1">
              {toast.title && <h4 className="font-label-bold text-xs uppercase tracking-wider mb-0.5">{toast.title}</h4>}
              <p className="font-body-sm text-xs leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
