import { useState, useRef, useEffect } from "react";

type Props = {
  darkMode: boolean;
  onClose: () => void;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type ConversationHistory = {
  id: string;
  title: string;
  messages: Message[];
  subject?: string;
  timestamp: Date;
};

export default function AIDoubtSolver({ darkMode, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Study Assistant powered by Claude. Ask me anything about your studies - from math problems to essay help, exam prep, or concept explanations. How can I help you today? 📚",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('general');
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';

  // Load conversation history
  useEffect(() => {
    const saved = localStorage.getItem('ai-doubt-history');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversationHistory(parsed.map((conv: any) => ({
        ...conv,
        timestamp: new Date(conv.timestamp),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      })));
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: getSystemPrompt(subject),
          messages: messages
            .filter(m => m.role !== 'assistant' || m.content) // Filter out empty assistant messages
            .map(m => ({
              role: m.role,
              content: m.content,
            }))
            .concat([{ role: 'user', content: input }]),
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content[0]?.text || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save to history
      saveToHistory([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error calling Claude API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const getSystemPrompt = (subject: string) => {
    const basePrompt = `You are an expert AI tutor helping a student with their studies. Be encouraging, clear, and educational. Break down complex concepts into simple explanations. Use examples and step-by-step solutions when appropriate.`;
    
    const subjectPrompts: { [key: string]: string } = {
      mathematics: `${basePrompt} Focus on mathematical concepts. Show step-by-step solutions. Explain the reasoning behind each step.`,
      physics: `${basePrompt} Focus on physics concepts. Use real-world examples. Explain the intuition behind formulas and laws.`,
      chemistry: `${basePrompt} Focus on chemistry concepts. Use analogies and visual descriptions. Explain reactions and molecular behavior clearly.`,
      biology: `${basePrompt} Focus on biological concepts. Use diagrams and systems thinking. Connect concepts to real-life examples.`,
      programming: `${basePrompt} Focus on programming and computer science. Provide code examples when helpful. Explain algorithms clearly.`,
      language: `${basePrompt} Focus on language learning and writing. Help with grammar, vocabulary, and composition. Provide examples and corrections.`,
      history: `${basePrompt} Focus on historical events and context. Explain cause and effect. Connect events to broader patterns.`,
      general: basePrompt,
    };

    return subjectPrompts[subject] || basePrompt;
  };

  const saveToHistory = (currentMessages: Message[]) => {
    if (currentMessages.length < 3) return; // Don't save very short conversations

    const conversation: ConversationHistory = {
      id: Date.now().toString(),
      title: currentMessages[1]?.content.slice(0, 50) + '...' || 'Untitled',
      messages: currentMessages,
      subject,
      timestamp: new Date(),
    };

    const updated = [conversation, ...conversationHistory].slice(0, 20); // Keep last 20
    setConversationHistory(updated);
    localStorage.setItem('ai-doubt-history', JSON.stringify(updated));
  };

  const loadConversation = (conv: ConversationHistory) => {
    setMessages(conv.messages);
    setSubject(conv.subject || 'general');
    setShowHistory(false);
  };

  const clearChat = () => {
    if (confirm('Start a new conversation?')) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hi! I'm ready to help with your new question. What would you like to learn about? 📚",
        timestamp: new Date(),
      }]);
    }
  };

  const quickPrompts = [
    "Explain this concept simply",
    "Solve this step-by-step",
    "Give me practice problems",
    "Help me understand why",
    "Create a study guide",
    "Quiz me on this topic",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${borderClass} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="text-lg font-bold">AI Doubt Solver</h3>
              <p className={`text-xs ${textMuted}`}>Powered by Claude Sonnet 4</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Subject Selector */}
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`${cardBg} border ${darkMode ? 'border-white/10' : 'border-gray-300'} rounded-lg px-3 py-1.5 text-sm`}
            >
              <option value="general">General</option>
              <option value="mathematics">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
              <option value="programming">Programming</option>
              <option value="language">Language</option>
              <option value="history">History</option>
            </select>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
              title="Conversation History"
            >
              📜
            </button>

            <button
              onClick={clearChat}
              className={`p-2 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
              title="New Chat"
            >
              ➕
            </button>

            <button
              onClick={onClose}
              className={`p-2 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : `${cardBg} ${darkMode ? 'text-white' : 'text-gray-900'}`
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : textMuted}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className={`${cardBg} rounded-lg p-4`}>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <div className={`text-xs ${textMuted} mb-2`}>💡 Quick Actions:</div>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt + ': ')}
                      className={`${cardBg} hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-xs transition-colors`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className={`p-4 border-t ${borderClass} flex-shrink-0`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask me anything about your studies..."
                  className={`flex-1 ${cardBg} border ${darkMode ? 'border-white/10' : 'border-gray-300'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? '...' : '📤'}
                </button>
              </div>
              <div className={`text-xs ${textMuted} mt-2`}>
                💡 Tip: Be specific! Include context like grade level, what you've tried, or where you're stuck.
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className={`w-80 border-l ${borderClass} p-4 overflow-y-auto`}>
              <h4 className="font-semibold mb-3">📜 Recent Conversations</h4>
              <div className="space-y-2">
                {conversationHistory.length === 0 ? (
                  <div className={`text-sm ${textMuted} text-center py-8`}>
                    No saved conversations yet
                  </div>
                ) : (
                  conversationHistory.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className={`w-full ${cardBg} hover:bg-white/10 rounded-lg p-3 text-left transition-colors`}
                    >
                      <div className="text-sm font-medium truncate">{conv.title}</div>
                      <div className={`text-xs ${textMuted} mt-1`}>
                        {conv.subject} • {conv.timestamp.toLocaleDateString()}
                      </div>
                      <div className={`text-xs ${textMuted}`}>
                        {conv.messages.length} messages
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}