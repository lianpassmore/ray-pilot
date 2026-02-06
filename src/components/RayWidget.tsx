'use client';
import { useConversation } from '@elevenlabs/react';
import { motion } from 'framer-motion';
import { Mic, MicOff, MessageSquare, PhoneOff } from 'lucide-react';
import { useState } from 'react';
import AnimatedRayCircle from './AnimatedRayCircle';

export default function RayWidget({ userName }: { userName: string }) {
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');

  const conversation = useConversation({
    onConnect: () => console.log('Ray connected'),
    onDisconnect: () => console.log('Ray disconnected'),
    onError: (error) => console.error('Ray error:', error),
  });

  const { status, isSpeaking } = conversation;

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
      <p className="status-text mb-10">
        {status === 'connecting' && 'Connecting...'}
        {status === 'connected' && !isSpeaking && 'Listening'}
        {status === 'connected' && isSpeaking && 'Ray is speaking'}
        {status === 'disconnected' && 'Ready to start'}
      </p>

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

          {/* Emergency / Crisis Button */}
          <button
            onClick={triggerEmergency}
            className="p-4 rounded-full bg-red-900/30 border border-red-500 text-red-400"
            title="Emergency / Crisis"
          >
            <span className="font-bold">SOS</span>
          </button>

          {/* Mode Toggle (Placeholder for future text mode) */}
          <button
            onClick={() => setMode(mode === 'voice' ? 'text' : 'voice')}
            className="btn-disabled opacity-50"
            title="Text mode coming soon"
            disabled
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
      <p className="text-xs text-warm-grey text-center mt-4">
        Ray is an AI coach, not a therapist.
      </p>
    </div>
  );
}