import React from 'react';

// A stylized representation of the SportClub logo icon.
export const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="32.5" rx="48" ry="28" fill="#E30513" stroke="#0B0700" strokeWidth="5"/>
        <path d="M68.7,21.9C63.5,18 55.9,18 50.7,21.9c-5.2,3.9-6,10.7-2.1,15.9l11,14c3.9,5.2,10.7,6,15.9,2.1 c5.2-3.9,6-10.7,2.1-15.9L68.7,21.9z" fill="#FFD400"/>
        <path d="M31.3,43.1c5.2,3.9,12.8,3.9,18-0.0c5.2-3.9,6-10.7,2.1-15.9l-11-14c-3.9-5.2-10.7-6-15.9-2.1 c-5.2,3.9-6,10.7-2.1,15.9L31.3,43.1z" fill="#FFD400"/>
    </svg>
);
