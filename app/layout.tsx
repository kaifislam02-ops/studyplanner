// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyFlow - Smart Study Planner",
  description: "Your personal AI-powered study scheduler with prayer time integration",
  keywords: ["study planner", "timetable", "schedule", "education", "productivity"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen text-gray-100 bg-[#0f1127] relative overflow-x-hidden">
        
        {/* Decorative floating gradient blobs */}
        <div className="floating-bg fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
          <div
            className="absolute"
            style={{ 
              background: "radial-gradient(circle, #6d5dfc 0%, transparent 70%)", 
              top: "-10%", 
              left: "-5%",
              width: "400px",
              height: "400px"
            }}
          />
          <div
            className="absolute"
            style={{ 
              background: "radial-gradient(circle, #4fd8ff 0%, transparent 70%)", 
              bottom: "-10%", 
              right: "-5%",
              width: "400px",
              height: "400px"
            }}
          />
          <div
            className="absolute"
            style={{ 
              background: "radial-gradient(circle, #ec4899 0%, transparent 70%)", 
              top: "40%", 
              right: "30%",
              width: "300px",
              height: "300px"
            }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}