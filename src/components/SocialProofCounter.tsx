import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";

const names = [
  "Priya from Mumbai",
  "Rahul from Delhi",
  "Ananya from Bangalore",
  "Vikram from Pune",
  "Sneha from Hyderabad",
  "Amit from Jaipur",
  "Kavita from Chennai",
  "Rohan from Kolkata",
  "Neha from Lucknow",
  "Arjun from Ahmedabad",
  "Meera from Chandigarh",
  "Siddharth from Indore",
  "Pooja from Surat",
  "Karan from Nagpur",
  "Divya from Patna",
  "Manish from Bhopal",
  "Ritu from Noida",
  "Aakash from Gurgaon",
  "Swati from Coimbatore",
  "Nikhil from Vadodara",
];

const SocialProofCounter = () => {
  const [currentName, setCurrentName] = useState("");
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(5012);

  useEffect(() => {
    let nameIndex = Math.floor(Math.random() * names.length);

    const showNotification = () => {
      nameIndex = (nameIndex + 1) % names.length;
      setCurrentName(names[nameIndex]);
      setCount((prev) => prev + 1);
      setVisible(true);

      setTimeout(() => setVisible(false), 4000);
    };

    // Show first one after 3s
    const initialTimeout = setTimeout(showNotification, 3000);
    // Then every 8-15s randomly
    const interval = setInterval(() => {
      showNotification();
    }, 8000 + Math.random() * 7000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-24 left-6 z-50 max-w-xs transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div
        className="rounded-xl px-4 py-3 shadow-lg border border-accent/20 backdrop-blur-md flex items-center gap-3"
        style={{
          background:
            "linear-gradient(135deg, hsl(38 67% 96% / 0.95), hsl(42 55% 90% / 0.95))",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(201,168,76,0.15)" }}
        >
          <ShoppingBag className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground leading-tight">
            {currentName}
          </p>
          <p className="text-[11px] text-muted-foreground">
            just purchased a report ·{" "}
            <span className="font-semibold text-accent">
              {count.toLocaleString()}+
            </span>{" "}
            served
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialProofCounter;
