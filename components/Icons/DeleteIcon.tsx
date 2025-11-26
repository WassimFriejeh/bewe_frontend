"use client";

import { useState } from "react";

interface DeleteIconProps {
  className?: string;
  onClick?: () => void;
}

export default function DeleteIcon({ className = "", onClick }: DeleteIconProps) {
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
          <rect width="38" height="38" rx="4.31818" fill="#FF0000"/>
          <path d="M25.4775 13.3864L24.9423 22.0444C24.8055 24.2564 24.7372 25.3625 24.1827 26.1577C23.9085 26.5508 23.5556 26.8827 23.1463 27.132C22.3184 27.6364 21.2103 27.6364 18.9939 27.6364C16.7747 27.6364 15.6651 27.6364 14.8367 27.131C14.4271 26.8813 14.074 26.5489 13.8 26.155C13.2457 25.3586 13.1788 24.251 13.0451 22.0358L12.5229 13.3864" stroke="white" strokeWidth="1.29545" strokeLinecap="round"/>
          <path d="M11.2271 13.3864H26.7725M22.5024 13.3864L21.9129 12.1701C21.5213 11.3622 21.3254 10.9583 20.9876 10.7063C20.9127 10.6505 20.8334 10.6008 20.7504 10.5577C20.3763 10.3636 19.9274 10.3636 19.0296 10.3636C18.1092 10.3636 17.6491 10.3636 17.2688 10.5658C17.1845 10.6107 17.1041 10.6624 17.0283 10.7205C16.6866 10.9826 16.4958 11.4013 16.114 12.2388L15.5909 13.3864" stroke="white" strokeWidth="1.29545" strokeLinecap="round"/>
          <path d="M16.8408 22.8864V17.7046" stroke="white" strokeWidth="1.29545" strokeLinecap="round"/>
          <path d="M21.1592 22.8864V17.7046" stroke="white" strokeWidth="1.29545" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="38" height="38" rx="4.31818" fill="white"/>
          <rect x="0.431818" y="0.431818" width="37.1364" height="37.1364" rx="3.88636" stroke="#FF0000" strokeOpacity="0.3" strokeWidth="0.863636"/>
          <path d="M25.4775 13.3864L24.9423 22.0444C24.8055 24.2564 24.7372 25.3625 24.1827 26.1577C23.9085 26.5508 23.5556 26.8827 23.1463 27.132C22.3184 27.6364 21.2103 27.6364 18.9939 27.6364C16.7747 27.6364 15.6651 27.6364 14.8367 27.131C14.4271 26.8813 14.074 26.5489 13.8 26.155C13.2457 25.3586 13.1788 24.251 13.0451 22.0358L12.5229 13.3864" stroke="#FF0000" strokeWidth="1.29545" strokeLinecap="round"/>
          <path d="M11.2271 13.3864H26.7725M22.5024 13.3864L21.9129 12.1701C21.5213 11.3622 21.3254 10.9583 20.9876 10.7063C20.9127 10.6505 20.8334 10.6008 20.7504 10.5577C20.3763 10.3636 19.9274 10.3636 19.0296 10.3636C18.1092 10.3636 17.6491 10.3636 17.2688 10.5658C17.1845 10.6107 17.1041 10.6624 17.0283 10.7205C16.6866 10.9826 16.4958 11.4013 16.114 12.2388L15.5909 13.3864" stroke="#FF0000" strokeWidth="1.29545" strokeLinecap="round"/>
          <path d="M16.8408 22.8864V17.7046" stroke="#FF0000" strokeWidth="1.29545" strokeLinecap="round"/>
          <path d="M21.1592 22.8864V17.7046" stroke="#FF0000" strokeWidth="1.29545" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}

