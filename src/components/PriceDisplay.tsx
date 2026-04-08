interface PriceDisplayProps {
  price: number;
  className?: string;
}

const PriceDisplay = ({ price, className = "" }: PriceDisplayProps) => {
  return (
    <span className={className}>
      <span style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>₹</span>
      {price.toLocaleString("en-IN")}
    </span>
  );
};

export default PriceDisplay;
