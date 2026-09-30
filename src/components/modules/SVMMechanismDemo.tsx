import React, { useState, useRef, useEffect } from 'react';
import { MathView } from '../MathView';
import {
  Compass,
  Sparkles,
  Move,
  Play,
  RotateCcw,
  Shield,
  Layers,
  CheckCircle2,
  HelpCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';

export const SVMMechanismDemo: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'immunity' | 'spring' | 'margin_opt'>('immunity');
  const [angleOffset, setAngleOffset] = useState<number>(0); // for margin_opt mode (-22 to +22 deg)
  const [nonSVDisturbed, setNonSVDisturbed] = useState<boolean>(false);
  const [svMoved, setSvMoved] = useState<boolean>(false);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(false);

  // 缩放与旋转功能配置：初始图缩小三分之一 (0.67x)
  const INITIAL_ZOOM = 0.67; // 缩小三分之一 (原1.0的67%)
  const INITIAL_ROTATION = 0; // 初始旋转 0°
  const [zoom, setZoom] = useState<number>(INITIAL_ZOOM);
  const [viewRotation, setViewRotation] = useState<number>(INITIAL_ROTATION);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; rot: number }>({ x: 0, rot: 0 });

  // Baseline 2D dataset representing the concept
  // Support Vectors: Points A (pos SV), B (pos SV), C (neg SV)
  const basePoints = [
    // Support Vectors
    { id: 'sv1', x: 0.28, y: 0.12, label: 1, isSV: true, alpha: 1.8 },
    { id: 'sv2', x: 0.12, y: 0.35, label: 1, isSV: true, alpha: 1.4 },
    { id: 'sv3', x: -0.22, y: -0.18, label: -1, isSV: true, alpha: 3.2 },
    // Non-Support Vectors (Pos class bulk)
    { id: 'n1', x: 0.55, y: 0.38, label: 1, isSV: false, alpha: 0 },
    { id: 'n2', x: 0.65, y: 0.15, label: 1, isSV: false, alpha: 0 },
    { id: 'n3', x: 0.42, y: 0.58, label: 1, isSV: false, alpha: 0 },
    { id: 'n4', x: 0.72, y: 0.45, label: 1, isSV: false, alpha: 0 },
    // Non-Support Vectors (Neg class bulk)
    { id: 'n5', x: -0.45, y: -0.38, label: -1, isSV: false, alpha: 0 },
    { id: 'n6', x: -0.62, y: -0.15, label: -1, isSV: false, alpha: 0 },
    { id: 'n7', x: -0.38, y: -0.58, label: -1, isSV: false, alpha: 0 },
    { id: 'n8', x: -0.68, y: -0.42, label: -1, isSV: false, alpha: 0 },
  ];

  // Dynamic state of points depending on demo mode
  const currentPoints = basePoints.map((p) => {
    let px = p.x;
    let py = p.y;

    if (activeMode === 'immunity') {
      if (nonSVDisturbed && !p.isSV) {
        // Perturb bulk points significantly
        px += Math.sin(p.x * 20) * 0.15;
        py += Math.cos(p.y * 20) * 0.15;
      }
      if (svMoved && p.id === 'sv1') {
        // Move SV
        px += 0.12;
        py -= 0.18;
      }
    }
    return { ...p, x: px, y: py };
  });

  // Calculate separator hyperplane orientation
  // Optimal angle is roughly 42 degrees (0.73 rad)
  const baseTheta = 0.73;
  const currentTheta =
    activeMode === 'margin_opt'
      ? baseTheta + (angleOffset * Math.PI) / 180
      : svMoved
      ? baseTheta - 0.28
      : baseTheta;

  // Normal vector w
  const nx = Math.cos(currentTheta);
  const ny = Math.sin(currentTheta);

  // Margin calculation for margin_opt mode
  const marginWidth = Math.max(
    0.12,
    +(0.48 * Math.cos((angleOffset * Math.PI) / 180) ** 2).toFixed(3)
  );

  // Auto scan animation loop for margin_opt mode
  useEffect(() => {
    if (!isAutoScanning) return;
    let forward = true;
    let lastT = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;

      setAngleOffset((prev) => {
        let next = prev + (forward ? 20 : -20) * dt;
        if (next > 20) {
          next = 20;
          forward = false;
        } else if (next < -20) {
          next = -20;
          forward = true;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isAutoScanning]);

  // Canvas drawing with Zoom and Rotation support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Base scale is reduced by 1/3 when zoom is at initial 0.67
    const effectiveScale = width * 0.42 * zoom;

    // Rotation angles in radians
    const viewRotationRad = (viewRotation * Math.PI) / 180;
    const cosR = Math.cos(viewRotationRad);
    const sinR = Math.sin(viewRotationRad);

    // Function to rotate (x, y) around center and map to canvas screen
    const toScreen = (x: number, y: number) => {
      const rx = x * cosR - y * sinR;
      const ry = x * sinR + y * cosR;
      return [cx + rx * effectiveScale, cy - ry * effectiveScale];
    };

    // Subtle coordinate grid with rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-viewRotationRad);
    ctx.strokeStyle = '#f0eee9';
    ctx.lineWidth = 1;
    const gridBound = Math.max(width, height) * 1.5;
    const gridStep = 40 * Math.max(0.6, zoom);
    for (let i = -gridBound; i <= gridBound; i += gridStep) {
      ctx.beginPath();
      ctx.moveTo(i, -gridBound);
      ctx.lineTo(i, gridBound);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-gridBound, i);
      ctx.lineTo(gridBound, i);
      ctx.stroke();
    }
    // Subtle axes
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-gridBound, 0);
    ctx.lineTo(gridBound, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -gridBound);
    ctx.lineTo(0, gridBound);
    ctx.stroke();
    ctx.restore();

    // Direction along separating line (tangent)
    const tx = -ny;
    const ty = nx;

    // Rotate normal and tangent vectors by view rotation
    const rnx = nx * cosR - ny * sinR;
    const rny = nx * sinR + ny * cosR;
    const rtx = tx * cosR - ty * sinR;
    const rty = tx * sinR + ty * cosR;

    // Draw Margin Ribbon (Safety Buffer)
    const marginPixels = marginWidth * effectiveScale;
    const lineSpan = width * 0.85;

    ctx.fillStyle = 'rgba(79, 70, 229, 0.07)';
    ctx.beginPath();
    ctx.moveTo(cx + rtx * lineSpan + rnx * marginPixels, cy - (rty * lineSpan + rny * marginPixels));
    ctx.lineTo(cx - rtx * lineSpan + rnx * marginPixels, cy + (rty * lineSpan - rny * marginPixels));
    ctx.lineTo(cx - rtx * lineSpan - rnx * marginPixels, cy + (rty * lineSpan + rny * marginPixels));
    ctx.lineTo(cx + rtx * lineSpan - rnx * marginPixels, cy - (rty * lineSpan - rny * marginPixels));
    ctx.closePath();
    ctx.fill();

    // Positive Margin Boundary: w^T x + b = +1
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx + rtx * lineSpan + rnx * marginPixels, cy - (rty * lineSpan + rny * marginPixels));
    ctx.lineTo(cx - rtx * lineSpan + rnx * marginPixels, cy + (rty * lineSpan - rny * marginPixels));
    ctx.stroke();

    // Negative Margin Boundary: w^T x + b = -1
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx + rtx * lineSpan - rnx * marginPixels, cy - (rty * lineSpan - rny * marginPixels));
    ctx.lineTo(cx - rtx * lineSpan - rnx * marginPixels, cy + (rty * lineSpan - rny * marginPixels));
    ctx.stroke();

    // Optimal Separating Hyperplane: w^T x + b = 0
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx + rtx * lineSpan, cy - rty * lineSpan);
    ctx.lineTo(cx - rtx * lineSpan, cy + rty * lineSpan);
    ctx.stroke();

    // Margin Width Indicator Dimension Line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    const dimCenter = [cx + rtx * (40 * zoom), cy - rty * (40 * zoom)];
    ctx.beginPath();
    ctx.moveTo(dimCenter[0] - rnx * marginPixels, dimCenter[1] + rny * marginPixels);
    ctx.lineTo(dimCenter[0] + rnx * marginPixels, dimCenter[1] - rny * marginPixels);
    ctx.stroke();

    // Dimension Ticks
    const drawDimTick = (px: number, py: number) => {
      ctx.beginPath();
      ctx.moveTo(px - rtx * 5, py + rty * 5);
      ctx.lineTo(px + rtx * 5, py - rty * 5);
      ctx.stroke();
    };
    drawDimTick(dimCenter[0] - rnx * marginPixels, dimCenter[1] + rny * marginPixels);
    drawDimTick(dimCenter[0] + rnx * marginPixels, dimCenter[1] - rny * marginPixels);

    // Dimension Label
    ctx.font = '10px monospace';
    ctx.fillStyle = '#4338ca';
    ctx.fillText(
      `间隔 M = 2/||w|| (${(marginWidth * 2).toFixed(2)})`,
      dimCenter[0] + 10,
      dimCenter[1] - 8
    );

    // If Mode is 'spring': draw spring force vectors from SVs pushing against hyperplane
    if (activeMode === 'spring') {
      currentPoints
        .filter((p) => p.isSV)
        .forEach((sv) => {
          const [sx, sy] = toScreen(sv.x, sv.y);
          const forceLen = sv.alpha * 26 * Math.max(0.6, zoom);
          // Direction pushes perpendicular to hyperplane in rotated view
          const dirX = sv.label === 1 ? -rnx : rnx;
          const dirY = sv.label === 1 ? rny : -rny;

          // Draw Spring / Force Arrow
          ctx.strokeStyle = sv.label === 1 ? '#047857' : '#be123c';
          ctx.fillStyle = sv.label === 1 ? '#047857' : '#be123c';
          ctx.lineWidth = 2.0;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + dirX * forceLen, sy + dirY * forceLen);
          ctx.stroke();

          // Arrow head
          const arrowAngle = Math.atan2(dirY * forceLen, dirX * forceLen);
          ctx.beginPath();
          ctx.moveTo(sx + dirX * forceLen, sy + dirY * forceLen);
          ctx.lineTo(
            sx + dirX * forceLen - 8 * Math.cos(arrowAngle - Math.PI / 6),
            sy + dirY * forceLen - 8 * Math.sin(arrowAngle - Math.PI / 6)
          );
          ctx.lineTo(
            sx + dirX * forceLen - 8 * Math.cos(arrowAngle + Math.PI / 6),
            sy + dirY * forceLen - 8 * Math.sin(arrowAngle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          // Force label α_i
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`F=α·y (${sv.alpha})`, sx + dirX * 12 + 6, sy + dirY * 12);
        });
    }

    // Draw Data Points
    currentPoints.forEach((p) => {
      const [sx, sy] = toScreen(p.x, p.y);

      if (p.isSV) {
        // Highlighted Support Vector Ring
        const haloR = 11 * Math.max(0.7, zoom);
        ctx.beginPath();
        ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        ctx.fillStyle = 'rgba(217, 119, 6, 0.16)';
        ctx.fill();
      }

      // Main Point
      const ptRadius = (p.isSV ? 5.5 : 4) * Math.max(0.75, zoom);
      ctx.beginPath();
      ctx.arc(sx, sy, ptRadius, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? '#10b981' : '#f43f5e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Point Tag for SV
      if (p.isSV) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#92400e';
        ctx.fillText('支持向量', sx + 12, sy + 3);
      }
    });

    // Draw Compass Widget in Top Right of Canvas
    const compassX = width - 36;
    const compassY = 36;
    const compassRadius = 18;

    ctx.save();
    ctx.translate(compassX, compassY);
    ctx.beginPath();
    ctx.arc(0, 0, compassRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();

    // Rotated Needle
    ctx.rotate(viewRotationRad);
    // North Needle (Red)
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(0, -compassRadius + 4);
    ctx.lineTo(3.5, 0);
    ctx.lineTo(-3.5, 0);
    ctx.closePath();
    ctx.fill();
    // South Needle (Stone)
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.moveTo(0, compassRadius - 4);
    ctx.lineTo(3.5, 0);
    ctx.lineTo(-3.5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -compassRadius + 11);
    ctx.restore();
  }, [currentPoints, marginWidth, nx, ny, activeMode, zoom, viewRotation]);

  // Mouse drag gesture for continuous rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, rot: viewRotation };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    let nextRot = Math.round(dragStartRef.current.rot + deltaX * 0.7);
    while (nextRot > 180) nextRot -= 360;
    while (nextRot < -180) nextRot += 360;
    setViewRotation(nextRot);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag gesture for mobile rotation
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, rot: viewRotation };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    let nextRot = Math.round(dragStartRef.current.rot + deltaX * 0.7);
    while (nextRot > 180) nextRot -= 360;
    while (nextRot < -180) nextRot += 360;
    setViewRotation(nextRot);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    setZoom((prev) => Math.min(2.0, Math.max(0.35, +(prev + delta).toFixed(2))));
  };

  // Reset Zoom and Rotation
  const handleResetView = () => {
    setZoom(INITIAL_ZOOM);
    setViewRotation(INITIAL_ROTATION);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-5">
      {/* Submodule Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <span className="text-xs font-mono text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            核心机制交互演示 (SVM Philosophy & Mechanism)
          </span>
          <h3 className="text-base font-semibold text-stone-900 mt-0.5">
            支持向量机为何“以一当十”？—— 思想与机理解剖
          </h3>
        </div>

        {/* 3 Mechanism Modes */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded border border-stone-200 text-xs">
          <button
            onClick={() => {
              setActiveMode('immunity');
              setIsAutoScanning(false);
            }}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeMode === 'immunity'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            1. 非支持向量免疫
          </button>
          <button
            onClick={() => {
              setActiveMode('spring');
              setIsAutoScanning(false);
            }}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeMode === 'spring'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            2. 弹簧受力平衡
          </button>
          <button
            onClick={() => setActiveMode('margin_opt')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeMode === 'margin_opt'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            3. 最大间隔旋转寻优
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Display View (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-4/3 w-full border border-stone-200 rounded-md bg-stone-50 overflow-hidden flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={560}
              height={420}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className={`w-full h-full object-contain select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              title="按住鼠标拖拽可任意角度旋转视图，滑动滚轮可缩放视图"
            />

            {/* In-canvas Banner */}
            <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs border border-stone-200 px-2.5 py-1 rounded text-[11px] shadow-2xs font-mono text-stone-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {activeMode === 'immunity' && (
                <span>
                  {svMoved
                    ? '⚠️ 支持向量移动 → 超平面立即扭转！'
                    : nonSVDisturbed
                    ? '✓ 非支持向量剧烈扰动 → 超平面纹丝不动！'
                    : '静止基准态：黄色光晕为 3 个决定性支持向量'}
                </span>
              )}
              {activeMode === 'spring' && (
                <span>物理图景：支持向量如弹簧施力，合力平衡 ∑αᵢyᵢ = 0</span>
              )}
              {activeMode === 'margin_opt' && (
                <span>
                  偏角: {angleOffset}° · 间隔: {(marginWidth * 2).toFixed(2)}{' '}
                  {Math.abs(angleOffset) < 1 ? '(最大几何间隔最优)' : '(间隔缩窄)'}
                </span>
              )}
            </div>

            {/* In-canvas View Parameters Badge (Bottom Left) */}
            <div className="absolute bottom-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs text-stone-200 border border-stone-700/60 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-2">
              <span>缩放: {Math.round((zoom / INITIAL_ZOOM) * 67)}% (初始缩小1/3)</span>
              <span>·</span>
              <span>旋转: {viewRotation}°</span>
            </div>
          </div>

          {/* Zoom & Rotation Interactive Toolbar */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-md space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-stone-500" />
                  缩放:
                </span>
                <div className="flex items-center bg-white border border-stone-200 rounded shadow-2xs">
                  <button
                    onClick={() => setZoom((prev) => Math.max(0.35, +(prev - 0.08).toFixed(2)))}
                    className="p-1 hover:bg-stone-100 text-stone-600 border-r border-stone-200 transition-colors"
                    title="缩小视图"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px] text-stone-800 font-semibold min-w-14 text-center">
                    {Math.round((zoom / INITIAL_ZOOM) * 67)}%
                  </span>
                  <button
                    onClick={() => setZoom((prev) => Math.min(2.0, +(prev + 0.08).toFixed(2)))}
                    className="p-1 hover:bg-stone-100 text-stone-600 border-l border-stone-200 transition-colors"
                    title="放大视图"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="range"
                  min="0.35"
                  max="1.8"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-18 accent-stone-800 cursor-pointer h-1.5 bg-stone-200 rounded hidden sm:block"
                  title="调节缩放比例"
                />
              </div>

              {/* Rotation Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-stone-500" />
                  旋转:
                </span>
                <div className="flex items-center bg-white border border-stone-200 rounded shadow-2xs">
                  <button
                    onClick={() => {
                      let next = viewRotation - 15;
                      if (next < -180) next += 360;
                      setViewRotation(next);
                    }}
                    className="p-1 hover:bg-stone-100 text-stone-600 border-r border-stone-200 transition-colors"
                    title="逆时针旋转 15°"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px] text-stone-800 font-semibold min-w-12 text-center">
                    {viewRotation}°
                  </span>
                  <button
                    onClick={() => {
                      let next = viewRotation + 15;
                      if (next > 180) next -= 360;
                      setViewRotation(next);
                    }}
                    className="p-1 hover:bg-stone-100 text-stone-600 border-l border-stone-200 transition-colors"
                    title="顺时针旋转 15°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={viewRotation}
                  onChange={(e) => setViewRotation(parseInt(e.target.value, 10))}
                  className="w-20 accent-stone-800 cursor-pointer h-1.5 bg-stone-200 rounded hidden sm:block"
                  title="调节旋转角度 (-180° ~ +180°)"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetView}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-stone-200 hover:bg-stone-100 rounded text-stone-700 text-[11px] font-medium shadow-2xs transition-colors"
                title="重置缩放 (67%) 与旋转 (0°)"
              >
                <RotateCcw className="w-3 h-3 text-stone-500" />
                <span>重置视口</span>
              </button>
            </div>

            {/* Gesture Tip */}
            <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-200/60">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-indigo-500" />
                按住鼠标在画布上拖拽可任意角度自由旋转；鼠标滚轮支持无级缩放
              </span>
              <span className="font-mono text-stone-400">已默认缩小 1/3 (0.67x)</span>
            </div>
          </div>

          {/* Interactive Controls Bar corresponding to Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded text-xs">
            {activeMode === 'immunity' && (
              <div className="flex items-center gap-2 w-full justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNonSVDisturbed(!nonSVDisturbed);
                      setSvMoved(false);
                    }}
                    className={`px-3 py-1.5 rounded font-medium border transition-colors ${
                      nonSVDisturbed
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {nonSVDisturbed ? '复原非支持向量' : '扰动/移除非支持向量 (观察超平面)'}
                  </button>
                  <button
                    onClick={() => {
                      setSvMoved(!svMoved);
                      setNonSVDisturbed(false);
                    }}
                    className={`px-3 py-1.5 rounded font-medium border transition-colors ${
                      svMoved
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {svMoved ? '复原支持向量' : '移动支持向量 (观察超平面)'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setNonSVDisturbed(false);
                    setSvMoved(false);
                  }}
                  className="text-stone-500 hover:text-stone-800 p-1"
                  title="重置样本扰动状态"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {activeMode === 'spring' && (
              <div className="flex items-center justify-between w-full text-stone-600 text-[11px]">
                <span>
                  正类支持向量推力: <strong className="font-mono text-emerald-700">F+ = 1.8 + 1.4 = 3.2</strong>
                </span>
                <span>
                  负类支持向量推力: <strong className="font-mono text-rose-700">F- = 3.2</strong>
                </span>
                <span className="font-semibold text-stone-900">
                  合力平衡: ∑αᵢyᵢ = 3.2 - 3.2 = 0
                </span>
              </div>
            )}

            {activeMode === 'margin_opt' && (
              <div className="w-full space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-600">超平面法向量朝向探测 (Angle Sweep):</span>
                  <span className="font-mono font-bold text-stone-900">{angleOffset}°</span>
                  <button
                    onClick={() => setIsAutoScanning(!isAutoScanning)}
                    className="flex items-center gap-1 text-indigo-700 hover:underline font-medium"
                  >
                    <Play className="w-3 h-3" />
                    <span>{isAutoScanning ? '停止扫描' : '自动扫掠寻优'}</span>
                  </button>
                </div>
                <input
                  type="range"
                  min="-22"
                  max="22"
                  step="0.5"
                  value={angleOffset}
                  onChange={(e) => {
                    setAngleOffset(parseFloat(e.target.value));
                    setIsAutoScanning(false);
                  }}
                  className="w-full accent-stone-800 cursor-pointer h-1.5 bg-stone-200 rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Mechanism Explanation Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3 text-xs leading-relaxed">
          {/* Card 1 */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5">
            <span className="font-semibold text-stone-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              1. 稀疏性与“非支持向量免疫”
            </span>
            <p className="text-stone-600 text-[11px]">
              逻辑回归或感知机受样本集内每一个点的影响；而 SVM 的对偶解中，绝大多数普通样本的拉格朗日乘子 <MathView math="\alpha_i = 0" />。
              <strong>唯有卡在安全间隔边界上的“支持向量”才对超平面施加支撑力</strong>。无论内部普通样本如何剧烈扰动或被删除，超平面位置与法向量巍然不动！
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5">
            <span className="font-semibold text-stone-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              2. 物理弹簧挤压与力矩平衡
            </span>
            <p className="text-stone-600 text-[11px]">
              若将支持向量视为压迫超平面的弹性弹簧，其弹性系数即为对偶乘子 <MathView math="\alpha_i" />。
              KKT 极值条件导出的 <MathView math="\sum \alpha_i y_i = 0" /> 正好对应物理学上的<strong>“合力平衡”</strong>。超平面被两类样本的支撑力自适应挤压在最正中安全的位置。
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5">
            <span className="font-semibold text-stone-900 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
              3. 最大几何间隔 (Maximum Margin)
            </span>
            <p className="text-stone-600 text-[11px]">
              两类数据之间存在无数条可行划分线。但唯有使得缓冲带宽度 <MathView math="\frac{2}{\|w\|}" /> 达到极大值的超平面，其结构风险最小、泛化界（Generalization Bound）最紧，对未知测试样本的抗噪鲁棒性最高。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
