import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import "./styles/pattern_trajectory.scss";

export default function PatternGame({ isDragging, setIsDragging, setScore, onStart }) {
  const containerRef = useRef(null);
  const [targetIdx, setTargetIdx] = useState(4);
  const targetIdxRef = useRef(targetIdx);
  const isUpdating = useRef(false);

  const [dimensions, setDimensions] = useState({
    size: 300,
    spacing: 100,
  });

  const mX = useMotionValue(0);
  const mY = useMotionValue(0);

  // 1. 반응형 사이즈 업데이트
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement.offsetWidth;
      const availableSize = Math.min(parentWidth, 400);
      setDimensions({
        size: availableSize,
        spacing: availableSize / 3,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 2. 그리드 좌표 생성
  const gridPoints = useMemo(() => {
    const { spacing } = dimensions;
    return Array.from({ length: 9 }).map((_, i) => ({
      x: (i % 3) * spacing + spacing / 2,
      y: Math.floor(i / 3) * spacing + spacing / 2,
    }));
  }, [dimensions]);

  // 3. 초기 위치 고정 (Index 4: 중앙)
  useEffect(() => {
    if (gridPoints[4]) {
      mX.jump(gridPoints[4].x);
      mY.jump(gridPoints[4].y);
    }
  }, [gridPoints, mX, mY]);

  // 4. 드래그 핸들러 (좌표 계산 최적화)
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // 컨테이너 기준 상대 좌표 (Raw 값)
      let nextX = clientX - rect.left;
      let nextY = clientY - rect.top;

      // 경계값(Extreme Values) 제한
      nextX = Math.max(0, Math.min(nextX, dimensions.size));
      nextY = Math.max(0, Math.min(nextY, dimensions.size));

      mX.set(nextX);
      mY.set(nextY);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove, { passive: false });
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [isDragging, dimensions, mX, mY]);

  // 5. 드래그 종료 시 복귀 애니메이션
  useEffect(() => {
    if (!isDragging && gridPoints[4]) {
      animate(mX, gridPoints[4].x, { type: "spring", stiffness: 300, damping: 25 });
      animate(mY, gridPoints[4].y, { type: "spring", stiffness: 300, damping: 25 });
      setTargetIdx(4);
    }
  }, [isDragging, gridPoints, mX, mY]);

  // 6. 타겟 판정
  useEffect(() => {
    targetIdxRef.current = targetIdx;
    isUpdating.current = false;
  }, [targetIdx]);

  useEffect(() => {
    const checkArrival = () => {
      if (!isDragging) return;
      const target = gridPoints[targetIdxRef.current];
      if (!target) return;

      // 피타고라스 정리를 이용한 거리 계산
      const dist = Math.hypot(mX.get() - target.x, mY.get() - target.y);

      if (dist < 30 && !isUpdating.current) {
        isUpdating.current = true;
        setScore((s) => s + 1);
        setTargetIdx((prev) => {
          let next;
          do {
            next = Math.floor(Math.random() * 9);
          } while (next === prev);
          return next;
        });
      }
    };

    const unsubX = mX.on("change", checkArrival);
    const unsubY = mY.on("change", checkArrival);
    return () => {
      unsubX();
      unsubY();
    };
  }, [gridPoints, isDragging, mX, mY, setScore]);

  return (
    <div className="game-wrapper">
      <div
        ref={containerRef}
        className="pattern-container"
        style={{
          width: dimensions.size,
          height: dimensions.size,
          position: "relative",
          overflow: "visible"
        }}
      >
        {/* 배경 그리드 점 */}
        {gridPoints.map((point, i) => (
          <div
            key={i}
            className={`grid-dot ${i === targetIdx ? "is-target" : ""}`}
            style={{
              left: point.x,
              top: point.y,
              position: "absolute",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* 플레이어 공 */}
        <motion.div
          className="player-ball"
          onMouseDown={onStart}
          onTouchStart={onStart}
          style={{
            x: mX,
            y: mY,
            // 중심점 보정: Framer Motion의 x, y는 좌상단 기준이므로 
            // -50%씩 이동시켜 공의 정중앙이 좌표에 오게 함
            translateX: "-50%",
            translateY: "-50%",
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: isDragging ? "#007bff" : "#adb5bd",
          }}
          animate={{
            scale: isDragging ? 1.1 : 0.8,
            opacity: isDragging ? 1 : 0.5,
          }}
        />
      </div>
    </div>
  );
}