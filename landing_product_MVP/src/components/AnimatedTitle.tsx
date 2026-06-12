import { motion } from "framer-motion";

type Props = {
  text: string;
};

export default function AnimatedTitle({ text }: Props) {
  const words = text.split(" ");

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ fontSize: "3rem", textAlign: "center" }}
    >
      {words.map((word: string, index: number) => (
        <motion.span
          key={index}
          variants={child}
          style={{ marginRight: "8px", display: "inline-block" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}