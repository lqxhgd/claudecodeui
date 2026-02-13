export default function KimiLogo({ className = 'w-5 h-5' }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-md bg-purple-600`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4">
        {/* Crescent moon icon - Moonshot AI style */}
        <path
          d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9c1.66 0 3.22-.45 4.56-1.24a7 7 0 0 1-1.06-12.52A8.96 8.96 0 0 0 12 3z"
          fill="white"
        />
        <circle cx="16" cy="7" r="1.2" fill="white" opacity="0.8" />
        <circle cx="18.5" cy="10" r="0.8" fill="white" opacity="0.6" />
      </svg>
    </div>
  );
}
