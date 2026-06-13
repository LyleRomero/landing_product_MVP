import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import ScrollSection from "./components/ScrollSection";
import AnimatedTitle from "./components/AnimatedTitle";
 
// ── Configuración ────────────────────────────────────────────────────────────
// FPS de extracción. 24fps = buena fluidez, archivo ligero.
// Súbelo a 30 si quieres más suavidad (más RAM, más tiempo de carga).
const EXTRACT_FPS = 24;
 
// ── Escenas ──────────────────────────────────────────────────────────────────
interface Scene {
  startTime: number;
  endTime:   number;
  ease:      string;
  title:     string | null;
  sub:       string | null;
  overlay:   number;
}
 
const SCENES: Scene[] = [
  { startTime: 0,     endTime: 2.50,  ease: "power2.out",   title: "Un espacio para todos",       sub: "Descubre el parque desde una nueva perspectiva", overlay: 0.20 },
  { startTime: 2.51,  endTime: 9.10,  ease: "power1.inOut", title: null,                           sub: null,                                             overlay: 0.15 },
  { startTime: 9.11,  endTime: 13.0,  ease: "power2.out",   title: "Naturaleza en la ciudad",      sub: "Hectáreas de verde a minutos de tu hogar",       overlay: 0.40 },
  { startTime: 13.1,  endTime: 15.0,  ease: "power3.out",   title: "Naturaleza en la ciudad",      sub: "Hectáreas de verde a minutos de tu hogar",       overlay: 0.50 },
  { startTime: 15.1,  endTime: 17.0,  ease: "power2.inOut", title: "Bienvenido",                   sub: "El lugar que estabas buscando",                  overlay: 0.75 },
];
 
// ── Helpers ──────────────────────────────────────────────────────────────────
function timeToFrameIndex(time: number, fps: number): number {
  return Math.round(time * fps);
}
 
