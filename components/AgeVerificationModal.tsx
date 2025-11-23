import { useState } from "react";

type Props = {
  darkMode: boolean;
  userId: string; // Add userId to save verification
  onComplete: (data: { birthDate: string; parentEmail?: string; parentName?: string }) => void;
  onSkip?: () => void;
};

export default function AgeVerificationModal({ darkMode, userId, onComplete, onSkip }: Props) {
  const [step, setStep] = useState<'age' | 'parent'>('age');
  const [birthDate, setBirthDate] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [isMinor, setIsMinor] = useState(false);

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-300';

  const calculateAge = (date: string) => {
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const age = calculateAge(birthDate);
    
    if (age < 13) {
      alert('StudyFlow is designed for users 13 and older. Please ask a parent or guardian to help you set up your account.');
      return;
    }
    
    // Save to localStorage immediately
    localStorage.setItem(`age-verified-${userId}`, age.toString());
    localStorage.setItem(`birth-date-${userId}`, birthDate);
    
    if (age < 18) {
      setIsMinor(true);
      setStep('parent');
    } else {
      onComplete({ birthDate });
    }
  };

  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save parent info to localStorage
    localStorage.setItem(`parent-info-${userId}`, JSON.stringify({
      email: parentEmail,
      name: parentName,
      verifiedAt: new Date().toISOString(),
    }));
    
    onComplete({ birthDate, parentEmail, parentName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-md w-full shadow-2xl`}>
        {/* Header */}
        <div className={`p-6 border-b ${borderClass}`}>
          <div className="text-center">
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-xl font-bold">
              {step === 'age' ? 'Verify Your Age' : 'Parental Consent Required'}
            </h3>
            <p className={`text-sm ${textMuted} mt-2`}>
              {step === 'age' 
                ? 'This is a one-time verification. We need to verify your age to provide appropriate features'
                : 'Since you\'re under 18, we need a parent or guardian\'s permission'
              }
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'age' ? (
            <form onSubmit={handleAgeSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2`}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  required
                />
                <p className={`text-xs ${textMuted} mt-2`}>
                  ✅ This will be saved and you won't be asked again
                </p>
              </div>

              <div className={`${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'} border ${darkMode ? 'border-blue-500/30' : 'border-blue-200'} rounded-lg p-3`}>
                <div className="flex gap-2">
                  <span className="text-blue-500">ℹ️</span>
                  <div className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    <strong>Privacy Notice:</strong> Your birth date is used only for age verification and parental controls. It's stored securely and never shared.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
              
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className={`w-full text-sm ${textMuted} hover:text-white transition-colors`}
                >
                  Skip for now
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleParentSubmit} className="space-y-4">
              <div className={`${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'} border ${darkMode ? 'border-yellow-500/30' : 'border-yellow-200'} rounded-lg p-4 mb-4`}>
                <div className="flex gap-2">
                  <span className="text-yellow-500">👪</span>
                  <div className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    <strong>For Users Under 18:</strong>
                    <p className="mt-1">
                      We'll send a verification email to your parent/guardian. They'll be able to:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• Monitor your study progress</li>
                      <li>• Set healthy study limits</li>
                      <li>• Receive weekly progress reports</li>
                      <li>• Ensure safe usage</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2`}>
                  Parent/Guardian Name *
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Full name"
                  className={`w-full ${inputBg} border rounded-lg px-4 py-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2`}>
                  Parent/Guardian Email *
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className={`w-full ${inputBg} border rounded-lg px-4 py-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  required
                />
                <p className={`text-xs ${textMuted} mt-2`}>
                  We'll send a verification link to this email
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('age')}
                  className={`flex-1 px-4 py-3 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-medium transition-colors`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Send Verification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}