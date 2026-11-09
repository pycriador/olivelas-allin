import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize, Minimize, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export function ImageZoom({ src, alt, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fit, setFit] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const reset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setFit(true);
  }, []);

  const toggleFit = useCallback(() => {
    setFit((f) => !f);
    if (!fit) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [fit]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s * 1.5, 10));
    setFit(false);
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = s / 1.5;
      if (next < 0.25) return s;
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "=" || e.key === "+") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen, zoomIn, zoomOut, reset]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    reset();
  }, [src, reset]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setFit(false);
    setScale((s) => {
      const delta = -e.deltaY * 0.002;
      return Math.max(0.25, Math.min(10, s + delta * s));
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [scale, position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (fit) {
        setFit(false);
        setScale(2);
      } else {
        reset();
      }
    },
    [fit, reset],
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative flex min-h-0 items-center justify-center overflow-hidden bg-foreground", className)}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "default" }}
    >
      <motion.img
        ref={imageRef}
        src={src}
        alt={alt}
        draggable={false}
        style={{
          scale: fit ? undefined : scale,
          x: fit ? 0 : position.x,
          y: fit ? 0 : position.y,
        }}
        animate={fit ? { scale: 1, x: 0, y: 0 } : undefined}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className={cn(
          "block max-h-full max-w-full select-none",
          fit ? "h-full w-full object-contain" : "",
        )}
      />

      <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-0.5 rounded-full bg-background/90 px-1.5 py-1 shadow-sm sm:bottom-4 sm:gap-1 sm:px-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} title="Reduzir (-)">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(fit ? 100 : scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Ampliar (+)">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFit} title="Ajustar à tela">
          <Scan className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title="Tela cheia (F)">
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
