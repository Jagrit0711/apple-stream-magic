import { motion } from "framer-motion";

export const SkeletonCard = () => (
  <div className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px]">
    <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse border border-white/5" />
    <div className="mt-3 h-4 w-3/4 bg-white/5 rounded animate-pulse" />
    <div className="mt-2 h-3 w-1/2 bg-white/5 rounded animate-pulse opacity-50" />
  </div>
);

export const SkeletonShelf = () => (
  <div className="mb-10 px-4 sm:px-6 md:px-8 max-w-[1700px] mx-auto overflow-hidden">
    <div className="h-8 w-48 bg-white/5 rounded-lg mb-6 animate-pulse" />
    <div className="flex gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

export const SkeletonHero = () => (
  <div className="relative w-full h-[70vh] sm:h-[80vh] bg-white/5 animate-pulse mb-8 overflow-hidden">
     <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
     <div className="absolute bottom-20 left-8 max-w-xl space-y-4">
        <div className="h-12 w-3/4 bg-white/10 rounded-2xl" />
        <div className="h-4 w-1/2 bg-white/10 rounded-lg" />
        <div className="flex gap-3">
           <div className="h-10 w-32 bg-white/10 rounded-full" />
           <div className="h-10 w-32 bg-white/10 rounded-full" />
        </div>
     </div>
  </div>
);
