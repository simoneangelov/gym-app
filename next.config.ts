import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Hide the floating "N" route indicator in dev; build and runtime errors still show.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Keep a visited page in the browser for 30s, so switching back and forth between the
    // Workouts and Exercises tabs is instant. Saving anything (server actions call
    // revalidatePath) clears it, so edits still show up right away.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
