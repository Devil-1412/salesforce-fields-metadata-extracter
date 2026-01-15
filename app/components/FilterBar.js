"use client";

import { Search } from "lucide-react";

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 sm:text-sm"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* additional filters */}
      <div className="flex items-center gap-3 w-full md:w-auto flex-wrap overflow-visible px-1">
        {children}
      </div>
    </div>
  );
}
