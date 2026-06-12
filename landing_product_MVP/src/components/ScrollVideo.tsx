import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const init = () => {
      gsap.to(video, {
        currentTime: video.duration,
        ease: "none",
        scrollTrigger: {
          trigger: "#scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    };

    video.addEventListener("loadedmetadata", init);

    return () => {
      video.removeEventListener("loadedmetadata", init);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 w-full h-full object-cover -z-10"
      muted
      preload="auto"
      playsInline
    >
      <source src="/video.mp4" type="video/mp4" />
    </video>
  );
}