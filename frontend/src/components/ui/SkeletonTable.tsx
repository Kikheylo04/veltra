interface Props {
  rows?: number;
  cols?: number;
}

export default function SkeletonTable({ rows = 6, cols = 5 }: Props) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`h-4 bg-gray-200 rounded ${j === 0 ? 'w-8' : j === cols - 1 ? 'w-16' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
