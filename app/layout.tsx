import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyPlanner",
  description: "Your personal study planner built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable}
          ${robotoMono.variable}
          antialiased
          min-h-screen
          text-gray-100
          bg-[#0f1127]     /* deep cosmic background */
          relative
          overflow-x-hidden
        `}
      >
        {/* Cosmic floating lights */}
        <div className="floating-bg">
          <div
            style={{
              background: "#6d5dfc",
              top: "-120px",
              left: "-120px",
              position: "absolute",
            }}
          />
          <div
            style={{
              background: "#4fd8ff",
              bottom: "-120px",
              right: "-80px",
              position: "absolute",
            }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}
