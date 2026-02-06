'use client';
import { useConversation } from '@elevenlabs/react';
import { motion } from 'framer-motion';
import { Mic, MicOff, MessageSquare, PhoneOff, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import AnimatedRayCircle from './AnimatedRayCircle';

export default function RayWidget({ userName }: { userName: string }) {
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => console.log('Ray connected'),
    onDisconnect: () => console.log('Ray disconnected'),
    onError: (error) => console.error('Ray error:', error),
    onMessage: (message) => {
      // Handle incoming text messages in text mode
      if (mode === 'text' && message.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: message.message }]);
      }
    },
  });

  const { status, isSpeaking } = conversation;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Map conversation status to AnimatedRayCircle state
  const getCircleState = (): 'idle' | 'connected' | 'speaking' => {
    if (status !== 'connected') return 'idle';
    if (isSpeaking) return 'speaking';
    return 'connected';
  };

  const startConversation = async () => {
    try {
      const response = await fetch(`/api/elevenlabs?name=${encodeURIComponent(userName)}`);
      const { signedUrl } = await response.json();

      await conversation.startSession({
        signedUrl,
        dynamicVariables: { user_name: userName }
      });
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  const endConversation = async () => {
    await conversation.endSession();
  };

  const toggleMute = async () => {
    setIsMuted(!isMuted);
  };

  const triggerEmergency = () => {
    conversation.endSession(); // Kill AI immediately
    window.location.href = "tel:1737"; // Auto-dial mental health line (mobile only)
    // Or open a modal with numbers
  };

  const sendTextMessage = async () => {
    if (!textInput.trim() || status !== 'connected') return;

    // Add user message to chat
    const userMessage = textInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setTextInput('');

    try {
      // Send message to ElevenLabs conversation
      await conversation.sendUserInput(userMessage);
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

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-6">

      {/* Animated Ray Circle */}
      <div className="mb-10">
        <AnimatedRayCircle
          state={getCircleState()}
          size={200}
          onClick={status === 'connected' ? endConversation : startConversation}
        />
      </div>

      {/* Status Text */}
      {mode === 'voice' && (
        <p className="status-text mb-10">
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && !isSpeaking && 'Listening'}
          {status === 'connected' && isSpeaking && 'Ray is speaking'}
          {status === 'disconnected' && 'Ready to start'}
        </p>
      )}

      {/* Text Chat UI (Only visible when in text mode and connected) */}
      {mode === 'text' && status === 'connected' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full mb-6 bg-white rounded-[2px] border border-charcoal/10 p-4"
        >
          {/* Messages */}
          <div className="h-64 overflow-y-auto mb-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-warm-grey text-sm text-center mt-8">
                Start chatting with Ray...
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-[2px] ${
                      msg.role === 'user'
                        ? 'bg-forest-green text-linen'
                        : 'bg-linen text-charcoal'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Text Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="input-field flex-1"
            />
            <button
              onClick={sendTextMessage}
              disabled={!textInput.trim()}
              className={textInput.trim() ? 'btn-primary px-4' : 'btn-disabled px-4'}
            >
              <Send size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* CONTROLS (Only visible when connected) */}
      {status === 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 mb-6"
        >
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-[2px] border transition-all ${
              isMuted
                ? 'bg-destructive/20 border-destructive text-linen'
                : 'bg-forest-green border-charcoal/20 text-linen'
            }`}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Mode Toggle */}
          <button
            onClick={() => setMode(mode === 'voice' ? 'text' : 'voice')}
            className={`p-3 rounded-[2px] border transition-all ${
              mode === 'text'
                ? 'bg-forest-green border-charcoal/20 text-linen'
                : 'bg-linen border-charcoal/20 text-charcoal'
            }`}
            title={mode === 'voice' ? 'Switch to text mode' : 'Switch to voice mode'}
          >
            <MessageSquare size={20} />
          </button>

          {/* End Call Button */}
          <button
            onClick={endConversation}
            className="btn-secondary"
          >
            <PhoneOff size={20} />
          </button>
        </motion.div>
      )}

      {/* Start Button (when not connected) */}
      {status !== 'connected' && (
        <button
          onClick={startConversation}
          disabled={status === 'connecting'}
          className={status === 'connecting' ? 'btn-disabled' : 'btn-primary w-full'}
        >
          {status === 'connecting' ? 'Connecting...' : 'Talk to Ray'}
        </button>
      )}

      {/* Grounding Text */}
      <p className="grounding-text mt-6 text-center">
        Feet on the floor. Take a breath.
      </p>

      {/* Disclaimer */}
      <div className="text-xs text-warm-grey text-center mt-4 space-y-1">
        <p>Ray is an AI coach, not a therapist.</p>
        <p>Each session starts fresh—Ray has no memory of previous conversations.</p>
      </div>
    </div>
  );
}