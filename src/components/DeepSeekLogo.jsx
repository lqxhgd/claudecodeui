export default function DeepSeekLogo({ className = 'w-5 h-5' }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-md bg-blue-600`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4">
        {/* Neural brain icon - DeepSeek style */}
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
          fill="white"
          opacity="0.9"
        />
        <rect x="9" y="19" width="6" height="1.5" rx="0.5" fill="white" opacity="0.7" />
        <rect x="10" y="21.5" width="4" height="1" rx="0.5" fill="white" opacity="0.5" />
        {/* Neural connection dots */}
        <circle cx="10" cy="8" r="1" fill="#2563EB" />
        <circle cx="14" cy="8" r="1" fill="#2563EB" />
        <circle cx="12" cy="11" r="1" fill="#2563EB" />
        <line x1="10" y1="8" x2="12" y2="11" stroke="#2563EB" strokeWidth="0.7" />
        <line x1="14" y1="8" x2="12" y2="11" stroke="#2563EB" strokeWidth="0.7" />
        <line x1="10" y1="8" x2="14" y2="8" stroke="#2563EB" strokeWidth="0.7" />
      </svg>
    </div>
  );
}
