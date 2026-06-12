import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function ScrollSection({ children }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-100px" });

  return (
    <section
      ref={ref}
      style={{
        height: "180vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {children}
      </motion.div>
    </section>
  );
}