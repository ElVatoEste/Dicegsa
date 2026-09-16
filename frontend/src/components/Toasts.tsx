'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  tone: Tone;
  text: string;
}

const STYLE: Record<Tone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-success/25 bg-success-soft text-success' },
  error: { icon: XCircle, className: 'border-danger/25 bg-danger-soft text-danger' },
  warning: { icon: AlertTriangle, className: 'border-warning/25 bg-warning-soft text-warning' },
  info: { icon: Info, className: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
};

/** Un error se lee más despacio que una confirmación, así que dura más en pantalla. */
const DURATION: Record<Tone, number> = { success: 4000, info: 4000, warning: 6000, error: 8000 };

interface ToastApi {
  success: (text: string) => void;
  error: (text: string) => void;
  warning: (text: string) => void;
  info: (text: string) => void;
}

const Context = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(Context);
  if (!api) throw new Error('useToast necesita estar dentro de ToastProvider');
  return api;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((previous) => previous.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => {
    const push = (tone: Tone) => (text: string) => {
      const id = ++nextId.current;
      setToasts((previous) => [...previous, { id, tone, text }]);
    };
    return { success: push('success'), error: push('error'), warning: push('warning'), info: push('info') };
  }, []);

  return (
    <Context.Provider value={api}>
      {children}
      {/*
        Fijo sobre el contenido y sin ocupar espacio del flujo: un error que aparece
        no puede empujar la pantalla ni mover el botón que alguien está por tocar.
      */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </Context.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { icon: Icon, className } = STYLE[toast.tone];

  useEffect(() => {
    const timer = setTimeout(onDismiss, DURATION[toast.tone]);
    return () => clearTimeout(timer);
  }, [toast.tone, onDismiss]);

  return (
    <div
      // Un error interrumpe al lector de pantalla; una confirmación espera su turno.
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'entra pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-indigo-900/10',
        className,
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm">{toast.text}</p>
      <button
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="-mr-1 shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={15} />
      </button>
    </div>
  );
}
