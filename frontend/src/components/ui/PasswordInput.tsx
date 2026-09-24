'use client';

import { useState } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from './Field';

/**
 * Campo de contraseña con botón para verla. En una computadora compartida y con
 * contraseñas que llegan en un papel, poder revisar lo tipeado evita intentos
 * fallidos que terminan bloqueando la cuenta.
 */
export function PasswordInput({
  icon,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'> & { icon?: LucideIcon }) {
  const [visible, setVisible] = useState(false);
  return (
    <IconSlot icon={icon}>
      <Input {...props} type={visible ? 'text' : 'password'} className={cn('pr-12', icon && 'pl-11', className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-md text-muted transition-[color,background-color,transform] duration-150 hover:bg-brand-50 hover:text-ink active:scale-90"
      >
        {visible ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
      </button>
    </IconSlot>
  );
}

/** Campo de texto con un ícono a la izquierda que dice qué se espera sin leer la etiqueta. */
export function IconInput({ icon, className, ...props }: React.ComponentProps<typeof Input> & { icon: LucideIcon }) {
  return (
    <IconSlot icon={icon}>
      <Input {...props} className={cn('pl-11', className)} />
    </IconSlot>
  );
}

function IconSlot({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="group relative">
      {Icon && (
        <Icon
          size={17}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors duration-150 group-focus-within:text-brand-600"
        />
      )}
      {children}
    </div>
  );
}
