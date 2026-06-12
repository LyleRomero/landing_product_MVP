import { useRef, useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import ScrollSection from "./components/ScrollSection";
import AnimatedTitle from "./components/AnimatedTitle";
 
gsap.registerPlugin(ScrollTrigger);
 
// Duración exacta del video en segundos
const VIDEO_DURATION = 17;
 
// ── Mapa de velocidad personalizado ─────────────────────────────────────────
// Cada entrada: [scrollProgress (0-1), videoTime (segundos)]
// La pendiente entre dos puntos = velocidad del video en esa zona.
// Pendiente alta = el video avanza rápido con poco scroll (caída libre).
// Pendiente baja = el video avanza despacio con mucho scroll (pausa dramática).
//
// Video de 17s, drone sobre parque acercándose:
//   0.00 → 0.20  :  0s  → 2s   lento    — panorámica inicial, el usuario se orienta
//   0.20 → 0.50  :  2s  → 10s  rápido   — el drone se lanza hacia el parque
//   0.50 → 0.75  :  10s → 15s  muy lento — clímax, el parque llena la pantalla
//   0.75 → 1.00  :  15s → 17s  medio    — cierre suave
const KEYFRAMES: [number, number][] = [
  [0.00,  0],
  [0.20,  2],
  [0.50, 10],
  [0.75, 15],
  [1.00, 17],
];
 
// Interpola entre los keyframes para obtener el tiempo del video
// dado un progreso de scroll (0 a 1)
function getVideoTime(progress: number): number {
  for (let i = 1; i < KEYFRAMES.length; i++) {
    const [p0, t0] = KEYFRAMES[i - 1];
    const [p1, t1] = KEYFRAMES[i];
    if (progress <= p1) {
      const ratio = (progress - p0) / (p1 - p0);
      return t0 + (t1 - t0) * ratio;
    }
  }
  return VIDEO_DURATION;
}
 
export default function App() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
 
  // ── 1. Lenis smooth scroll + integración con GSAP ──────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,        // inercia del scroll (0.05 = muy suave, 0.15 = más ágil)
      smoothWheel: true,
    });
 
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
 
    return () => {
      lenis.destroy();
    };
  }, []);
 
  // ── 2. Video controlado por scroll con curva de velocidad ──────────────
  useEffect(() => {
    const video     = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
 
    const initGSAP = () => {
      // Altura total del scroll = VIDEO_DURATION × 100vh
      // Con 17s → 1700vh de scroll total. Ajusta el multiplicador si quieres
      // más o menos scroll (80 = más rápido en general, 120 = más lento).
      container.style.height = `${VIDEO_DURATION * 100}vh`;
 
      // ScrollTrigger con onUpdate para aplicar la curva personalizada
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,        // lag en segundos — más alto = más suave pero menos reactivo
        onUpdate: (self) => {
          const t = getVideoTime(self.progress);
          video.currentTime = t;
 
          // Oscurece el overlay en el clímax (scroll 45%-65%) para
          // dar dramatismo justo cuando el parque llena la pantalla
          if (overlayRef.current) {
            const p = self.progress;
            let opacity = 0.25; // opacidad base
            if (p >= 0.45 && p <= 0.65) {
              // Sube la oscuridad en el centro para que el texto resalte
              const peak = 1 - Math.abs((p - 0.55) / 0.10);
              opacity = 0.25 + peak * 0.30;
            }
            overlayRef.current.style.background = `rgba(0,0,0,${opacity})`;
          }
        },
      });
 
      // ── Animaciones de texto sincronizadas con la curva ──────────────
 
      // Texto 1: aparece mientras el drone acelera (scroll 18%-38%)
      // En ese momento el video está entre 1.8s y ~7s → vista aérea abierta
      gsap.fromTo("#texto-1",
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0,
          scrollTrigger: {
            trigger: container,
            start: "18% top",
            end: "26% top",
            scrub: true,
          },
        }
      );
      gsap.to("#texto-1", {
        opacity: 0, y: -36,
        scrollTrigger: {
          trigger: container,
          start: "38% top",
          end: "44% top",
          scrub: true,
        },
      });
 
      // Texto 2: aparece en el clímax (scroll 52%-70%)
      // En ese momento el video está entre ~11s y 15s → parque llena pantalla
      gsap.fromTo("#texto-2",
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0,
          scrollTrigger: {
            trigger: container,
            start: "52% top",
            end: "60% top",
            scrub: true,
          },
        }
      );
      gsap.to("#texto-2", {
        opacity: 0, y: -36,
        scrollTrigger: {
          trigger: container,
          start: "72% top",
          end: "78% top",
          scrub: true,
        },
      });
 
      // Texto 3: cierre (scroll 82%-95%) — el último frame del video
      gsap.fromTo("#texto-3",
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0,
          scrollTrigger: {
            trigger: container,
            start: "82% top",
            end: "90% top",
            scrub: true,
          },
        }
      );
    };
 
    if (video.readyState >= 1) {
      initGSAP();
    } else {
      video.addEventListener("loadedmetadata", initGSAP, { once: true });
    }
 
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
 
  return (
    <>
      {/* ── Video fijo en fondo ───────────────────────────────────────── */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          objectFit: "cover",
          zIndex: -2,
        }}
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>
 
      {/* ── Overlay dinámico — se oscurece en el clímax ──────────────── */}
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: -1,
          transition: "background 0.1s linear",
          pointerEvents: "none",
        }}
      />
 
      {/* ── Contenedor de scroll (altura calculada por GSAP) ─────────── */}
      <div ref={containerRef} style={{ position: "relative" }}>
 
        {/* Texto 1: vista aérea abierta, drone acelerando */}
        <div
          id="texto-1"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            textAlign: "center",
            width: "100%",
            maxWidth: "720px",
            padding: "0 24px",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <AnimatedTitle text="Un espacio para todos" fontSize="clamp(2rem, 5vw, 4rem)" />
          <p style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            marginTop: "16px",
            lineHeight: 1.6,
          }}>
            Descubre el parque desde una nueva perspectiva
          </p>
        </div>
 
        {/* Texto 2: clímax — el parque llena la pantalla */}
        <div
          id="texto-2"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            textAlign: "center",
            width: "100%",
            maxWidth: "720px",
            padding: "0 24px",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <AnimatedTitle text="Naturaleza en el corazón de la ciudad" fontSize="clamp(1.8rem, 4.5vw, 3.5rem)" />
          <p style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            marginTop: "16px",
            lineHeight: 1.6,
          }}>
            Hectáreas de verde a minutos de tu hogar
          </p>
        </div>
 
        {/* Texto 3: cierre final */}
        <div
          id="texto-3"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            textAlign: "center",
            width: "100%",
            maxWidth: "720px",
            padding: "0 24px",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <AnimatedTitle text="Bienvenido" fontSize="clamp(3rem, 7vw, 5.5rem)" delay={0.2} />
        </div>
      </div>
 
      {/* ── Secciones de contenido después del hero ──────────────────── */}
      <div style={{ background: "#0a0a0a", position: "relative", zIndex: 1 }}>
        <ScrollSection>
          <div style={{ textAlign: "center", color: "white", maxWidth: "640px", padding: "0 24px" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 500, marginBottom: "16px" }}>
              Especificaciones
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.7 }}>
              Aquí va el contenido de tu producto después del hero con video.
            </p>
          </div>
        </ScrollSection>
 
        <ScrollSection>
          <div style={{ textAlign: "center", color: "white", maxWidth: "640px", padding: "0 24px" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 500, marginBottom: "16px" }}>
              Características
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.7 }}>
              Segunda sección de contenido con animación fade-in al hacer scroll.
            </p>
          </div>
        </ScrollSection>
      </div>
    </>
  );
}