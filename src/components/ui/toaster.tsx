import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      }}
    />
  );
}