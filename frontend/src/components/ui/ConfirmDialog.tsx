import { AlertTriangle } from 'lucide-react';

interface Props {
  mensaje: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

export default function ConfirmDialog({ mensaje, onConfirm, onCancel, loading, danger = true }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <AlertTriangle size={22} className={danger ? 'text-red-600' : 'text-yellow-600'} />
        </div>
        <p className="text-center text-gray-800 font-medium mb-6">{mensaje}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-secondary flex-1">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 btn ${danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'} font-medium px-4 py-2 rounded-lg transition-colors`}
          >
            {loading ? 'Eliminando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
