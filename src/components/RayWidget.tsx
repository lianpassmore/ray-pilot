'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, PhoneOff, Send, X, VolumeX, Volume2 } from 'lucide-react';
import AnimatedRayCircle from './AnimatedRayCircle';

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

  // Chat History State
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
      // Capture messages for chat history
      if (message.message) {
        if (message.source === 'user') {
          // Only add user messages from voice transcription (text messages are added optimistically)
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mode]);

  // --- ACTIONS ---

  const startConversation = useCallback(async (startMode: 'voice' | 'text' = 'voice') => {
    try {
      setError(null);
      setMode(startMode);

      // 1. Get Signed URL and create conversation record
      const response = await fetch(`/api/elevenlabs?name=${encodeURIComponent(userName)}&userId=${encodeURIComponent(userId)}`);

      if (!response.ok) throw new Error("Failed to get connection token");

      const { signedUrl, conversationDbId, sessionNumber, sessionType } = await response.json();
      conversationDbIdRef.current = conversationDbId;

      // 2. Start Session using the Signed URL
      const session = await conversation.startSession({
        signedUrl: signedUrl,
        dynamicVariables: {
          user_name: userName,
          session_number: String(sessionNumber),
          session_type: sessionType,
          shared_context: '',
          individual_context: '',
        }
      });

      // If starting in text mode, mute Ray's voice output
      if (startMode === 'text') {
        conversation.setVolume({ volume: 0 });
        setIsMuted(true);
      }

      // 3. Link ElevenLabs conversation ID to our DB row
      const elevenLabsConversationId = (session as any)?.conversationId ?? (conversation as any)?.conversationId;
      if (elevenLabsConversationId && conversationDbId) {
        fetch('/api/elevenlabs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationDbId, elevenLabsConversationId }),
        }).catch(err => console.error('Failed to link conversation:', err));
      }

    } catch (err) {
      console.error('Failed to start:', err);
      setError('Ray is currently unavailable.');
    }
  }, [conversation, userName, userId]);

  const endConversation = async () => {
    const dbId = conversationDbIdRef.current;
    await conversation.endSession();

    // Mark session as completed in DB
    if (dbId) {
      try {
        await fetch('/api/elevenlabs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationDbId: dbId }),
        });
      } catch (err) {
        console.error('Failed to end session:', err);
      }
      onSessionEnd?.(dbId);
    }

    conversationDbIdRef.current = null;
  };

  const sendTextMessage = async () => {
    if (!textInput.trim() || status !== 'connected') return;

    const userMessage = textInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setTextInput('');

    try {
      await conversation.sendUserMessage(userMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
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
      case 'connecting': return 'Grounding...';
      case 'connected': return isSpeaking ? 'Ray is speaking' : 'Ray is listening';
      default: return 'Tap to begin';
    }
  };

  // Full text mode: hide orb entirely
  const isTextSession = mode === 'text' && status === 'connected';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto relative">

      {/* 1. THE INTERFACE (The Orb) - hidden during text sessions */}
      {!isTextSession && (
        <>
          <div className="mb-8 relative">
            <AnimatedRayCircle
              state={getCircleState()}
              size={180}
              onClick={status === 'connected' ? endConversation : () => startConversation('voice')}
            />

            {/* Status Text Floating Below */}
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <p className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                error ? 'text-destructive' : 'text-warm-grey'
              }`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* MODE PICKER (Idle State) */}
          {status !== 'connected' && status !== 'connecting' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mt-2"
            >
              <button
                onClick={() => startConversation('voice')}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-charcoal/10 rounded-sm text-charcoal hover:bg-charcoal/5 transition-all duration-300"
              >
                <Mic size={18} strokeWidth={1.5} />
                <span className="text-xs font-bold uppercase tracking-widest">Voice</span>
              </button>
              <button
                onClick={() => startConversation('text')}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-charcoal/10 rounded-sm text-charcoal hover:bg-charcoal/5 transition-all duration-300"
              >
                <MessageSquare size={18} strokeWidth={1.5} />
                <span className="text-xs font-bold uppercase tracking-widest">Text</span>
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* 2. TEXT CHAT MODE (Full view when text-only, overlay when switched mid-voice) */}
      <AnimatePresence>
        {isTextSession && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex flex-col w-full h-[70vh] max-h-[500px] bg-white/90 backdrop-blur-md border border-charcoal/10 rounded-sm shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-charcoal/10 flex justify-between items-center bg-linen/50">
              <span className="text-xs font-bold uppercase tracking-widest text-charcoal">Text Mode</span>
              <div className="flex items-center gap-3">
                <button onClick={endConversation} className="text-destructive hover:text-destructive/70 transition-colors" title="End Session">
                  <PhoneOff size={18} strokeWidth={1.5} />
                </button>
                <button onClick={endConversation} className="text-charcoal hover:text-clay transition-colors" title="Close">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-warm-grey text-sm italic">
                  Start typing to Ray...
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-sm text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-charcoal text-linen'
                        : 'bg-linen border border-charcoal/10 text-charcoal'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-charcoal/10 flex gap-2 bg-white">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-linen/30 border border-charcoal/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-charcoal/30 transition-colors"
                autoFocus
              />
              <button
                onClick={sendTextMessage}
                disabled={!textInput.trim()}
                className="p-3 bg-clay text-linen rounded-sm disabled:opacity-50 hover:bg-charcoal transition-colors"
              >
                <Send size={18} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CONTROLS (Only visible when connected) */}
      {status === 'connected' && mode === 'voice' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mt-4"
        >
          {/* Text Mode Toggle */}
          <button
            onClick={() => setMode('text')}
            className="p-4 rounded-full bg-white border border-charcoal/10 text-charcoal hover:bg-charcoal/5 transition-all duration-300"
            title="Switch to Text"
          >
            <MessageSquare size={24} strokeWidth={1.5} />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              conversation.setVolume({ volume: next ? 0 : 1 });
            }}
            className={`p-4 rounded-full border transition-all duration-300 ${
              isMuted
                ? 'bg-charcoal text-linen border-charcoal'
                : 'bg-white text-charcoal border-charcoal/10 hover:bg-charcoal/5'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={24} strokeWidth={1.5} /> : <Volume2 size={24} strokeWidth={1.5} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endConversation}
            className="p-4 rounded-full bg-destructive text-white shadow-lg hover:bg-destructive/90 transition-all duration-300 transform hover:scale-105"
            title="End Session"
          >
            <PhoneOff size={24} strokeWidth={1.5} />
          </button>
        </motion.div>
      )}

      {/* 4. PRIVACY NOTE (Idle State) */}
      {status !== 'connected' && status !== 'connecting' && (
        <div className="mt-4 text-center opacity-50 animate-[fadeIn_1s_ease-out]">
          <p className="text-[10px] text-warm-grey uppercase tracking-widest font-medium">
            Each Session Starts Fresh
          </p>
        </div>
      )}

    </div>
  );
}