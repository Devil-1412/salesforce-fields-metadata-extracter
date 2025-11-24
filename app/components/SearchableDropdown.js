"use client";

import { useState, useEffect, useRef } from "react";

export default function SearchableDropdown({
    options = [],
    value,
    onChange,
    multiple = false,
    placeholder = "Select...",
    label = "",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options based on search term
    const filteredOptions = options.filter((option) =>
        (option.label || option.value || option).toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue) => {
        if (multiple) {
            const newValue = value.includes(optionValue)
                ? value.filter((v) => v !== optionValue)
                : [...value, optionValue];
            onChange(newValue);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const getDisplayValue = () => {
        if (!value || (Array.isArray(value) && value.length === 0)) return placeholder;

        if (multiple) {
            return `${value.length} selected`;
        }

        const selectedOption = options.find((opt) => (opt.value || opt) === value);
        return selectedOption ? (selectedOption.label || selectedOption.value || selectedOption) : value;
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            {/* Dropdown Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
            >
                <span className={`block truncate ${!value || (Array.isArray(value) && value.length === 0) ? 'text-gray-400' : 'text-gray-900'}`}>
                    {getDisplayValue()}
                </span>
                <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {/* Search Input */}
                    <div className="sticky top-0 z-10 bg-white px-2 py-2 border-b border-gray-100">
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Options List */}
                    <ul className="py-1">
                        {filteredOptions.length === 0 ? (
                            <li className="text-gray-500 cursor-default select-none relative py-2 pl-3 pr-9 text-center">
                                No results found
                            </li>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const optionValue = option.value || option;
                                const optionLabel = option.label || option.value || option;
                                const isSelected = multiple
                                    ? value.includes(optionValue)
                                    : value === optionValue;

                                return (
                                    <li
                                        key={index}
                                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors ${isSelected ? "bg-blue-50 text-blue-900" : "text-gray-900"
                                            }`}
                                        onClick={() => handleSelect(optionValue)}
                                    >
                                        <div className="flex items-center">
                                            {multiple && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                                                />
                                            )}
                                            <span className={`block truncate ${isSelected ? "font-semibold" : "font-normal"}`}>
                                                {optionLabel}
                                            </span>
                                        </div>

                                        {!multiple && isSelected && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
