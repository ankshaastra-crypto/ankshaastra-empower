const SectionDivider = () => {
  return (
    <div className="hidden md:flex relative py-4 items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 1200 60"
        className="w-full max-w-4xl h-8 md:h-12"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Left line */}
        <line
          x1="100" y1="30" x2="520" y2="30"
          stroke="hsl(42, 55%, 54%)"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {/* Center ornament */}
        <g transform="translate(600, 30)">
          <circle r="3" fill="hsl(42, 55%, 54%)" fillOpacity="0.5" />
          <circle r="8" fill="none" stroke="hsl(42, 55%, 54%)" strokeWidth="0.8" strokeOpacity="0.3" />
          {/* Diamond shapes */}
          <path d="M-20,0 L-15,-4 L-10,0 L-15,4 Z" fill="hsl(42, 55%, 54%)" fillOpacity="0.25" />
          <path d="M20,0 L15,-4 L10,0 L15,4 Z" fill="hsl(42, 55%, 54%)" fillOpacity="0.25" />
        </g>
        {/* Right line */}
        <line
          x1="680" y1="30" x2="1100" y2="30"
          stroke="hsl(42, 55%, 54%)"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
      </svg>
    </div>
  );
};

export default SectionDivider;
