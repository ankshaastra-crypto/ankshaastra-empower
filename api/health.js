// Simple health check endpoint — verifies API routing is working
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.VERCEL ? "vercel" : process.env.NETLIFY ? "netlify" : "unknown"
  });
}

