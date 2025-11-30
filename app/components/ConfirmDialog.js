import React from 'react';

export default function ConfirmDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonClass = "bg-red-600 hover:bg-red-700"
}) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    {/* Warning Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-6 w-6 text-red-600" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

