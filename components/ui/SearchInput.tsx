"use client";

import { InputHTMLAttributes } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-[16px] h-[16px]"  viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.75 12.75L15.75 15.75" stroke="black" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25Z" stroke="black" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-9 pr-4 py-3 border border-black/10 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-primary text-xs ${className}`}
        {...props}
      />
    </div>
  );
}

