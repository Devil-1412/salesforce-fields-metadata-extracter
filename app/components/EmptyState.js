"use client";

import { FolderSearch } from "lucide-react";

export default function EmptyState({
  title = "No items found",
  description = "Try adjusting your search or filters to find what you're looking for.",
  icon: Icon = FolderSearch,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-dashed border-gray-300 rounded-xl">
      <div className="bg-blue-50 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}
