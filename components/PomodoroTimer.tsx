import { useState, useEffect } from "react";
import { soundManager } from "@/lib/sounds";

type Props = {
  darkMode: boolean;
  onClose: () => void;
};

export default function PomodoroTimer({ darkMode, onClose }: Props) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished
            setIsActive(false);
            
            if (!isBreak) {
              // Focus session complete
              setSessions(sessions + 1);
              soundManager.play('pomodoro-complete');
              soundManager.notify(
                '🎉 Focus Session Complete!',
                'Great job! Time for a break.',
                'pomodoro-complete'
              );
              
              // Start break
              setIsBreak(true);
              setMinutes(5);
            } else {
              // Break finished
              soundManager.play('pomodoro-break');
              soundManager.notify(
                '✨ Break Over!',
                'Ready for the next session?',
                'pomodoro-break'
              );
              
              setIsBreak(false);
              setMinutes(25);
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, isBreak, sessions]);

  const toggle = () => {
    if (!isActive) {
      soundManager.play('pomodoro-start');
    }
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setMinutes(isBreak ? 5 : 25);
    setSeconds(0);
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundManager.setEnabled(newState);
    if (newState) {
      soundManager.play('notification');
    }
  };

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';

  const progress = isBreak
    ? ((5 - minutes) * 60 + (60 - seconds)) / (5 * 60) * 100
    : ((25 - minutes) * 60 + (60 - seconds)) / (25 * 60) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-md w-full shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
          <h3 className="text-lg font-bold">⏱️ Pomodoro Timer</h3>
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled 
                  ? darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  : darkMode ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-400'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
            
            <button
              onClick={onClose}
              className={`p-1 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className={`text-sm font-semibold ${textMuted} mb-2`}>
              {isBreak ? "☕ Break Time" : "🎯 Focus Session"}
            </div>
            <div className="text-7xl font-bold tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke={darkMode ? "#ffffff20" : "#e5e7eb"}
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke={isBreak ? "#10B981" : "#3B82F6"}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{sessions}</div>
                <div className={`text-xs ${textMuted}`}>Sessions</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={toggle}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                isActive
                  ? darkMode ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isActive ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              onClick={reset}
              className={`px-6 py-3 rounded-lg font-semibold ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
            >
              🔄 Reset
            </button>
          </div>

          {/* Info */}
          <div className={`mt-6 p-4 ${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-lg`}>
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className={textMuted}>Focus Duration:</span>
                <span className="font-semibold">25 minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={textMuted}>Break Duration:</span>
                <span className="font-semibold">5 minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={textMuted}>Notifications:</span>
                <span className="font-semibold">{soundEnabled ? '✅ Enabled' : '❌ Disabled'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}