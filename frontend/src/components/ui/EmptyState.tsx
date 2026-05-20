import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, titulo, descripcion, accion }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium">{titulo}</p>
      {descripcion && <p className="text-sm text-gray-400 mt-1 max-w-xs">{descripcion}</p>}
      {accion && (
        <button onClick={accion.onClick} className="mt-4 btn btn-primary text-sm">
          {accion.label}
        </button>
      )}
    </div>
  );
}
