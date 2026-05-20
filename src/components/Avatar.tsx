import { useState } from 'react';

interface AvatarProps {
  name: string;
  userId: string;
  className?: string;
}

export default function Avatar({ name, userId, className = "w-8 h-8" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (!userId || imgError) {
    return (
      <div className={`${className} rounded-full bg-purple-500/15 flex items-center justify-center text-[11px] font-bold text-purple-400 shrink-0`}>
        {name.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={`/api/get-avatar?userId=${userId}`} 
      alt={name}
      onError={() => setImgError(true)}
      className={`${className} rounded-full object-cover shrink-0 ring-1 ring-zinc-800`}
    />
  );
}