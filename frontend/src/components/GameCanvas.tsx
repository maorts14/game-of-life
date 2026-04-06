import {
  PointerEvent,
  WheelEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { getPatternById } from "../features/game/presets";
import type { PatternDefinition, SelectionBounds } from "../features/game/presets";
import type { Grid } from "../features/game/types";

export interface GameCanvasHandle {
  dropPatternAtClientPoint: (clientX: number, clientY: number) => void;
}

interface GameCanvasProps {
  grid: Grid;
  onToggleCell: (x: number, y: number) => void;
  onPaintCell: (x: number, y: number, value: 0 | 1) => void;
  activePatternId?: string | null;
  patterns?: PatternDefinition[];
  onDropPattern?: (patternId: string, x: number, y: number) => void;
  isSelectionMode?: boolean;
  onSelectionComplete?: (selection: SelectionBounds) => void;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas({
  grid,
  onToggleCell,
  onPaintCell,
  activePatternId,
  patterns = [],
  onDropPattern,
  isSelectionMode = false,
  onSelectionComplete,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointerValueRef = useRef<0 | 1>(1);
  const isPointerDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const isPatternDraggingRef = useRef(false);
  const touchPatternPreviewArmedRef = useRef(false);
  const touchPatternMovedRef = useRef(false);
  const touchPatternStartCellRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  const metrics = useMemo(() => {
    const width = grid[0]?.length ?? 0;
    const height = grid.length;
    const viewportWidth =
      typeof window === "undefined"
        ? 1400
        : Math.max(320, window.innerWidth - (window.innerWidth >= 1280 ? 560 : 96));
    const viewportHeight =
      typeof window === "undefined"
        ? 820
        : Math.max(240, window.innerHeight - (window.innerWidth >= 1280 ? 240 : 220));
    const cellSize = Math.max(
      4,
      Math.floor(
        Math.min(viewportWidth / Math.max(width, 1), viewportHeight / Math.max(height, 1)),
      ),
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
    if (!viewportRef.current) {
      return undefined;
    }
    const viewportElement = viewportRef.current;

    function updateViewportSize() {
      const rect = viewportElement.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    }

    updateViewportSize();
    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(viewportElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [metrics.canvasWidth, metrics.canvasHeight]);

  const activePattern = activePatternId ? getPatternById(activePatternId, patterns) : undefined;

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isSelectionMode]);

  useEffect(() => {
    touchPatternPreviewArmedRef.current = false;
    touchPatternMovedRef.current = false;
    touchPatternStartCellRef.current = null;
  }, [activePatternId]);

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

    if (activePattern && hoverCell) {
      const previewOriginX = hoverCell.x - Math.floor(activePattern.width / 2);
      const previewOriginY = hoverCell.y - Math.floor(activePattern.height / 2);

      for (const [offsetX, offsetY] of activePattern.cells) {
        const previewX = previewOriginX + offsetX;
        const previewY = previewOriginY + offsetY;

        if (
          previewX < 0 ||
          previewY < 0 ||
          previewX >= metrics.width ||
          previewY >= metrics.height
        ) {
          continue;
        }

        context.fillStyle = "rgba(0, 240, 255, 0.45)";
        context.fillRect(
          previewX * metrics.cellSize,
          previewY * metrics.cellSize,
          metrics.cellSize - 1,
          metrics.cellSize - 1,
        );
      }
    }

    if (isSelectionMode && selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      context.fillStyle = "rgba(0, 240, 255, 0.14)";
      context.fillRect(
        minX * metrics.cellSize,
        minY * metrics.cellSize,
        (maxX - minX + 1) * metrics.cellSize - 1,
        (maxY - minY + 1) * metrics.cellSize - 1,
      );
      context.strokeStyle = "rgba(125, 244, 255, 0.85)";
      context.lineWidth = 2;
      context.strokeRect(
        minX * metrics.cellSize + 1,
        minY * metrics.cellSize + 1,
        (maxX - minX + 1) * metrics.cellSize - 3,
        (maxY - minY + 1) * metrics.cellSize - 3,
      );
    }
  }, [activePattern, grid, hoverCell, isSelectionMode, metrics, selectionEnd, selectionStart]);

  function getBaseOffset(nextScale: number) {
    return {
      x: Math.max(0, (viewportSize.width - metrics.canvasWidth * nextScale) / 2),
      y: Math.max(0, (viewportSize.height - metrics.canvasHeight * nextScale) / 2),
    };
  }

  function clampPan(nextScale: number, nextPan: { x: number; y: number }) {
    const scaledWidth = metrics.canvasWidth * nextScale;
    const scaledHeight = metrics.canvasHeight * nextScale;

    return {
      x:
        scaledWidth <= viewportSize.width
          ? 0
          : Math.min(0, Math.max(viewportSize.width - scaledWidth, nextPan.x)),
      y:
        scaledHeight <= viewportSize.height
          ? 0
          : Math.min(0, Math.max(viewportSize.height - scaledHeight, nextPan.y)),
    };
  }

  const baseOffset = getBaseOffset(scale);
  const transform = `translate(${baseOffset.x + pan.x}px, ${baseOffset.y + pan.y}px) scale(${scale})`;

  function resolveClientPoint(clientX: number, clientY: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: -1, y: -1 };
    }

    const localX = (clientX - rect.left - baseOffset.x - pan.x) / scale;
    const localY = (clientY - rect.top - baseOffset.y - pan.y) / scale;
    const x = Math.floor(localX / metrics.cellSize);
    const y = Math.floor(localY / metrics.cellSize);
    return { x, y };
  }

  function resolveCell(event: PointerEvent<HTMLElement>) {
    return resolveClientPoint(event.clientX, event.clientY);
  }

  useImperativeHandle(
    ref,
    () => ({
      dropPatternAtClientPoint(clientX: number, clientY: number) {
        if (!activePattern) {
          return;
        }

        const { x, y } = resolveClientPoint(clientX, clientY);
        onDropPattern?.(activePattern.id, x, y);
      },
    }),
    [activePattern, onDropPattern, pan.x, pan.y, scale, metrics.cellSize, baseOffset.x, baseOffset.y],
  );

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isSelectionMode) {
      const { x, y } = resolveCell(event);
      if (x < 0 || y < 0 || x >= metrics.width || y >= metrics.height) {
        return;
      }

      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (activePattern) {
      const { x, y } = resolveCell(event);
      if (event.pointerType === "touch") {
        isPatternDraggingRef.current = true;
        touchPatternMovedRef.current = false;
        touchPatternStartCellRef.current = { x, y };
        if (!touchPatternPreviewArmedRef.current || hoverCell === null) {
          setHoverCell({ x, y });
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      onDropPattern?.(activePattern.id, x, y);
      return;
    }

    if (event.button === 1 || event.button === 2) {
      isPanningRef.current = true;
      panStartRef.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const { x, y } = resolveCell(event);
    if (x < 0 || y < 0 || x >= metrics.width || y >= metrics.height) {
      return;
    }

    pointerValueRef.current = grid[y][x] === 1 ? 0 : 1;
    isPointerDownRef.current = true;
    onToggleCell(x, y);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const nextCell = resolveCell(event);
    if (activePattern) {
      if (
        isPatternDraggingRef.current &&
        touchPatternStartCellRef.current &&
        (nextCell.x !== touchPatternStartCellRef.current.x ||
          nextCell.y !== touchPatternStartCellRef.current.y)
      ) {
        touchPatternMovedRef.current = true;
      }
      setHoverCell(nextCell);
    } else if (
      nextCell.x >= 0 &&
      nextCell.y >= 0 &&
      nextCell.x < metrics.width &&
      nextCell.y < metrics.height
    ) {
      setHoverCell(nextCell);
    } else if (hoverCell !== null) {
      setHoverCell(null);
    }

    if (isSelectionMode && selectionStart) {
      if (
        nextCell.x >= 0 &&
        nextCell.y >= 0 &&
        nextCell.x < metrics.width &&
        nextCell.y < metrics.height
      ) {
        setSelectionEnd(nextCell);
      }
      return;
    }

    if (activePattern && isPatternDraggingRef.current) {
      return;
    }

    if (isPanningRef.current) {
      const nextPan = clampPan(scale, {
        x: event.clientX - panStartRef.current.x,
        y: event.clientY - panStartRef.current.y,
      });
      setPan(nextPan);
      return;
    }

    if (!isPointerDownRef.current) {
      return;
    }

    const { x, y } = resolveCell(event);
    if (x < 0 || y < 0 || x >= metrics.width || y >= metrics.height) {
      return;
    }

    onPaintCell(x, y, pointerValueRef.current);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (activePattern && isPatternDraggingRef.current) {
      const { x, y } = resolveCell(event);
      if (event.pointerType === "touch") {
        const nextHoverCell = hoverCell ?? { x, y };

        if (touchPatternMovedRef.current || !touchPatternPreviewArmedRef.current) {
          setHoverCell({ x, y });
          touchPatternPreviewArmedRef.current = true;
          isPatternDraggingRef.current = false;
          touchPatternMovedRef.current = false;
          touchPatternStartCellRef.current = null;
          return;
        }

        onDropPattern?.(activePattern.id, nextHoverCell.x, nextHoverCell.y);
        touchPatternPreviewArmedRef.current = false;
        isPatternDraggingRef.current = false;
        touchPatternMovedRef.current = false;
        touchPatternStartCellRef.current = null;
        setHoverCell(null);
        return;
      }

      onDropPattern?.(activePattern.id, x, y);
      touchPatternPreviewArmedRef.current = false;
      isPatternDraggingRef.current = false;
      touchPatternMovedRef.current = false;
      touchPatternStartCellRef.current = null;
      setHoverCell(null);
      return;
    }

    if (isSelectionMode && selectionStart && selectionEnd) {
      onSelectionComplete?.({
        startX: selectionStart.x,
        startY: selectionStart.y,
        endX: selectionEnd.x,
        endY: selectionEnd.y,
      });
      setSelectionStart(null);
      setSelectionEnd(null);
    }

    isPointerDownRef.current = false;
    isPanningRef.current = false;
    isPatternDraggingRef.current = false;
    touchPatternMovedRef.current = false;
    touchPatternStartCellRef.current = null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.9;
    const nextScale = Math.min(4, Math.max(0.5, scale * zoomFactor));

    if (nextScale === scale) {
      return;
    }

    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const currentBaseOffset = getBaseOffset(scale);
    const nextBaseOffset = getBaseOffset(nextScale);
    const contentX = (pointerX - currentBaseOffset.x - pan.x) / scale;
    const contentY = (pointerY - currentBaseOffset.y - pan.y) / scale;

    setScale(nextScale);
    setPan(
      clampPan(nextScale, {
        x: pointerX - nextBaseOffset.x - contentX * nextScale,
        y: pointerY - nextBaseOffset.y - contentY * nextScale,
      }),
    );
  }

  return (
    <div
      ref={viewportRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
      className="relative h-full w-full overflow-hidden rounded-[28px] touch-none"
    >
      <canvas
        ref={canvasRef}
        style={{
          transform,
          transformOrigin: "top left",
          touchAction: "none",
        }}
        className="glow-pulse absolute left-0 top-0 rounded-[28px] bg-[#0d0d0d] shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
});
