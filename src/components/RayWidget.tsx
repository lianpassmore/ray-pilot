'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, PhoneOff, Send, VolumeX, Volume2, MessageSquare } from 'lucide-react';
import AnimatedRayCircle from './AnimatedRayCircle';
import { createClient } from '@/lib/supabase';

interface RayWidgetProps {
  userName: string;
  userId: string;
  onSessionEnd?: (conversationDbId: string) => void;
}

export default function RayWidget({ userName, userId, onSessionEnd }: RayWidgetProps) {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const conversationDbIdRef = useRef<string | null>(null);
  const supabase = createClient();

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => console.log('Ray connected'),
    onDisconnect: () => console.log('Ray disconnected'),
    onError: (err) => {
      console.error('Ray error:', err);
      setError('Connection disrupted.');
    },
    onMessage: (message) => {
      if (message.message) {
        if (message.source === 'user') {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'user' && last.content === message.message) return prev;
            return [...prev, { role: 'user', content: message.message }];
          });
        } else {
          setMessages(prev => [...prev, { role: 'agent', content: message.message }]);
        }
      }
    },
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mode]);

  // --- ACTIONS ---

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, [supabase]);

  const startConversation = useCallback(async (startMode: 'voice' | 'text' = 'voice') => {
    try {
      setError(null);
      setMode(startMode);

      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/elevenlabs?name=${encodeURIComponent(userName)}&userId=${encodeURIComponent(userId)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Connection failed");

      const { signedUrl, conversationDbId, sessionNumber, sessionType } = await response.json();
      conversationDbIdRef.current = conversationDbId;

      await conversation.startSession({
        signedUrl: signedUrl,
        dynamicVariables: {
          user_name: userName,
          session_number: String(sessionNumber),
          session_type: sessionType,
        }
      });

      if (startMode === 'text') {
        conversation.setVolume({ volume: 0 });
        setIsMuted(true);
      } else {
        conversation.setVolume({ volume: 1 });
        setIsMuted(false);
      }

      setTimeout(async () => {
        const elId = conversation.getId();
        if (elId && conversationDbId) {
          const t = await getAccessToken();
          fetch('/api/elevenlabs', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
            body: JSON.stringify({ conversationDbId, elevenLabsConversationId: elId }),
          }).catch(console.error);
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to start:', err);
      setError('Ray is unavailable right now.');
    }
  }, [conversation, userName, userId, getAccessToken]);

  const endConversation = async () => {
    const dbId = conversationDbIdRef.current;
    await conversation.endSession();

    if (dbId) {
      try {
        const token = await getAccessToken();
        await fetch('/api/elevenlabs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ conversationDbId: dbId }),
        });
      } catch (err) {
        console.error('Failed to end session:', err);
      }
      if (onSessionEnd) onSessionEnd(dbId);
    }
    conversationDbIdRef.current = null;
  };

  const sendTextMessage = async () => {
    if (!textInput.trim() || status !== 'connected') return;
    const userMessage = textInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setTextInput('');
    try {
      conversation.sendUserMessage(userMessage);
    } catch (error) {
      console.error('Failed to send:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  // --- UI HELPERS ---

  const getCircleState = (): 'idle' | 'connected' | 'speaking' => {
    if (status !== 'connected') return 'idle';
    if (isSpeaking) return 'speaking';
    return 'connected';
  };

  const getStatusText = () => {
    if (error) return error;
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'connected': return isSpeaking ? 'Ray is speaking' : 'Ray is listening';
      default: return 'Tap to begin';
    }
  };

  const isIdle = status !== 'connected' && status !== 'connecting';
  const isTextSession = mode === 'text' && status === 'connected';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto relative">

      {/* VOICE MODE — The Orb is the only UI */}
      <AnimatePresence mode="wait">
        {!isTextSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center w-full"
          >
            {/* The Orb — tapping it starts voice */}
            <div className="relative">
              <AnimatedRayCircle
                state={getCircleState()}
                size={200}
                onClick={isIdle ? () => startConversation('voice') : undefined}
              />
            </div>

            {/* Status Text */}
            <div className="mt-8 text-center h-6">
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                error ? 'text-destructive' : 'text-warm-grey'
              }`}>
                {getStatusText()}
              </p>
            </div>

            {/* "Prefer to type?" — idle only */}
            {isIdle && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                onClick={() => startConversation('text')}
                className="mt-6 text-[11px] text-warm-grey/60 hover:text-warm-grey transition-colors tracking-wide"
              >
                Prefer to type?
              </motion.button>
            )}

            {/* Active Voice Controls */}
            {status === 'connected' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-5 mt-10"
              >
                <button
                  onClick={() => {
                    setMode('text');
                    conversation.setVolume({ volume: 0 });
                    setIsMuted(true);
                  }}
                  className="p-3 rounded-full bg-transparent border border-charcoal/15 text-charcoal/60 hover:text-charcoal hover:border-charcoal/30 transition-all"
                  title="Switch to Text"
                >
                  <MessageSquare size={18} strokeWidth={1.5} />
                </button>

                <button
                  onClick={() => {
                    const next = !isMuted;
                    setIsMuted(next);
                    conversation.setVolume({ volume: next ? 0 : 1 });
                  }}
                  className={`p-3 rounded-full border transition-all duration-300 ${
                    isMuted
                      ? 'bg-charcoal text-linen border-charcoal'
                      : 'bg-transparent text-charcoal/60 border-charcoal/15 hover:text-charcoal hover:border-charcoal/30'
                  }`}
                  title={isMuted ? 'Unmute Ray' : 'Mute Ray'}
                >
                  {isMuted ? <VolumeX size={18} strokeWidth={1.5} /> : <Volume2 size={18} strokeWidth={1.5} />}
                </button>

                <button
                  onClick={endConversation}
                  className="p-3 rounded-full bg-charcoal text-linen hover:bg-destructive transition-colors duration-300"
                  title="End Session"
                >
                  <PhoneOff size={18} strokeWidth={1.5} />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEXT MODE */}
      <AnimatePresence>
        {isTextSession && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="flex flex-col h-[480px] w-full bg-white/80 backdrop-blur-xl border border-charcoal/10 rounded-sm shadow-2xl overflow-hidden"
          >
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-charcoal/10 flex justify-between items-center bg-linen/90">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal">Ray</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMode('voice');
                    conversation.setVolume({ volume: 1 });
                    setIsMuted(false);
                  }}
                  className="p-2 text-charcoal/50 hover:text-charcoal rounded-sm transition-colors"
                  title="Switch to Voice"
                >
                  <Mic size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={endConversation}
                  className="p-2 text-charcoal/50 hover:text-destructive rounded-sm transition-colors"
                  title="End Session"
                >
                  <PhoneOff size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-linen/30">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-warm-grey text-sm italic opacity-50">
                  Type your thought.
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-sm text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-charcoal text-linen'
                      : 'bg-white border border-charcoal/5 text-charcoal'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-charcoal/10 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message Ray..."
                className="flex-1 bg-charcoal/5 border-transparent focus:bg-white focus:border-charcoal/20 rounded-sm px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-warm-grey/40"
                autoFocus
              />
              <button
                onClick={sendTextMessage}
                disabled={!textInput.trim()}
                className="p-3 bg-charcoal text-linen rounded-sm disabled:opacity-30 hover:bg-clay transition-colors"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
