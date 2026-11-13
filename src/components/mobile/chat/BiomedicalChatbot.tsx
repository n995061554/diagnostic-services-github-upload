import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  Phone,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { ThemePalette } from '../../../utils/themeSystem';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    action: () => void;
  };
}

interface BiomedicalChatbotProps {
  theme: ThemePalette;
  onRaiseTicket: () => void;
  onCallEngineer: () => void;
}

export const BiomedicalChatbot: React.FC<BiomedicalChatbotProps> = ({
  theme,
  onRaiseTicket,
  onCallEngineer
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'ai',
      text: 'Hello Dr. Verma! I am MediBot Pro, your 24/7 biomedical and laboratory support assistant. How can I assist you with your analyzers, reagent lots, or field service today?',
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      let action: { label: string; action: () => void } | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('104') || lower.includes('optical') || lower.includes('error')) {
        reply = 'Analyzer Alarm E-104 corresponds to Photometer Cuvette Wheel Transmission Error. Immediate troubleshooting steps:\n1. Inspect cuvette rinse probe for salt crystalline buildup.\n2. Execute automated cell wash cycle with Wash Solution 1 (Acidic/Detergent).\n3. If alarm persists, an optical board or stepper motor alignment is required. Would you like me to dispatch an engineer?';
        action = {
          label: '⚡ Dispatch Engineer (4h SLA)',
          action: onRaiseTicket
        };
      } else if (lower.includes('cold') || lower.includes('temp') || lower.includes('chain') || lower.includes('storage')) {
        reply = 'Roche and Abbott clinical chemistry reagents require strict 2°C to 8°C cold-chain maintenance. If temperature excursion above 10°C exceeded 2 hours, run a 2-level QC control verify before patient sample testing.';
      } else if (lower.includes('calibrat') || lower.includes('certificate')) {
        reply = 'Your Sysmex XN-1000 optical calibration certificate #CERT-CAL-SYS-2026-Q3 is ready for download in your Digital Document Center. NABL ISO 17025 accredited and valid until Oct 2027.';
      } else if (lower.includes('engineer') || lower.includes('human') || lower.includes('call') || lower.includes('vikram')) {
        reply = 'Connecting you directly to your Dedicated Clinical Account Specialist, Eng. Vikram Sethi (+91 98450 11992). Guaranteed priority response for Diamond Partner tier.';
        action = {
          label: '📞 Call Eng. Vikram Sethi',
          action: onCallEngineer
        };
      } else {
        reply = `I have logged your clinical query regarding "${text}". Our biomedical support database verifies this against OEM specifications. You can also raise an instant priority ticket or speak with your assigned engineer.`;
        action = {
          label: 'Raise Service Request',
          action: onRaiseTicket
        };
      }

      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedAction: action
        }
      ]);
    }, 650);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-[#D0DEE5] shadow-xs overflow-hidden">
      {/* Bot Header */}
      <div 
        className="p-3.5 text-white flex items-center justify-between border-b"
        style={{ 
          backgroundColor: theme.primaryNavy || '#0E1035', 
          borderColor: theme.deepNavy || '#15253F' 
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center border font-bold bg-[#D0DEE5]/20 border-[#D0DEE5]/30 text-[#D0DEE5]"
          >
            <Sparkles className="w-4 h-4 text-[#D0DEE5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-xs text-white">MediBot Pro Clinical AI</h4>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D0DEE5] animate-pulse" />
            </div>
            <p className="text-[10px] text-white/70">Biomedical Engineering & Protocol Assistant</p>
          </div>
        </div>
        <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded-full text-white/80">
          24/7 STAT
        </span>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-2 bg-slate-50 border-b border-[#D0DEE5] flex gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
        {[
          'Troubleshoot cobas E-104 Error',
          'Reagent Cold-Chain Storage Rules',
          'Download Calibration Certificate',
          'Connect to Field Engineer'
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="flex-shrink-0 px-2.5 py-1 bg-white hover:bg-[#D0DEE5]/40 border border-[#D0DEE5] text-[#0E1035] font-bold rounded-full transition cursor-pointer shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl shadow-2xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-[#0E1035] text-white rounded-br-xs font-medium'
                  : 'bg-white text-[#0E1035] border border-[#D0DEE5] rounded-bl-xs'
              }`}
            >
              {msg.text}

              {msg.suggestedAction && (
                <div className="mt-2.5 pt-2 border-t border-[#D0DEE5]">
                  <button
                    onClick={msg.suggestedAction.action}
                    className="w-full py-1.5 px-3 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {msg.suggestedAction.label}
                  </button>
                </div>
              )}
            </div>
            <span className="text-[9px] text-[#7C8594] mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#7C8594] italic bg-white p-2.5 rounded-2xl border border-[#D0DEE5] max-w-[140px]">
            <span className="w-1.5 h-1.5 bg-[#0E1035] rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-[#0E1035] rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-[#0E1035] rounded-full animate-bounce [animation-delay:0.4s]" />
            <span>Analyzing OEM docs...</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 bg-white border-t border-[#D0DEE5] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask MediBot: Analyzer error, storage specs..."
          className="flex-1 p-2.5 bg-slate-50 rounded-xl text-xs text-[#0E1035] focus:outline-hidden focus:ring-1 focus:ring-[#0E1035] border border-[#D0DEE5]"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim()}
          className="p-2.5 bg-[#0E1035] hover:bg-[#15253F] disabled:opacity-40 text-[#D0DEE5] rounded-xl transition cursor-pointer shadow-2xs"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
