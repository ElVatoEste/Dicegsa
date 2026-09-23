'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Field';

/**
 * Campo de contraseña con botón para verla. En una computadora compartida y con
 * contraseñas que llegan en un papel, poder revisar lo tipeado evita intentos
 * fallidos que terminan bloqueando la cuenta.
 */
export function PasswordInput(props: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1 my-auto grid size-9 place-items-center rounded-md text-muted transition-[color,background-color,transform] duration-150 hover:bg-brand-50 hover:text-ink active:scale-90"
      >
        {visible ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
      </button>
    </div>
  );
}
