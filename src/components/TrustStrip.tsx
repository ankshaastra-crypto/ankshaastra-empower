const trustPoints = [
  "10+ Years Experience",
  "48k Global Consultations",
  "4.9 Star Average Rating",
  "Wide Media Coverage",
  "99% Satisfaction",
  "100% Accuracy Assured",
];

const movingTrustPoints = [...trustPoints, ...trustPoints];

const TrustStrip = () => (
  <aside className="trust-strip fixed inset-x-0 top-0 z-[60]" aria-label="Ankshaastra trust highlights">
    <div className="trust-strip-track">
      {movingTrustPoints.map((point, index) => (
        <span key={`${point}-${index}`} className="trust-strip-item" aria-hidden={index >= trustPoints.length ? true : undefined}>
          {point}
          <span aria-hidden="true" className="trust-strip-separator">|</span>
        </span>
      ))}
    </div>
  </aside>
);

export default TrustStrip;