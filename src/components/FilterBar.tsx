interface FilterBarProps {
  searchTerm: string; setSearchTerm: (val: string) => void;
  startDate: string; setStartDate: (val: string) => void;
  endDate: string; setEndDate: (val: string) => void;
}

export default function FilterBar({ searchTerm, setSearchTerm, startDate, setStartDate, endDate, setEndDate }: FilterBarProps) {
  const hasFilter = searchTerm !== '' || startDate !== '' || endDate !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-5 bg-[#121214] border-b border-zinc-800/60 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
      
      <div className="w-full xl:w-1/3 relative group">
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
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden w-full sm:w-auto">
            <span className="text-xs font-bold text-zinc-500 px-4 w-16 text-center shrink-0">FROM</span>
            <input 
              type="date" 
              className="flex-1 px-3 py-2.5 bg-transparent text-zinc-300 text-sm focus:outline-none [color-scheme:dark] w-full sm:w-auto"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <span className="hidden sm:block text-zinc-700 font-bold">-</span>
          
          <div className="flex items-center bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden w-full sm:w-auto">
            <span className="text-xs font-bold text-zinc-500 px-4 w-16 text-center shrink-0">TO</span>
            <input 
              type="date" 
              className="flex-1 px-3 py-2.5 bg-transparent text-zinc-300 text-sm focus:outline-none [color-scheme:dark] w-full sm:w-auto"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {hasFilter && (
          <button 
            onClick={clearAllFilters}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0"
          >
            <span>✕</span> Clear
          </button>
        )}

      </div>
    </div>
  );
}