import { motion } from "framer-motion";
import Image from "next/image";

interface ImageCardProps {
  src: string;
  index: number;
  activeIndex: number;
  alt: string;
}

const ImageCard = ({ src, index, activeIndex, alt }: ImageCardProps) => {
  // Calculate slight tilt based on index
  const tiltAngle = index % 2 === 0 ? "3deg" : "-3deg";
  
  return (
    <div className="absolute w-[360px] aspect-[125/101] md:w-[500px] right-0 md:right-auto">
      <div className="absolute -top-[291px] overflow-hidden left-0 w-full h-full md:-top-[401px]">
        <div className={`w-full absolute z-10 top-0 left-0 h-20 bg-gradient-to-b from-whiteout dark:from-zinc-900 to-transparent`} />
        <div className={`h-full absolute z-10 top-0 w-4 md:w-20 right-[-5px] bg-gradient-to-l blur-[1px] from-whiteout dark:from-zinc-900 via-whiteout dark:via-zinc-900 to-transparent`} />
        <div className={`w-4 md:w-20 absolute top-0 z-10 left-0 h-full bg-gradient-to-r blur-[1px] from-whiteout dark:from-zinc-900 via-whiteout dark:via-zinc-900 to-transparent`} />
        
        <motion.div 
          className="top-0 left-0 w-full h-full md:translate-x-0 translate-x-14 pointer-events-none absolute"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3 }
          }}
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <motion.div 
              className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] shadow-lg"
              initial={{ rotate: 0 }}
              animate={{ 
                rotate: tiltAngle,
                transition: { duration: 0.3 }
              }}
              whileHover={{ 
                rotate: "0deg", 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover rounded-lg border-2 border-white/20 dark:border-black/20"
                sizes="(max-width: 768px) 180px, 220px"
                loading="eager"
                priority={index < 2}
              />
              <div className="absolute inset-0 rounded-lg shadow-inner bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImageCard; 