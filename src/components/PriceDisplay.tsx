import { CSSProperties } from "react";

interface PriceDisplayProps {
  price: number;
  className?: string;
  style?: CSSProperties;
}

const PriceDisplay = ({ price, className = "", style }: PriceDisplayProps) => {
  return (
    <span className={className} style={style}>
      <span style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>₹</span>
      {price.toLocaleString("en-IN")}
    </span>
  );
};

export default PriceDisplay;
