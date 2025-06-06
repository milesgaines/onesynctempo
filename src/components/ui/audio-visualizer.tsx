import React, { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  audioUrl?: string;
  className?: string;
  barCount?: number;
  barColor?: string;
  barWidth?: number;
  barSpacing?: number;
  height?: number;
  playing?: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioUrl,
  className = "",
  barCount = 40,
  barColor = "rgba(124, 58, 237, 0.8)",
  barWidth = 3,
  barSpacing = 1,
  height = 40,
  playing = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(playing);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioUrl) {
      // If no audio URL, create simulated data
      const simulatedArray = new Uint8Array(barCount);
      setDataArray(simulatedArray);
      return;
    }

    // Create audio element
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audioRef.current = audio;

    // Create audio context and analyzer
    const context = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyzerNode = context.createAnalyser();
    analyzerNode.fftSize = 256;
    const bufferLength = analyzerNode.frequencyBinCount;
    const dataArr = new Uint8Array(bufferLength);

    // Connect audio to analyzer
    const source = context.createMediaElementSource(audio);
    source.connect(analyzerNode);
    analyzerNode.connect(context.destination);

    setAudioContext(context);
    setAnalyser(analyzerNode);
    setDataArray(dataArr);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (context.state !== "closed") {
        context.close();
      }
    };
  }, [audioUrl, barCount]);

  // Handle play/pause
  useEffect(() => {
    if (playing !== isPlaying) {
      setIsPlaying(playing);
    }
  }, [playing]);

  // Play/pause audio when isPlaying changes
  useEffect(() => {
    if (!audioRef.current || !audioContext) return;

    if (isPlaying) {
      audioContext.resume().then(() => {
        audioRef.current?.play();
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioContext]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || !dataArray) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      ctx.clearRect(0, 0, width, height);

      // If we have real audio data
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Simulate audio data for preview
        for (let i = 0; i < dataArray.length; i++) {
          const randomValue = Math.random() * 100;
          dataArray[i] = isPlaying ? randomValue : 0;
        }
      }

      // Calculate how many bars to draw
      const totalBars = Math.min(barCount, dataArray.length);
      const step = Math.floor(dataArray.length / totalBars);

      // Draw bars
      for (let i = 0; i < totalBars; i++) {
        const index = i * step;
        const value = dataArray[index];
        const barHeight = (value / 255) * height;
        const x = i * (barWidth + barSpacing);
        const y = height - barHeight;

        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    dataArray,
    analyser,
    barCount,
    barColor,
    barWidth,
    barSpacing,
    height,
    isPlaying,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={(barWidth + barSpacing) * barCount - barSpacing}
      height={height}
    />
  );
};

export { AudioVisualizer };
