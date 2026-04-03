import { useEffect, useRef } from "react";
import { computeNextGeneration, randomizeGrid } from "../features/game/engine";
import type { Grid } from "../features/game/types";

interface BackgroundLifeCanvasProps {
  className?: string;
  cellSize?: number;
}

export function BackgroundLifeCanvas({
  className = "",
  cellSize = 18,
}: BackgroundLifeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Grid>([]);
  const frameRef = useRef(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const canvasElement = canvas;
    const drawingContext = context;

    function resizeCanvas() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const columns = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      canvasElement.width = width * window.devicePixelRatio;
      canvasElement.height = height * window.devicePixelRatio;
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;
      drawingContext.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      gridRef.current = randomizeGrid(columns, rows, 0.18);
    }

    function drawGrid(grid: Grid) {
      drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
      drawingContext.fillStyle = "rgba(9, 9, 9, 0.9)";
      drawingContext.fillRect(0, 0, window.innerWidth, window.innerHeight);

      for (let y = 0; y < grid.length; y += 1) {
        for (let x = 0; x < grid[y].length; x += 1) {
          drawingContext.fillStyle =
            grid[y][x] === 1 ? "rgba(255, 255, 255, 0.95)" : "rgba(95, 94, 94, 0.18)";
          drawingContext.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);

          if (grid[y][x] === 1) {
            drawingContext.fillStyle = "rgba(0, 240, 255, 0.12)";
            drawingContext.fillRect(
              x * cellSize - 1,
              y * cellSize - 1,
              cellSize + 1,
              cellSize + 1,
            );
          }
        }
      }
    }

    function loop(timestamp: number) {
      if (timestamp - lastTickRef.current > 180) {
        gridRef.current = computeNextGeneration(gridRef.current);
        lastTickRef.current = timestamp;
      }

      drawGrid(gridRef.current);
      frameRef.current = requestAnimationFrame(loop);
    }

    resizeCanvas();
    frameRef.current = requestAnimationFrame(loop);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(frameRef.current);
    };
  }, [cellSize]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
