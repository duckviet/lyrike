import { useCallback, useEffect, useState } from "react";
import {
  WIDGET_BOTTOM_SAFE_SPACE,
  WIDGET_EDGE_MARGIN,
  WIDGET_TOP_OFFSET,
} from "../constants/ui";

function clampPosition(position, widgetWidth) {
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
      Math.min(
        position.y,
        window.innerHeight - WIDGET_BOTTOM_SAFE_SPACE,
      ),
    ),
  };
}

function getInitialPosition(widgetWidth) {
  return clampPosition(
    {
      x: window.innerWidth - widgetWidth - WIDGET_EDGE_MARGIN,
      y: WIDGET_TOP_OFFSET,
    },
    widgetWidth,
  );
}

export function useFloatingWidgetPosition(widgetWidth) {
  const [pos, setPos] = useState(() => getInitialPosition(widgetWidth));
  const [dragging, setDragging] = useState(null);

  const startDrag = useCallback((event) => {
    if (event.target.closest("button")) {
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

  useEffect(() => {
    setPos((prevPos) => clampPosition(prevPos, widgetWidth));
  }, [widgetWidth]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handleMouseMove = (event) => {
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