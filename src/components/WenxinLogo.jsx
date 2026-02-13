export default function WenxinLogo({ className = 'w-5 h-5' }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-md bg-blue-500`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4">
        {/* Brush/pen icon - Wenxin Yiyan (ERNIE Bot) style */}
        <path
          d="M7 21l4.2-4.2M16.8 4.6l2.6 2.6c.5.5.5 1.3 0 1.8L10 18.4l-4.4.8.8-4.4L15.8 5.4c.3-.3.6-.4 1-.4z"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.5 7l3 3"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Decorative ink splash dots */}
        <circle cx="5" cy="6" r="1.2" fill="white" opacity="0.6" />
        <circle cx="8" cy="4" r="0.8" fill="white" opacity="0.4" />
      </svg>
    </div>
  );
}
