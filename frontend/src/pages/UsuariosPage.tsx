import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { UserCog, Plus, KeyRound, X } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/auth.store';

interface UsuarioForm {
  nombre: string;
  email: string;
  password?: string;
  rol: string;
}

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { usuario: me } = useAuthStore();
  const [modal, setModal] = useState<'crear' | { id: number; nombre: string } | null>(null);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UsuarioForm>();
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd } = useForm<{ password: string }>();

  const crear = useMutation({
    mutationFn: (data: UsuarioForm) => api.post('/usuarios', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario creado'); closeModal(); },
    onError: () => toast.error('Error al crear usuario'),
  });

  const resetPass = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.patch(`/usuarios/${id}/password`, { password }),
    onSuccess: () => { toast.success('Contraseña actualizada'); closeModal(); },
    onError: () => toast.error('Error al cambiar contraseña'),
  });

  const closeModal = () => { setModal(null); reset(); resetPwd(); };

  const ROL_COLORS: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    RECEPCIONISTA: 'bg-blue-100 text-blue-700',
    MECANICO: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCog size={24} className="text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        </div>
        <button onClick={() => { reset({ rol: 'RECEPCIONISTA' }); setModal('crear'); }} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(usuarios as any[]).map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.nombre}
                    {u.id === (me as any)?.id && <span className="ml-2 text-xs text-gray-400">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROL_COLORS[u.rol] || 'bg-gray-100 text-gray-600'}`}>{u.rol}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { resetPwd(); setModal({ id: u.id, nombre: u.nombre }); }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <KeyRound size={13} /> Cambiar contraseña
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear usuario */}
      {modal === 'crear' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">Nuevo usuario</h2>
              <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit((d) => crear.mutate(d))} className="p-5 space-y-4">
              <div>
                <label className="label">Nombre</label>
                <input className="input" {...register('nombre', { required: true })} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" {...register('email', { required: true })} />
                {errors.email && <p className="text-red-500 text-xs mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">Contraseña inicial</label>
                <input className="input" type="password" {...register('password', { required: true, minLength: 6 })} />
                {errors.password && <p className="text-red-500 text-xs mt-1">Mínimo 6 caracteres</p>}
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" {...register('rol', { required: true })}>
                  <option value="RECEPCIONISTA">Recepcionista</option>
                  <option value="MECANICO">Mecánico</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={crear.isPending} className="btn btn-primary flex-1">
                  {crear.isPending ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {modal !== null && modal !== 'crear' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">Cambiar contraseña — {(modal as any).nombre}</h2>
              <button onClick={closeModal}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handlePwd(({ password }) => resetPass.mutate({ id: (modal as any).id, password }))} className="p-5 space-y-4">
              <div>
                <label className="label">Nueva contraseña</label>
                <input className="input" type="password" {...regPwd('password', { required: true, minLength: 6 })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={resetPass.isPending} className="btn btn-primary flex-1">
                  {resetPass.isPending ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
