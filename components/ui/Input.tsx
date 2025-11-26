import React, { InputHTMLAttributes } from "react";
import EyeIcon from "@/components/Icons/EyeIcon";
import EyeSlashIcon from "@/components/Icons/EyeSlashIcon";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onPasswordToggle?: () => void;
}

export default function Input({
  label,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onPasswordToggle,
  className = "",
  ...props
}: InputProps) {
  // Wrap asterisks in spans
  const renderLabel = (labelText: string) => {
    const parts = labelText.split(/(\*)/g);
    return parts.map((part, index) => 
      part === '*' ? <span key={index}>{part}</span> : part
    );
  };

  return (
    <div>
      {label && (
        <label htmlFor={props.id} className="main-label">
          {renderLabel(label)}
        </label>
      )}
      <div className={showPasswordToggle ? "mt-0.5 relative" : "mt-0.5"}>
        <input
          className={`main-input ${showPasswordToggle ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {showPasswordToggle && onPasswordToggle && (
          <button
            type="button"
            onClick={onPasswordToggle}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {isPasswordVisible ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

