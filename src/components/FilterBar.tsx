import { Search, Calendar, X } from 'lucide-react';

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

  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = getTodayString();
    
    if (selectedDate > today) {
      alert("⚠️ Invalid Date!\n\nYou cannot select a future date. Please choose a date that is today or earlier");
      return;
    }
    setStartDate(selectedDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = getTodayString();
    
    if (selectedDate > today) {
      alert("⚠️ Invalid Date!\n\nYou cannot select a future date. Please choose a date that is today or earlier");
      return;
    }
    setEndDate(selectedDate);
  };

  return (
    <div className="p-5 bg-[#121214] border-b border-zinc-800/60 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
      
      <div className="w-full xl:w-1/3 relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search staff or status..." 
          className="w-full pl-11 pr-4 py-2.5 bg-[#09090b] border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          
          <div className="flex items-center bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden w-full sm:w-auto relative group focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500 transition-all">
            <span className="text-xs font-bold text-zinc-500 px-4 w-16 text-center shrink-0">FROM</span>
            <input 
              type="date"
              max={getTodayString()}
              className="flex-1 px-3 py-2.5 pr-10 bg-transparent text-zinc-300 text-sm focus:outline-none [color-scheme:dark] w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-10"
              value={startDate}
              onChange={handleStartDateChange}
            />
            <Calendar className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-purple-400 transition-colors z-0" />
          </div>
          
          <span className="hidden sm:block text-zinc-700 font-bold">-</span>
          
          <div className="flex items-center bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden w-full sm:w-auto relative group focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500 transition-all">
            <span className="text-xs font-bold text-zinc-500 px-4 w-16 text-center shrink-0">TO</span>
            <input 
              type="date"
              max={getTodayString()}
              className="flex-1 px-3 py-2.5 pr-10 bg-transparent text-zinc-300 text-sm focus:outline-none [color-scheme:dark] w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-10"
              value={endDate}
              onChange={handleEndDateChange}
            />
            <Calendar className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-purple-400 transition-colors z-0" />
          </div>

        </div>

        {hasFilter && (
          <button 
            onClick={clearAllFilters}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0"
          >
            <X className="w-4 h-4 stroke-[3]" /> 
            <span>Clear</span>
          </button>
        )}

      </div>
    </div>
  );
}