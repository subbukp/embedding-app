export function DecorativeShapes({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Purple vertical rectangles */}
      <div className="absolute right-[20%] top-0 w-16 h-[60%] bg-purple-dark/60 rounded-b-full" />
      <div className="absolute right-[15%] top-0 w-12 h-[50%] bg-purple-dark/40 rounded-b-full" />

      {/* Sage green oval - large */}
      <div className="absolute right-[5%] top-[10%] w-48 h-80 rounded-full bg-sage/30 border border-sage/40" />

      {/* Sage green oval - smaller overlay */}
      <div className="absolute right-[8%] top-[15%] w-40 h-72 rounded-full bg-sage/20 border border-sage/30" />

      {/* Additional decorative line */}
      <div className="absolute right-[25%] top-[20%] w-[1px] h-[60%] bg-sage/30" />
    </div>
  )
}