export default function App() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);
  const framesRef     = useRef<ImageBitmap[]>([]);
  const rafRef        = useRef<number>(0);
  const tweenRef      = useRef<gsap.core.Tween | null>(null);
  const lockRef       = useRef(true);
  const sceneRef      = useRef(0);
  const touchStartRef = useRef(0);
 
  const [sceneIndex,   setSceneIndex]   = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [ready,        setReady]        = useState(false);
  const [showContent,  setShowContent]  = useState(false);
 
  // ── Extraer todos los frames del video a ImageBitmap[] ──────────────────
  useEffect(() => {
    const canvas  = canvasRef.current;
    if (!canvas) return;
 
    const video = document.createElement("video");
    video.src        = "/video.mp4";
    video.muted      = true;
    video.playsInline = true;
    video.preload    = "auto";
 
    const extract = async () => {
      // Espera metadatos
      await new Promise<void>((res) => {
        if (video.readyState >= 1) { res(); return; }
        video.addEventListener("loadedmetadata", () => res(), { once: true });
      });
 
      const duration   = video.duration;
      const totalFrames = Math.ceil(duration * EXTRACT_FPS);
      const offscreen   = document.createElement("canvas");
      const ctx2d       = offscreen.getContext("2d")!;
 
      // Ajusta el canvas al tamaño de la ventana
      offscreen.width  = window.innerWidth;
      offscreen.height = window.innerHeight;
      canvas.width     = window.innerWidth;
      canvas.height    = window.innerHeight;
 
      const frames: ImageBitmap[] = [];
 
      for (let i = 0; i < totalFrames; i++) {
        const t = i / EXTRACT_FPS;
        video.currentTime = t;
 
        // Espera que el frame esté listo
        await new Promise<void>((res) => {
          const onSeeked = () => { video.removeEventListener("seeked", onSeeked); res(); };
          video.addEventListener("seeked", onSeeked);
        });
 
        // Dibuja el frame en el offscreen canvas y lo convierte a ImageBitmap
        ctx2d.drawImage(video, 0, 0, offscreen.width, offscreen.height);
        const bitmap = await createImageBitmap(offscreen);
        frames.push(bitmap);
 
        setLoadProgress(Math.round(((i + 1) / totalFrames) * 100));
      }
 
      framesRef.current = frames;
      video.remove();
 
      // Dibuja el primer frame
      drawFrame(0);
      lockRef.current = false;
      setReady(true);
    };
 
    extract();
  }, []);
 
  // ── Dibujar un frame específico en el canvas ─────────────────────────────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length === 0) return;
 
    const idx = Math.max(0, Math.min(frames.length - 1, Math.round(frameIndex)));
    const ctx  = canvas.getContext("2d");
    if (!ctx) return;
 
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      ctx.drawImage(frames[idx], 0, 0, canvas.width, canvas.height);
    });
  }, []);
 
  // ── Ir a una escena ──────────────────────────────────────────────────────
  const goToScene = useCallback((index: number) => {
    const overlay = overlayRef.current;
    if (!overlay || lockRef.current) return;
 
    const target = Math.max(0, Math.min(SCENES.length - 1, index));
    if (target === sceneRef.current) return;
 
    const scene      = SCENES[target];
    const startFrame = timeToFrameIndex(scene.startTime, EXTRACT_FPS);
    const endFrame   = timeToFrameIndex(scene.endTime,   EXTRACT_FPS);
 
    lockRef.current  = true;
    sceneRef.current = target;
    setSceneIndex(target);
 
    tweenRef.current?.kill();
 
    // Anima un número de frame (no currentTime) — instantáneo porque son bitmaps
    const proxy = { frame: startFrame };
 
    tweenRef.current = gsap.to(proxy, {
      frame:    endFrame,
      duration: 0.8,
      ease:     scene.ease,
      onUpdate: () => drawFrame(proxy.frame),
      onComplete: () => {
        setTimeout(() => { lockRef.current = false; }, 150);
      },
    });
 
    gsap.to(overlay, {
      background: `rgba(0,0,0,${scene.overlay})`,
      duration:   0.8,
      ease:       "power1.inOut",
    });
 
    if (target === SCENES.length - 1) setShowContent(true);
  }, [drawFrame]);
 
  // ── Eventos ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (showContent) return;
      e.preventDefault();
      goToScene(sceneRef.current + (e.deltaY > 0 ? 1 : -1));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [goToScene, showContent]);
 
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartRef.current = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      if (showContent) return;
      const delta = touchStartRef.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 30) return;
      goToScene(sceneRef.current + (delta > 0 ? 1 : -1));
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend",   onEnd);
    };
  }, [goToScene, showContent]);
 
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showContent) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goToScene(sceneRef.current + 1);
      if (e.key === "ArrowUp"   || e.key === "ArrowLeft")  goToScene(sceneRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToScene, showContent]);
 
  // ── Resize ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Redibuja el frame actual tras el resize
      const scene = SCENES[sceneRef.current];
      drawFrame(timeToFrameIndex(scene.endTime, EXTRACT_FPS));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawFrame]);
 
  const currentScene = SCENES[sceneIndex];
 
  return (
    <>
      {/* ── Canvas — reemplaza el video ─────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100vh",
          zIndex: -2,
          display: showContent ? "none" : "block",
          background: "#000",
        }}
      />
 
      {/* ── Overlay dinámico ─────────────────────────────────────────────── */}
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          background: `rgba(0,0,0,${SCENES[0].overlay})`,
          zIndex: -1,
          pointerEvents: "none",
          display: showContent ? "none" : "block",
        }}
      />
 
      {/* ── Pantalla de carga ───────────────────────────────────────────── */}
      {!ready && (
        <div style={{
          position: "fixed", inset: 0,
          background: "#000", zIndex: 10,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "20px",
        }}>
          {/* Barra de progreso */}
          <div style={{ width: "200px", height: "2px", background: "rgba(255,255,255,0.12)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${loadProgress}%`,
              background: "rgba(255,255,255,0.8)",
              borderRadius: "2px",
              transition: "width 0.2s ease",
            }} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.1em" }}>
            {loadProgress}%
          </p>
        </div>
      )}
 
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      {ready && !showContent && (
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 2, pointerEvents: "none",
          textAlign: "center", padding: "0 28px",
        }}>
          {currentScene.title && (
            <div key={`t-${sceneIndex}`}>
              <AnimatedTitle text={currentScene.title} fontSize="clamp(2rem, 5.5vw, 4.2rem)" />
            </div>
          )}
 
          {currentScene.sub && (
            <p key={`s-${sceneIndex}`} style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "clamp(0.9rem, 1.8vw, 1.15rem)",
              marginTop: "14px", lineHeight: 1.65, fontWeight: 400,
              opacity: 0, animation: "fadeUp 0.6s ease forwards 0.35s",
            }}>
              {currentScene.sub}
            </p>
          )}
 
          {sceneIndex === SCENES.length - 1 && (
            <button
              onClick={() => setShowContent(true)}
              style={{
                marginTop: "28px", background: "white", color: "#0a0a0a",
                border: "none", padding: "13px 38px", fontSize: "0.95rem",
                fontWeight: 500, borderRadius: "999px", cursor: "pointer",
                pointerEvents: "auto", opacity: 0,
                animation: "fadeUp 0.6s ease forwards 0.7s", letterSpacing: "0.02em",
              }}
            >
              Explorar
            </button>
          )}
 
          {/* Puntos de navegación */}
          <div style={{
            position: "fixed", right: "20px", top: "50%",
            transform: "translateY(-50%)",
            display: "flex", flexDirection: "column", gap: "10px",
            pointerEvents: "auto",
          }}>
            {SCENES.map((_, i) => (
              <button key={i} onClick={() => goToScene(i)} aria-label={`Escena ${i + 1}`}
                style={{
                  width: i === sceneIndex ? "8px" : "5px",
                  height: i === sceneIndex ? "8px" : "5px",
                  borderRadius: "50%", border: "none",
                  background: i === sceneIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)",
                  cursor: "pointer", padding: 0, transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}
 
      {/* ── Contenido post-hero ─────────────────────────────────────────── */}
      {showContent && (
        <div style={{ background: "#0a0a0a", minHeight: "100vh", position: "relative", zIndex: 1 }}>
          <ScrollSection>
            <div style={{ textAlign: "center", color: "white", maxWidth: "640px", padding: "0 24px" }}>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 500, marginBottom: "16px" }}>El parque</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.7 }}>
                Reemplaza este texto con la información real de tu proyecto.
              </p>
            </div>
          </ScrollSection>
          <ScrollSection>
            <div style={{ textAlign: "center", color: "white", maxWidth: "640px", padding: "0 24px" }}>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 500, marginBottom: "16px" }}>Características</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.7 }}>
                Segunda sección con animación fade-in al hacer scroll.
              </p>
            </div>
          </ScrollSection>
        </div>
      )}
 
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        body { overflow: ${showContent ? "auto" : "hidden"}; margin: 0; }
      `}</style>
    </>
  );
}
