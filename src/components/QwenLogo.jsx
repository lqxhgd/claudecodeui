export default function QwenLogo({ className = 'w-5 h-5' }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-md bg-indigo-600`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4">
        {/* Cloud icon - Alibaba Cloud / Qwen style */}
        <path
          d="M6.5 18.5C4.01 18.5 2 16.49 2 14c0-2.12 1.47-3.89 3.44-4.37C6.11 7.09 8.28 5 11 5c2.39 0 4.39 1.63 4.93 3.84C18.2 9.17 20 11.18 20 13.6c0 2.7-2.19 4.9-4.9 4.9H6.5z"
          fill="white"
        />
      </svg>
    </div>
  );
}
