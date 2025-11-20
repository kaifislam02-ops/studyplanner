import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyPlanner",
  description: "Your personal study planner built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable}
          ${robotoMono.variable}
          bg-[#0f1127]
          text-white
          antialiased
          min-h-screen
          relative
        `}
      >
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute w-[380px] h-[380px] bg-[#6d5dfc] blur-[150px] opacity-30 -top-20 -left-20"></div>
          <div className="absolute w-[380px] h-[380px] bg-[#4fd8ff] blur-[150px] opacity-30 -bottom-20 -right-10"></div>
        </div>

        {children}
      </body>
    </html>
  );
}
