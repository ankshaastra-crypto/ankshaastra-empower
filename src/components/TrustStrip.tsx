const trustPoints = [
  "10+ Years Experience",
  "48k Global Consultations",
  "4.9 Star Average Rating",
  "Wide Media Coverage",
  "99% Satisfaction",
  "100% Accuracy Assured",
];

const TrustStrip = () => (
  <aside className="trust-strip fixed inset-x-0 top-0 z-[60]" aria-label="Ankshaastra trust highlights">
    <div className="trust-strip-track">
      {trustPoints.map((point, index) => (
        <span key={point} className="trust-strip-item">
          {point}
          {index < trustPoints.length - 1 && <span aria-hidden="true" className="trust-strip-separator">|</span>}
        </span>
      ))}
    </div>
  </aside>
);

export default TrustStrip;