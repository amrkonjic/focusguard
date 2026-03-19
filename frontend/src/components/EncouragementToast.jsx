import { useEffect } from "react";

export default function EncouragementToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 bg-indigo-950 border border-indigo-500 rounded-2xl px-5 py-4 flex items-center gap-3 max-w-xs shadow-2xl z-50 animate-fade-in">
      <span className="text-xl">💬</span>
      <span className="text-indigo-100 text-sm flex-1">{message}</span>
      <button onClick={onClose} className="text-indigo-400 hover:text-indigo-200 text-base transition-colors">✕</button>
    </div>
  );
}