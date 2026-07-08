import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  onCreate?: (inputValue: string) => void;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  onCreate,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = options.find(
    (opt) => opt.name.toLowerCase() === search.toLowerCase().trim()
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full bg-surface-container-lowest border ${
          isOpen ? 'border-primary-container ring-2 ring-primary-container ring-opacity-20' : 'border-outline-variant'
        } rounded-lg px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-on-surface' : 'text-secondary'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-secondary" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-outline-variant/50">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (exactMatch) {
                    handleSelect(exactMatch.id);
                  } else if (filteredOptions.length === 1) {
                    handleSelect(filteredOptions[0].id);
                  } else if (onCreate && search.trim()) {
                    onCreate(search.trim());
                    setIsOpen(false);
                    setSearch('');
                  }
                }
              }}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded cursor-pointer flex items-center justify-between"
                  onClick={() => handleSelect(opt.id)}
                >
                  {opt.name}
                  {opt.id === value && <Check className="w-4 h-4 text-primary" />}
                </div>
              ))
            ) : (
              !onCreate && (
                <div className="px-3 py-4 text-sm text-secondary text-center">
                  No results found
                </div>
              )
            )}
            
            {onCreate && search.trim() && !exactMatch && (
              <div
                className="px-3 py-2 mt-1 text-sm text-primary font-medium hover:bg-primary-container/10 rounded cursor-pointer flex items-center gap-2"
                onClick={() => {
                  onCreate(search.trim());
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <Plus className="w-4 h-4" />
                Create "{search.trim()}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
