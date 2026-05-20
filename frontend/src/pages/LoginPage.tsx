import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Wrench } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';

interface FormData { email: string; password: string; }

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      login(res.data.token, res.data.usuario);
      navigate('/dashboard');
    } catch {
      toast.error('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Wrench size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-widest">VELTRA</h1>
          <p className="text-gray-400 mt-2">Sistema de Gestión · Taller Mecánico</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              {...register('email', { required: true })}
              className="input"
              placeholder="admin@taller.com"
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              {...register('password', { required: true })}
              className="input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
