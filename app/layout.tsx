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
          bg-[#0f1127]
          relative
        `}
      >
        {/* Floating background effect */}
        <div className="floating-bg pointer-events-none">
          <div
            className="absolute w-72 h-72 rounded-full blur-3xl opacity-30"
            style={{ background: "#6d5dfc", top: "-80px", left: "-80px" }}
          />
          <div
            className="absolute w-72 h-72 rounded-full blur-3xl opacity-30"
            style={{ background: "#4fd8ff", bottom: "-80px", right: "-50px" }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}
