import { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(1);

  // 🔥 Scroll global
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 🔥 Mapear scroll → tiempo del video
  const currentTime = useTransform(scrollYProgress, [0, 1], [0, duration]);

  // 🔥 Sincronizar video con scroll
  useEffect(() => {
    const unsubscribe = currentTime.on("change", (t) => {
      if (videoRef.current) {
        videoRef.current.currentTime = t;
      }
    });

    return () => unsubscribe();
  }, [currentTime]);

  return (
    <div ref={containerRef} style={{ height: "300vh" }}>

      {/* 🎥 VIDEO CONTROLADO POR SCROLL */}
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
          zIndex: -1,
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
        }}
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>

      {/* 🧠 CONTENIDO */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          color: "gray",
          paddingTop: "40vh",
          textAlign: "center",
        }}
      >
        <h1>Scroll controla el video 🔥</h1>
        <p>Esto ya es nivel Apple</p>
      </div>

    </div>
  );
}