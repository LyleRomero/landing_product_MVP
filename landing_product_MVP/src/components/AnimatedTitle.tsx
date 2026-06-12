import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
 
type Props = {
  text: string;
  // Color del texto. Por defecto blanco para verse sobre video oscuro.
  color?: string;
  // Tamaño del título. Por defecto 3rem.
  fontSize?: string;
  // Delay inicial antes de que empiece el stagger (en segundos).
  delay?: number;
};
 
export default function AnimatedTitle({
  text,
  color = "white",
  fontSize = "3rem",
  delay = 0,
}: Props) {
  const words = text.split(" ");
 
  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,  // tiempo entre cada palabra (reducido de 0.3 a 0.12)
        delayChildren: delay,
      },
    },
  };
 
  const child: Variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };
 
  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      style={{
        fontSize,
        textAlign: "center",
        color,
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {words.map((word: string, index: number) => (
        <motion.span
          key={index}
          variants={child}
          style={{
            marginRight: "0.28em",
            display: "inline-block",
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}
 