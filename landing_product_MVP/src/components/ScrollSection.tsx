import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { ReactNode, CSSProperties } from "react";
 
type Props = {
  children: ReactNode;
  // Altura de la sección. Por defecto 150vh para dar tiempo al fade-in.
  height?: string;
  // Alineación vertical del contenido dentro de la sección.
  align?: "center" | "flex-start" | "flex-end";
  // Estilos extra opcionales para el contenedor
  style?: CSSProperties;
};
 
export default function ScrollSection({
  children,
  height = "150vh",
  align = "center",
  style,
}: Props) {
  const ref = useRef(null);
 
  // Dispara la animación cuando la sección entra en el viewport.
  // margin: "-20%" hace que el trigger sea un poco antes del centro.
  const isInView = useInView(ref, { margin: "-20% 0px -20% 0px", once: false });
 
  return (
    <section
      ref={ref}
      style={{
        height,
        display: "flex",
        alignItems: align,
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{
          opacity: isInView ? 1 : 0,
          y: isInView ? 0 : 32,
        }}
        transition={{
          duration: 0.9,
          ease: [0.25, 0.1, 0.25, 1], // cubic-bezier suave, similar a Apple
        }}
        style={{ position: "relative", zIndex: 2, width: "100%" }}
      >
        {children}
      </motion.div>
    </section>
  );
}
 