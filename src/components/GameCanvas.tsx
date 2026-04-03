import { PointerEvent, useEffect, useMemo, useRef } from "react";
import type { Grid } from "../features/game/types";

interface GameCanvasProps {
  grid: Grid;
  onToggleCell: (x: number, y: number) => void;
  onPaintCell: (x: number, y: number, value: 0 | 1) => void;
}

export function GameCanvas({ grid, onToggleCell, onPaintCell }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerValueRef = useRef<0 | 1>(1);
  const isPointerDownRef = useRef(false);

  const metrics = useMemo(() => {
    const width = grid[0]?.length ?? 0;
    const height = grid.length;
    const cellSize = Math.max(
      10,
      Math.floor(Math.min(900 / Math.max(width, 1), 720 / Math.max(height, 1))),
    );
    return {
      width,
      height,
      cellSize,
      canvasWidth: width * cellSize,
      canvasHeight: height * cellSize,
    };
  }, [grid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.width = metrics.canvasWidth * window.devicePixelRatio;
    canvas.height = metrics.canvasHeight * window.devicePixelRatio;
    canvas.style.width = `${metrics.canvasWidth}px`;
    canvas.style.height = `${metrics.canvasHeight}px`;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    context.clearRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);

    for (let y = 0; y < metrics.height; y += 1) {
      for (let x = 0; x < metrics.width; x += 1) {
        context.fillStyle = grid[y][x] === 1 ? "#FFFFFF" : "#171717";
        context.fillRect(
          x * metrics.cellSize,
          y * metrics.cellSize,
          metrics.cellSize - 1,
          metrics.cellSize - 1,
        );

        if (grid[y][x] === 1) {
          context.fillStyle = "rgba(0, 240, 255, 0.14)";
          context.fillRect(
            x * metrics.cellSize - 1,
            y * metrics.cellSize - 1,
            metrics.cellSize + 1,
            metrics.cellSize + 1,
          );
        }
      }
    }
  }, [grid, metrics]);

  function resolveCell(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / metrics.cellSize);
    const y = Math.floor((event.clientY - rect.top) / metrics.cellSize);
    return { x, y };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const { x, y } = resolveCell(event);
    if (x < 0 || y < 0 || x >= metrics.width || y >= metrics.height) {
      return;
    }

    pointerValueRef.current = grid[y][x] === 1 ? 0 : 1;
    isPointerDownRef.current = true;
    onToggleCell(x, y);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!isPointerDownRef.current) {
      return;
    }

    const { x, y } = resolveCell(event);
    if (x < 0 || y < 0 || x >= metrics.width || y >= metrics.height) {
      return;
    }

    onPaintCell(x, y, pointerValueRef.current);
  }

  function handlePointerUp() {
    isPointerDownRef.current = false;
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="glow-pulse max-w-full rounded-[28px] bg-[#0d0d0d] shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
    />
  );
}
