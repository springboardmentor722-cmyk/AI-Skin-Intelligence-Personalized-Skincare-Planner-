import { createContext, useCallback, useContext, useState } from "react";
import { TbCircleCheck, TbAlertCircle } from "react-icons/tb";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass px-4 py-3 flex items-center gap-2 min-w-[240px] animate-in ${
              t.type === "error" ? "text-danger-500" : "text-sage-600"
            }`}
          >
            {t.type === "error" ? <TbAlertCircle /> : <TbCircleCheck />}
            <span className="text-sm text-ink-primary">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
