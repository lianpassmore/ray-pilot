'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, MessageSquare, PhoneOff, Send, X } from 'lucide-react';
import AnimatedRayCircle from './AnimatedRayCircle';

interface RayWidgetProps {
  userName: string;
  userId: string;
  onSessionEnd?: (conversationDbId: string) => void;
}

export default function RayWidget({ userName, userId, onSessionEnd }: RayWidgetProps) {
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
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
      // Capture incoming messages for text mode history
      if (message.message) {
        setMessages(prev => [...prev, { 
          role: message.source === 'user' ? 'user' : 'agent', 
          content: message.message 
        }]);
      }
    },
  });

  const { status, isSpeaking } = conversation;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mode]);

  // --- ACTIONS ---

  const startConversation = useCallback(async () => {
    try {
      setError(null);

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

  const toggleMute = async () => {
    // Note: Actual mute logic depends on SDK version capabilities
    // For now, we toggle visual state
    setIsMuted(!isMuted);
  };

  const sendTextMessage = async () => {
    if (!textInput.trim() || status !== 'connected') return;

    const userMessage = textInput.trim();
    // Optimistically add message to UI
    // setMessages(prev => [...prev, { role: 'user', content: userMessage }]); // SDK onMessage handles this usually
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

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto relative">

      {/* 1. THE INTERFACE (The Orb) */}
      <div className="mb-12 relative">
        <AnimatedRayCircle
          state={getCircleState()}
          size={220} // Large presence
          onClick={status === 'connected' ? endConversation : startConversation}
        />
        
        {/* Status Text Floating Below */}
        <div className="absolute -bottom-16 left-0 right-0 text-center">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
            error ? 'text-destructive' : 'text-warm-grey'
          }`}>
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* 2. TEXT CHAT MODE (Overlay) */}
      <AnimatePresence>
        {mode === 'text' && status === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute inset-0 z-20 flex flex-col h-[450px] w-full bg-white/90 backdrop-blur-md border border-charcoal/10 rounded-sm shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-charcoal/10 flex justify-between items-center bg-linen/50">
              <span className="text-xs font-bold uppercase tracking-widest text-charcoal">Text Mode</span>
              <button onClick={() => setMode('voice')} className="text-charcoal hover:text-clay transition-colors">
                <X size={20} strokeWidth={1.5} />
              </button>
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
          className="flex items-center gap-6 mt-8"
        >
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full border transition-all duration-300 ${
              isMuted
                ? 'bg-destructive/10 border-destructive text-destructive'
                : 'bg-white border-charcoal/10 text-charcoal hover:bg-charcoal/5'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={24} strokeWidth={1.5} /> : <Mic size={24} strokeWidth={1.5} />}
          </button>

          {/* Text Mode Toggle */}
          <button
            onClick={() => setMode('text')}
            className="p-4 rounded-full bg-white border border-charcoal/10 text-charcoal hover:bg-charcoal/5 transition-all duration-300"
            title="Switch to Text"
          >
            <MessageSquare size={24} strokeWidth={1.5} />
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

      {/* 4. Start Button (Initial State - Optional alternative to tapping circle) */}
      {status === 'disconnected' && !error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12"
        >
          <button
            onClick={startConversation}
            className="btn-clay shadow-xl shadow-clay/20"
          >
            Begin Session
          </button>
        </motion.div>
      )}

      {/* 5. PRIVACY NOTE (Idle State) */}
      {status !== 'connected' && (
        <div className="mt-8 text-center opacity-50 animate-[fadeIn_1s_ease-out]">
          <p className="text-[10px] text-warm-grey uppercase tracking-widest font-medium">
            Each Session Starts Fresh
          </p>
        </div>
      )}

    </div>
  );
}