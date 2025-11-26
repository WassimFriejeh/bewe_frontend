"use client";

import { useState } from "react";

interface EditIconProps {
  className?: string;
  onClick?: () => void;
}

export default function EditIcon({ className = "", onClick }: EditIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`cursor-pointer transition-all ${className}`}
    >
      {isHovered ? (
        <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="38" height="38" rx="4.31818" fill="black"/>
          <path d="M11.9023 22.7216L11.2271 26.7727L15.2782 26.0976C15.9817 25.9804 16.631 25.6462 17.1354 25.1419L26.2714 16.0057C26.9395 15.3375 26.9395 14.2543 26.2713 13.5861L24.4137 11.7284C23.7455 11.0602 22.6621 11.0603 21.9939 11.7284L12.858 20.8646C12.3536 21.3689 12.0195 22.0182 11.9023 22.7216Z" stroke="white" strokeWidth="1.29545" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.7271 13.8182L24.1816 17.2728" stroke="white" strokeWidth="1.29545" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="38" height="38" rx="4.31818" fill="#F9F9F9"/>
          <rect x="0.431818" y="0.431818" width="37.1364" height="37.1364" rx="3.88636" stroke="black" strokeOpacity="0.2" strokeWidth="0.863636"/>
          <path d="M11.9023 22.7216L11.2271 26.7727L15.2782 26.0976C15.9817 25.9804 16.631 25.6462 17.1354 25.1419L26.2714 16.0057C26.9395 15.3375 26.9395 14.2543 26.2713 13.5861L24.4137 11.7284C23.7455 11.0602 22.6621 11.0603 21.9939 11.7284L12.858 20.8646C12.3536 21.3689 12.0195 22.0182 11.9023 22.7216Z" stroke="black" strokeWidth="1.29545" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.7271 13.8182L24.1816 17.2728" stroke="black" strokeWidth="1.29545" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

