interface FilterBarProps {
  searchTerm: string; setSearchTerm: (val: string) => void;
  startDate: string; setStartDate: (val: string) => void;
  endDate: string; setEndDate: (val: string) => void;
}

export default function FilterBar({ searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate }: FilterBarProps) {
  return (
    <div className="p-5 bg-[#121214] border-b border-zinc-800/60 flex flex-col lg:flex-row gap-5 items-center justify-between">
      <div className="w-full lg:w-1/3 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-zinc-500 group-focus-within:text-purple-400 transition-colors">⌕</span>
        </div>
        <input 
          type="text" 
          placeholder="Search staff or status..." 
          className="w-full pl-10 pr-4 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
        <div className="flex items-center bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden">
          <span className="text-xs font-bold text-zinc-500 px-4">FROM</span>
          <input 
            type="date" 
            className="px-3 py-2.5 bg-transparent text-zinc-300 text-sm focus:outline-none [color-scheme:dark]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <span className="text-zinc-700 font-bold">-</span>
        <div className="flex items-center bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden">
          <span className="text-xs font-bold text-zinc-500 px-4">TO</span>
          <input 
            type="date" 
            className="px-3 py-2.5 bg-transparent text-zinc-300 text-sm focus:outline-none [color-scheme:dark]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}