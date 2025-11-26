import React from "react";
type LogoProps = {
    width?: number | string;
    height?: number | string;
    className?: string;
};

export default function Logo({ width = 100, height = 100, className = "" }: LogoProps) {
    return (
        <div className={className} style={{ width, height }}>
            <span 
                className="text-4xl font-bold"
                style={{
                    background: "linear-gradient(to right, #48CAE4, #7B2CBF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                }}
            >
                bewe
            </span>
        </div>
    );
}
