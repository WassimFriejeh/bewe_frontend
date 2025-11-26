interface ArrowProps {
  direction?: "left" | "right" | "down" | "up";
  className?: string;
  opacity?: number;
}

export default function Arrow({ direction = "right", className = "", opacity = 0.8 }: ArrowProps) {
  const getPath = () => {
    switch (direction) {
      case "right":
        return "M9.375 6.25C9.375 6.25 15.625 10.853 15.625 12.5C15.625 14.1471 9.375 18.75 9.375 18.75";
      case "left":
        return "M15.625 6.25C15.625 6.25 9.375 10.853 9.375 12.5C9.375 14.1471 15.625 18.75 15.625 18.75";
      case "down":
        return "M6.25 9.375C6.25 9.375 10.853 15.625 12.5 15.625C14.1471 15.625 18.75 9.375 18.75 9.375";
      case "up":
        return "M18.75 15.625C18.75 15.625 14.1471 9.375 12.5 9.375C10.8529 9.375 6.25 15.625 6.25 15.625";
      default:
        return "M9.375 6.25C9.375 6.25 15.625 10.853 15.625 12.5C15.625 14.1471 9.375 18.75 9.375 18.75";
    }
  };

  return (
    <svg 
      width="25" 
      height="25" 
      viewBox="0 0 25 25" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      <g>
        <path 
          d={getPath()}
          stroke="black" 
          strokeWidth="1.5625" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

