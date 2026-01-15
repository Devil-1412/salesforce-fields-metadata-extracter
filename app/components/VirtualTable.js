"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * Virtualized table component using @tanstack/react-virtual
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array of { key, label, width (percent ex: 20%) }
 * @param {Array} props.data - Array of data objects
 * @param {Function} props.renderRow - Optional custom row renderer (unused here but kept for API compat if needed)
 * @param {number} props.itemSize - Estimated height of each row in px (default 50)
 */
export default function VirtualTable({
  columns,
  data,
  itemSize = 50,
  rowClassName = "border-b border-gray-100 hover:bg-blue-50/50 transition-colors",
  emptyMessage = "No data available",
  className = ""
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: data ? data.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
    overscan: 5,
  });

  if (!data || data.length === 0) {
    return (
        <div className={`flex flex-col w-full bg-white rounded-xl shadow-lg border border-gray-200 h-full overflow-hidden ${className}`}>
             <table className="min-w-full text-sm text-left relative border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md sticky top-0 z-10 block">
                  <tr className="flex w-full">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-3 whitespace-nowrap first:pl-6 last:pr-6 flex-shrink-0"
                        style={{ width: col.width }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
             </table>
             <div className="flex flex-col items-center justify-center flex-1 p-10 text-gray-500">
                <p>{emptyMessage}</p>
             </div>
        </div>
    );
  }

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  
  const paddingTop = items.length > 0 ? items[0].start : 0;
  const paddingBottom = items.length > 0 ? totalSize - items[items.length - 1].end : 0;

  return (
    <div 
        ref={parentRef}
        className={`flex flex-col w-full bg-white rounded-xl shadow-lg border border-gray-200 h-full overflow-auto ${className}`}
    >
      <table className="min-w-full text-sm text-left relative border-collapse">
        <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md sticky top-0 z-10 block">
          <tr className="flex w-full">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 whitespace-nowrap first:pl-6 last:pr-6 flex-shrink-0"
                style={{ width: col.width }}
              >
                {col.headerRender ? col.headerRender() : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody 
            className="block w-full"
            style={{ 
                height: `${totalSize}px`,
                position: 'relative' 
            }}
        >
          {items.map((virtualRow) => {
             const item = data[virtualRow.index];
             return (
              <tr 
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={`flex w-full absolute top-0 left-0 ${rowClassName}`}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((col) => (
                  <td 
                    key={col.key} 
                    className="px-6 py-3 whitespace-normal break-words text-gray-700 first:pl-6 last:pr-6 flex-shrink-0 align-top"
                    style={{ width: col.width }}
                  >
                    {col.render 
                      ? col.render(item, virtualRow.index)
                      : (item[col.key] !== undefined
                          ? Array.isArray(item[col.key])
                            ? item[col.key].join(", ")
                            : String(item[col.key])
                          : "—")
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-center text-gray-500 z-10 w-full">
        Showing {data.length} items
      </div>
    </div>
  );
}
