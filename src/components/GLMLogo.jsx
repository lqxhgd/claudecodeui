export default function GLMLogo({ className = 'w-5 h-5' }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-md bg-sky-500`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4">
        {/* AI chip icon - GLM / Zhipu style */}
        <rect x="6" y="6" width="12" height="12" rx="2" fill="white" opacity="0.9" />
        {/* Inner circuit pattern */}
        <rect x="9" y="9" width="6" height="6" rx="1" fill="#0EA5E9" />
        <circle cx="12" cy="12" r="1.5" fill="white" />
        {/* Chip pins */}
        <rect x="9" y="3.5" width="1.5" height="3" rx="0.5" fill="white" opacity="0.8" />
        <rect x="13.5" y="3.5" width="1.5" height="3" rx="0.5" fill="white" opacity="0.8" />
        <rect x="9" y="17.5" width="1.5" height="3" rx="0.5" fill="white" opacity="0.8" />
        <rect x="13.5" y="17.5" width="1.5" height="3" rx="0.5" fill="white" opacity="0.8" />
        <rect x="3.5" y="9" width="3" height="1.5" rx="0.5" fill="white" opacity="0.8" />
        <rect x="3.5" y="13.5" width="3" height="1.5" rx="0.5" fill="white" opacity="0.8" />
        <rect x="17.5" y="9" width="3" height="1.5" rx="0.5" fill="white" opacity="0.8" />
        <rect x="17.5" y="13.5" width="3" height="1.5" rx="0.5" fill="white" opacity="0.8" />
      </svg>
    </div>
  );
}
