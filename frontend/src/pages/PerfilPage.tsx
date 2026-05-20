import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { User, KeyRound } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/auth.store';

export default function PerfilPage() {
  const { usuario } = useAuthStore();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<{
    passwordActual: string;
    passwordNueva: string;
    confirmar: string;
  }>();

  const cambiar = useMutation({
    mutationFn: (d: { passwordActual: string; passwordNueva: string }) =>
      api.patch('/usuarios/me/password', d),
    onSuccess: () => { toast.success('Contraseña actualizada'); reset(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Error'),
  });

  const ROL_LABEL: Record<string, string> = {
    ADMIN: 'Administrador', RECEPCIONISTA: 'Recepcionista', MECANICO: 'Mecánico',
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <User size={24} className="text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      </div>

      {/* Info */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {usuario?.nombre[0]}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{usuario?.nombre}</p>
            <p className="text-sm text-gray-500">{(usuario as any)?.email}</p>
            <span className="badge bg-blue-100 text-blue-700 mt-1">{ROL_LABEL[(usuario as any)?.rol] || (usuario as any)?.rol}</span>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <KeyRound size={16} /> Cambiar contraseña
        </h2>
        <form onSubmit={handleSubmit(({ passwordActual, passwordNueva }) => cambiar.mutate({ passwordActual, passwordNueva }))} className="space-y-4">
          <div>
            <label className="label">Contraseña actual</label>
            <input type="password" className="input" {...register('passwordActual', { required: true })} />
          </div>
          <div>
            <label className="label">Nueva contraseña</label>
            <input type="password" className="input" {...register('passwordNueva', { required: true, minLength: 6 })} />
            {errors.passwordNueva && <p className="text-red-500 text-xs mt-1">Mínimo 6 caracteres</p>}
          </div>
          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input type="password" className="input" {...register('confirmar', {
              required: true,
              validate: v => v === watch('passwordNueva') || 'Las contraseñas no coinciden',
            })} />
            {errors.confirmar && <p className="text-red-500 text-xs mt-1">{errors.confirmar.message}</p>}
          </div>
          <button type="submit" disabled={cambiar.isPending} className="btn btn-primary w-full">
            {cambiar.isPending ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
