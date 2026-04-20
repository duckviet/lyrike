import { useCallback, useEffect, useState } from "react";
import {
  WIDGET_BOTTOM_SAFE_SPACE,
  WIDGET_EDGE_MARGIN,
  WIDGET_TOP_OFFSET,
} from "../constants/ui";
import { Position } from "../shared/types";

function clampPosition(position: Position, widgetWidth: number): Position {
  return {
    x: Math.max(
      WIDGET_EDGE_MARGIN,
      Math.min(
        position.x,
        window.innerWidth - widgetWidth - WIDGET_EDGE_MARGIN,
      ),
    ),
    y: Math.max(
      WIDGET_EDGE_MARGIN,
      Math.min(position.y, window.innerHeight - WIDGET_BOTTOM_SAFE_SPACE),
    ),
  };
}

function getInitialPosition(widgetWidth: number): Position {
  return clampPosition(
    {
      x: window.innerWidth - widgetWidth - WIDGET_EDGE_MARGIN,
      y: WIDGET_TOP_OFFSET,
    },
    widgetWidth,
  );
}

interface DragState {
  offsetX: number;
  offsetY: number;
}

/**
 * Manages floating widget position with drag support and boundary constraints.
 * @param widgetWidth Width of the widget for boundary calculations.
 */
export function useFloatingWidgetPosition(widgetWidth: number): {
  pos: Position;
  startDrag: (event: React.MouseEvent<HTMLElement>) => void;
} {
  const [pos, setPos] = useState<Position>(() =>
    getInitialPosition(widgetWidth),
  );
  const [dragging, setDragging] = useState<DragState | null>(null);

  const startDrag = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    event.preventDefault();

    const widgetElement = event.currentTarget.parentElement;

    if (!widgetElement) {
      return;
    }

    const rect = widgetElement.getBoundingClientRect();

    setDragging({
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  }, []);

  // Adjust position when width changes (e.g. from settings)
  const [prevWidgetWidth, setPrevWidgetWidth] = useState(widgetWidth);
  if (widgetWidth !== prevWidgetWidth) {
    setPrevWidgetWidth(widgetWidth);
    setPos((prevPos) => clampPosition(prevPos, widgetWidth));
  }

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const nextPos = clampPosition(
        {
          x: event.clientX - dragging.offsetX,
          y: event.clientY - dragging.offsetY,
        },
        widgetWidth,
      );

      setPos(nextPos);
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, widgetWidth]);

  useEffect(() => {
    const handleResize = () => {
      setPos((prevPos) => clampPosition(prevPos, widgetWidth));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [widgetWidth]);

  return {
    pos,
    startDrag,
  };
}
