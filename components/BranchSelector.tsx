"use client";

import { useState, useRef, useEffect } from "react";
import { useBranch } from "../contexts/BranchContext";

interface BranchSelectorProps {
  width?: string | number;
  className?: string;
}

export default function BranchSelector({ width, className = "" }: BranchSelectorProps) {
  const { branches, currentBranch, setCurrentBranch, isLoading } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading || branches.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-gray-600 ${className}`} style={width ? { width: typeof width === 'number' ? `${width}px` : width } : {}}>
        <span className="text-sm">Branch:</span>
        <span className="text-sm font-medium">Loading...</span>
      </div>
    );
  }

  const handleBranchChange = (branch: typeof branches[0]) => {
    setCurrentBranch(branch);
    setIsOpen(false);
  };

  const widthStyle = width ? { width: typeof width === 'number' ? `${width}px` : width } : {};

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={widthStyle}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-5 py-2.5 cursor-pointer text-xs font-medium border border-black/20 rounded-[10px] transition-colors focus:outline-none whitespace-nowrap ${
          isOpen 
            ? "bg-black text-white" 
            : "bg-white hover:bg-black hover:text-white"
        }`}
      >
        <span className="text-[#808080] flex-shrink-0">Branch:</span>
        <span className="flex-1 text-left whitespace-nowrap truncate min-w-0">{currentBranch?.label || "Select Branch"}</span>
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full bg-white border border-black/20 rounded-[10px] shadow-lg z-50 max-h-60 overflow-auto">
          <div>
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchChange(branch)}
                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors rounded-[10px] ${
                  currentBranch?.id === branch.id ? "bg-black/10 text-black" : "text-gray-700"
                }`}
              >
                {branch.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

