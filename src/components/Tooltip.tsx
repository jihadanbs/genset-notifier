import type { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative flex items-center group/tooltip">
      {children}
      <div className="absolute right-8 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
        <div className="bg-zinc-800 text-zinc-200 text-[10px] font-semibold tracking-wide px-2 py-1 rounded-md shadow-lg border border-zinc-700">
          {content}
        </div>
      </div>
    </div>
  );
}