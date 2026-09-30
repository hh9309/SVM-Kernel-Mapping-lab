import React, { useState, useEffect, useRef } from 'react';
import { MathView } from '../MathView';
import { Point2D } from '../../types/svm';
import { Play, Pause, RotateCcw, Move, Sparkles, Layers } from 'lucide-react';

interface KernelProjectionSliceProps {
  datasetType?: string;
}

export const KernelProjectionSlice: React.FC<KernelProjectionSliceProps> = () => {
  const [morphPhase, setMorphPhase] = useState<number>(0.5); // 0 (original) to 1 (high-dim lifted)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [rotationAngle, setRotationAngle] = useState<number>(25); // degrees
  const [mappingType, setMappingType] = useState<'rbf' | 'poly'>('rbf');
  const [gamma, setGamma] = useState<number>(1.2);
  const [selectedPreset, setSelectedPreset] = useState<'circles' | 'xor' | 'moons'>('circles');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Generate clean synthetic points for the visualizer
  const samplePoints = React.useMemo(() => {
    const pts: { x1: number; x2: number; y: 1 | -1; id: number }[] = [];
    let id = 1;

    if (selectedPreset === 'circles') {
      // Inner circle (Class +1)
      for (let i = 0; i < 28; i++) {
        const r = 0.28 + (Math.random() - 0.5) * 0.08;
        const th = (i / 28) * 2 * Math.PI;
        pts.push({ x1: r * Math.cos(th), x2: r * Math.sin(th), y: 1, id: id++ });
      }
      // Outer ring (Class -1)
      for (let i = 0; i < 38; i++) {
        const r = 0.78 + (Math.random() - 0.5) * 0.1;
        const th = (i / 38) * 2 * Math.PI;
        pts.push({ x1: r * Math.cos(th), x2: r * Math.sin(th), y: -1, id: id++ });
      }
    } else if (selectedPreset === 'xor') {
      const qCenters: [number, number, 1 | -1][] = [
        [0.45, 0.45, 1],
        [-0.45, -0.45, 1],
        [-0.45, 0.45, -1],
        [0.45, -0.45, -1],
      ];
      qCenters.forEach(([cx, cy, label]) => {
        for (let i = 0; i < 15; i++) {
          pts.push({
            x1: cx + (Math.random() - 0.5) * 0.35,
            x2: cy + (Math.random() - 0.5) * 0.35,
            y: label,
            id: id++,
          });
        }
      });
    } else {
      // Two moons
      for (let i = 0; i < 30; i++) {
        const th = (i / 30) * Math.PI;
        pts.push({
          x1: Math.cos(th) * 0.6 - 0.2,
          x2: Math.sin(th) * 0.6 - 0.1,
          y: 1,
          id: id++,
        });
      }
      for (let i = 0; i < 30; i++) {
        const th = (i / 30) * Math.PI;
        pts.push({
          x1: 0.2 - Math.cos(th) * 0.6,
          x2: 0.2 - Math.sin(th) * 0.6,
          y: -1,
          id: id++,
        });
      }
    }
    return pts;
  }, [selectedPreset]);

  // Smooth animation loop
  useEffect(() => {
    let forward = true;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        setMorphPhase((prev) => {
          let next = prev + (forward ? 0.35 : -0.35) * dt;
          if (next >= 1) {
            next = 1;
            forward = false;
          } else if (next <= 0) {
            next = 0;
            forward = true;
          }
          return next;
        });
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background styling
    ctx.fillStyle = '#fbfbfa';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = '#ebeae6';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const cx = width / 2;
    const cy = height / 2;
    const scale = width * 0.38;

    // Coordinate Axes
    ctx.strokeStyle = '#d6d3cd';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 20);
    ctx.lineTo(cx, height - 20);
    ctx.moveTo(20, cy);
    ctx.lineTo(width - 20, cy);
    ctx.stroke();

    // Axis Labels
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#78716c';
    if (morphPhase < 0.3) {
      ctx.fillText('x₁ 原始轴', width - 65, cy - 8);
      ctx.fillText('x₂ 原始轴', cx + 8, 30);
    } else {
      ctx.fillText('z₁ (映射投影)', width - 85, cy - 8);
      ctx.fillText('z₂ (提升维度)', cx + 8, 30);
    }

    const rad = (rotationAngle * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    // Compute lifted feature space coordinates
    // When mappingType === 'rbf': z1 = distance or x1, z2 = exp(-gamma * distSq)
    // When mappingType === 'poly': z1 = x1^2 - x2^2, z2 = 2 * x1 * x2
    const transformedPoints = samplePoints.map((p) => {
      const origX = p.x1;
      const origY = p.x2;

      let featX = 0;
      let featY = 0;

      if (mappingType === 'rbf') {
        const distSq = origX * origX + origY * origY;
        const liftedHeight = Math.exp(-gamma * distSq) * 1.5 - 0.75;
        featX = origX * 0.7 + origY * 0.3;
        featY = liftedHeight;
      } else {
        // Polynomial feature lift
        featX = origX * origX - origY * origY;
        featY = 1.4 * origX * origY;
      }

      // Continuous interpolation between original 2D and lifted feature 2D
      const currX = origX * (1 - morphPhase) + featX * morphPhase;
      const currY = origY * (1 - morphPhase) + featY * morphPhase;

      // Apply rotation angle projection
      const rotX = currX * cosR - currY * sinR;
      const rotY = currX * sinR + currY * cosR;

      const screenX = cx + rotX * scale;
      const screenY = cy - rotY * scale;

      return { ...p, screenX, screenY, featY };
    });

    // Draw the cutting blade separating hyperplane when morphPhase > 0.4
    if (morphPhase > 0.25) {
      const alpha = Math.min(1, (morphPhase - 0.25) * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;

      // In the lifted space, the separating line is at z2 = threshold
      // For RBF circle, inner points have high exp, outer have low exp
      const sepFeatY = mappingType === 'rbf' ? 0.05 : 0.0;
      // Line passing through (0, sepFeatY) perpendicular to feature Y
      const p1Rot = (-1.4 * cosR - sepFeatY * sinR) * scale;
      const p1YRot = (-1.4 * sinR + sepFeatY * cosR) * scale;
      const p2Rot = (1.4 * cosR - sepFeatY * sinR) * scale;
      const p2YRot = (1.4 * sinR + sepFeatY * cosR) * scale;

      // Hyperplane Margin Ribbon
      const marginOffset = 0.22 * morphPhase * scale;
      ctx.fillStyle = 'rgba(79, 70, 229, 0.07)';
      ctx.beginPath();
      ctx.moveTo(cx + p1Rot - sinR * marginOffset, cy - (p1YRot + cosR * marginOffset));
      ctx.lineTo(cx + p2Rot - sinR * marginOffset, cy - (p2YRot + cosR * marginOffset));
      ctx.lineTo(cx + p2Rot + sinR * marginOffset, cy - (p2YRot - cosR * marginOffset));
      ctx.lineTo(cx + p1Rot + sinR * marginOffset, cy - (p1YRot - cosR * marginOffset));
      ctx.closePath();
      ctx.fill();

      // Margin Boundary Lines (+1 and -1)
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + p1Rot - sinR * marginOffset, cy - (p1YRot + cosR * marginOffset));
      ctx.lineTo(cx + p2Rot - sinR * marginOffset, cy - (p2YRot + cosR * marginOffset));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + p1Rot + sinR * marginOffset, cy - (p1YRot - cosR * marginOffset));
      ctx.lineTo(cx + p2Rot + sinR * marginOffset, cy - (p2YRot - cosR * marginOffset));
      ctx.stroke();

      // Main Separating Hyperplane ("一刀切分" 直线)
      ctx.setLineDash([]);
      ctx.strokeStyle = '#3730a3';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + p1Rot, cy - p1YRot);
      ctx.lineTo(cx + p2Rot, cy - p2YRot);
      ctx.stroke();

      // Hyperplane tag
      ctx.font = '10px monospace';
      ctx.fillStyle = '#3730a3';
      ctx.fillText('超平面 wᵀz + b = 0', cx + p2Rot - 110, cy - p2YRot - 8);

      ctx.restore();
    }

    // Draw data points
    transformedPoints.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, 5.5, 0, Math.PI * 2);

      if (p.y === 1) {
        ctx.fillStyle = '#059669'; // Emerald
        ctx.strokeStyle = '#064e3b';
      } else {
        ctx.fillStyle = '#e11d48'; // Rose
        ctx.strokeStyle = '#881337';
      }
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });
  }, [samplePoints, morphPhase, rotationAngle, mappingType, gamma, selectedPreset]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 02</span>
              <span>·</span>
              <span>几何演播</span>
              <span>·</span>
              <span>非线性可分到线性切分</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">高维核空间映射 2D 演播</h2>
            <p className="text-sm text-stone-600 mt-1">
              平滑演播原始 2D 线性不可分流形经核映射提升至高维特征空间后，被一记平直超平面完美“一刀切分”的连续几何过程。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 text-stone-50 rounded hover:bg-stone-800 transition-colors shadow-xs"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? '暂停演播' : '继续播放'}</span>
            </button>
            <button
              onClick={() => {
                setMorphPhase(0);
                setIsPlaying(false);
              }}
              className="p-1.5 border border-stone-300 rounded text-stone-600 hover:bg-stone-100 transition-colors"
              title="重置到原始 2D 状态"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slices Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-stone-200 text-xs">
          {/* Preset Selector */}
          <div>
            <label className="text-stone-500 font-medium block mb-1.5">非线性几何分布切片</label>
            <div className="grid grid-cols-3 gap-1 bg-stone-200/60 p-0.5 rounded">
              {(['circles', 'moons', 'xor'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedPreset(type)}
                  className={`py-1 rounded text-center font-medium capitalize transition-colors ${
                    selectedPreset === type
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {type === 'circles' ? '同心圆' : type === 'moons' ? '双月环' : '异或 XOR'}
                </button>
              ))}
            </div>
          </div>

          {/* Mapping Function Selector */}
          <div>
            <label className="text-stone-500 font-medium block mb-1.5">核映射函数 (Kernel Transform)</label>
            <div className="grid grid-cols-2 gap-1 bg-stone-200/60 p-0.5 rounded">
              <button
                onClick={() => setMappingType('rbf')}
                className={`py-1 rounded text-center font-medium transition-colors ${
                  mappingType === 'rbf'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                RBF 径向基核
              </button>
              <button
                onClick={() => setMappingType('poly')}
                className={`py-1 rounded text-center font-medium transition-colors ${
                  mappingType === 'poly'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                二次多项式核
              </button>
            </div>
          </div>

          {/* Morph Phase Slider */}
          <div>
            <div className="flex justify-between text-stone-600 mb-1">
              <span>空间提升阶段 (Phase)</span>
              <span className="font-mono font-medium text-stone-900">
                {(morphPhase * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={morphPhase}
              onChange={(e) => {
                setMorphPhase(parseFloat(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-stone-800 cursor-pointer h-1.5 bg-stone-200 rounded"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
              <span>原始 2D (不可分)</span>
              <span>高维特征投影 (一刀切)</span>
            </div>
          </div>

          {/* 2D Rotation / Perspective Angle */}
          <div>
            <div className="flex justify-between text-stone-600 mb-1">
              <span>2D 手势投影视角 (Angle)</span>
              <span className="font-mono font-medium text-stone-900">{rotationAngle}°</span>
            </div>
            <input
              type="range"
              min="-90"
              max="90"
              step="1"
              value={rotationAngle}
              onChange={(e) => setRotationAngle(parseInt(e.target.value))}
              className="w-full accent-stone-800 cursor-pointer h-1.5 bg-stone-200 rounded"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
              <span>-90° 侧切</span>
              <span>0° 正投</span>
              <span>+90° 俯切</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Presentation Viewport */}
      <div className="bg-white border border-stone-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Canvas Box */}
          <div className="relative w-full lg:w-3/5 aspect-4/3 max-h-[460px] border border-stone-200 rounded-md overflow-hidden bg-stone-50 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const origRot = rotationAngle;
                const onMouseMove = (moveEvt: MouseEvent) => {
                  const dx = moveEvt.clientX - startX;
                  setRotationAngle(Math.max(-90, Math.min(90, origRot + Math.round(dx * 0.4))));
                };
                const onMouseUp = () => {
                  window.removeEventListener('mousemove', onMouseMove);
                  window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
              }}
            />

            {/* In-canvas Phase Badge */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs border border-stone-200 px-2.5 py-1 rounded text-xs shadow-2xs font-mono text-stone-700">
              {morphPhase < 0.2 ? (
                <span className="text-amber-700 font-sans font-medium">状态：原始 2D 空间 (线性不可分)</span>
              ) : morphPhase > 0.8 ? (
                <span className="text-indigo-700 font-sans font-medium">状态：高维核空间 (超平面一刀切分)</span>
              ) : (
                <span className="text-stone-700 font-sans font-medium">状态：连续高维升维变形中...</span>
              )}
            </div>

            <div className="absolute bottom-3 right-3 text-[11px] text-stone-400 bg-white/80 px-2 py-0.5 rounded border border-stone-200 flex items-center gap-1">
              <Move className="w-3 h-3" />
              <span>支持拖拽水平旋转投影视角</span>
            </div>
          </div>

          {/* Academic Annotation Panel */}
          <div className="w-full lg:w-2/5 space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">几何机理解读</span>
              <h3 className="text-base font-medium text-stone-900 mt-1">
                {mappingType === 'rbf' ? 'RBF 无穷维高斯提升' : '多项式二次基扩展'}
              </h3>
            </div>

            <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
              <p>
                在原始空间中，红绿两类样本呈现包围（如内圆与外环）或异或交错分布，任何一条 2D 直线 <MathView math="w_1 x_1 + w_2 x_2 + b = 0" /> 都会造成巨大的分类错误。
              </p>

              <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-2">
                <span className="font-semibold text-stone-800 block">映射公式切片：</span>
                {mappingType === 'rbf' ? (
                  <div className="font-serif">
                    <MathView math="\phi(x) \sim \exp(-\gamma \|x - c_i\|^2)" block />
                    <span className="text-[11px] text-stone-500 block mt-1">
                      以数据中心为原点，内圈点拥有高响应（抬高），外圈点衰减至接近 0（下沉），使得原本平面的圆环在特征维度上形成明显高度差。
                    </span>
                  </div>
                ) : (
                  <div className="font-serif">
                    <MathView math="\phi(x) = [x_1^2, \; \sqrt{2}x_1x_2, \; x_2^2]^T" block />
                    <span className="text-[11px] text-stone-500 block mt-1">
                      通过二次交叉项扩展，原圆方程 <MathView math="x_1^2 + x_2^2 = r^2" /> 在新特征空间 <MathView math="z_1 + z_3 = r^2" /> 成为一个完全笔直的线性平面。
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-indigo-950 text-xs">
                <div className="flex items-center gap-1.5 font-medium mb-1 text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                  <span>几何直观结语</span>
                </div>
                当特征映射提升至高维空间后，原本复杂的非线性曲面被彻底“拉直”，凸二次规划能够轻而易举找到全局唯一的最大间隔超平面。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
