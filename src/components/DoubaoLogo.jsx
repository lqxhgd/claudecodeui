export default function DoubaoLogo({ className = 'w-5 h-5' }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-md bg-orange-500`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4">
        {/* Bean/chat bubble icon - Doubao style */}
        <path
          d="M12 3C7.58 3 4 6.13 4 10c0 2.27 1.18 4.28 3.02 5.6-.17 1.08-.6 2.08-1.22 2.9a.5.5 0 0 0 .4.8c1.76-.08 3.32-.72 4.5-1.63.74.14 1.52.23 2.3.23 4.42 0 8-3.13 8-7s-3.58-7-8-7z"
          fill="white"
          opacity="0.95"
        />
        {/* Smile */}
        <circle cx="9.5" cy="9.5" r="1" fill="#F97316" />
        <circle cx="14.5" cy="9.5" r="1" fill="#F97316" />
        <path
          d="M9.5 12.5c0 0 1 1.5 2.5 1.5s2.5-1.5 2.5-1.5"
          stroke="#F97316"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
