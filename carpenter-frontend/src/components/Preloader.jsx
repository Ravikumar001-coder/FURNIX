import { useEffect, useState } from 'react'
import KannaIcon from './ui/KannaIcon'

const Preloader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [curl, setCurl]         = useState(false)

  useEffect(() => {
    // Animate progress bar
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 400)
          return 100
        }
        return prev + 2
      })
    }, 30)

    // Trigger curl animation
    setTimeout(() => setCurl(true), 200)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="preloader fixed inset-0 z-[9999]
                    flex flex-col items-center justify-center
                    animate-fade-in">

      {/* Kanna icon with animation */}
      <div className={`transition-all duration-700 ${curl ? 'animate-kanna-slide' : ''}`}>
        <KannaIcon size={80} />
      </div>

      {/* Wood curl particles */}
      {curl && (
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 pointer-events-none">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-bronze opacity-60"
              style={{
                animation: `curlRise ${1.5 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
                left: `${(i - 1) * 16}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Text */}
      <p className="font-sans text-xs tracking-[0.4em] uppercase text-bronze-light mt-10 mb-8">
        Preparing the Workshop...
      </p>

      {/* Progress bar */}
      <div className="w-48 h-0.5 bg-wood-raised">
        <div
          className="h-full bg-bronze-gradient transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="font-mono text-xs text-cream-muted/30 mt-3">
        {progress}%
      </p>
    </div>
  )
}

export default Preloader