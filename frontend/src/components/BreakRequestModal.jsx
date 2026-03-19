export default function BreakRequestModal({ duration, onApprove, onDeny }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Break Request</h2>
        <p className="text-neutral-500 mb-2 leading-relaxed">
          Your focuser is asking for a break.
        </p>
        <p className="text-white font-semibold mb-8">
          Requested duration: <span className="text-orange-400">{duration} minutes</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 py-3 rounded-xl border border-red-500 text-red-400 hover:bg-red-500/10 font-semibold transition-colors"
          >
            Keep Going 💪
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
          >
            Allow Break ✓
          </button>
        </div>
      </div>
    </div>
  );
}