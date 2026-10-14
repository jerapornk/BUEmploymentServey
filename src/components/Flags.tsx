import React from 'react';

interface FlagProps {
  className?: string;
}

export const ThaiFlag: React.FC<FlagProps> = ({ className = "w-4.5 h-3 rounded-[2px] shadow-sm" }) => (
  <svg viewBox="0 0 9 6" className={`${className} inline-block`} xmlns="http://www.w3.org/2000/svg">
    <rect width="9" height="6" fill="#A51931"/>
    <rect width="9" height="4" y="1" fill="#F4F5F8"/>
    <rect width="9" height="2" y="2" fill="#2D2A4A"/>
  </svg>
);

export const UKFlag: React.FC<FlagProps> = ({ className = "w-4.5 h-3 rounded-[2px] shadow-sm" }) => (
  <svg viewBox="0 0 50 30" className={`${className} inline-block`} xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="30" fill="#012169"/>
    <path d="M0,0 L50,30 M50,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L50,30 M50,0 L0,30" stroke="#C8102E" strokeWidth="3.5"/>
    <path d="M25,0 v30 M0,15 h50" stroke="#fff" strokeWidth="10"/>
    <path d="M25,0 v30 M0,15 h50" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);
