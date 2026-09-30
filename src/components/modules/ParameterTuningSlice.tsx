import React, { useRef, useEffect, useState } from 'react';
import { MathView } from '../MathView';
import { Point2D, SVMHyperparams, SVMModelResult } from '../../types/svm';
import { solveSVM, computeDecisionGrid } from '../../utils/svmSolver';
import { Sliders, AlertTriangle, ShieldCheck, Zap, Plus, RefreshCw } from 'lucide-react';

interface ParameterTuningSliceProps {
  points: Point2D[];
  setPoints: React.Dispatch<React.SetStateAction<Point2D[]>>;
  params: SVMHyperparams;
  setParams: React.Dispatch<React.SetStateAction<SVMHyperparams>>;
  result: SVMModelResult;
}

export const ParameterTuningSlice: React.FC<ParameterTuningSliceProps> = ({
  points,
  setPoints,
  params,
  setParams,
  result,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [clickMode, setClickMode] = useState<'add_pos' | 'add_neg' | 'inspect'>('inspect');
  const [gridResolution, setGridResolution] = useState<number>(45);

  // Compute regime: Underfit, Balanced, Overfit
  const fittingRegime = React.useMemo(() => {
    if (params.kernel === 'linear') {
      if (params.C < 0.1) return { state: '欠拟合 (Underfitting)', color: 'text-amber-700 bg-amber-50 border-amber-200', desc: 'C 过小，对松弛变量惩罚微弱，容忍了过多的间隔内部点与误分类。' };
      return { state: '线性最优超平面', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: '线性核保持全局凸泛化，不存在局部孤岛过拟合风险。' };
    }

    if (params.gamma > 8 || (params.gamma > 4 && params.C > 50)) {
      return {
        state: '极度过拟合 (Severe Overfitting)',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        desc: 'γ 极大使得径向基核支撑集萎缩为细长尖峰，每个训练点被孤立的同心闭合等高线包围，泛化能力崩塌！',
      };
    } else if (params.gamma < 0.15 && params.C < 0.5) {
      return {
        state: '欠拟合 (Underfitting / Oversmoothed)',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        desc: 'γ 过小使得核矩阵近似为全 1 常数矩阵，等高线曲率趋于平缓平直，无法捕捉数据非线性流形。',
      };
    } else {
      return {
        state: '良好平衡 (Optimal Generalization)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        desc: '间隔宽度与曲率取得良好平衡，保持低经验误差的同时维持了适度的几何平滑度。',
      };
    }
  }, [params]);

  // Render canvas with smooth decision surface
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const range = 1.25;
    const grid = computeDecisionGrid(points, result.alphas, result.b, params, gridResolution, range);

    const cellW = width / (gridResolution - 1);
    const cellH = height / (gridResolution - 1);

    // Draw contour color density
    for (let i = 0; i < gridResolution - 1; i++) {
      for (let j = 0; j < gridResolution - 1; j++) {
        const val = grid[i][j].val;
        const screenX = (j / (gridResolution - 1)) * width;
        const screenY = (1 - i / (gridResolution - 1)) * height;

        // Color mapped to val
        if (val > 0) {
          // Positive class: subtle emerald gradient
          const intensity = Math.min(1, val * 0.45);
          ctx.fillStyle = `rgba(16, 185, 129, ${0.05 + intensity * 0.22})`;
        } else {
          // Negative class: subtle rose gradient
          const intensity = Math.min(1, Math.abs(val) * 0.45);
          ctx.fillStyle = `rgba(244, 63, 94, ${0.05 + intensity * 0.22})`;
        }
        ctx.fillRect(screenX, screenY - cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Draw coordinate axes
    ctx.strokeStyle = '#d6d3cd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Trace contours f(x) = 0, f(x) = +1, f(x) = -1 using marching squares
    const toScreen = (gx: number, gy: number) => {
      const sx = ((gx + range) / (2 * range)) * width;
      const sy = ((range - gy) / (2 * range)) * height;
      return [sx, sy];
    };

    const drawIsoLine = (level: number, color: string, dash: number[], lineWidth: number) => {
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (let i = 0; i < gridResolution - 1; i++) {
        for (let j = 0; j < gridResolution - 1; j++) {
          const v0 = grid[i][j].val - level;
          const v1 = grid[i][j + 1].val - level;
          const v2 = grid[i + 1][j + 1].val - level;
          const v3 = grid[i + 1][j].val - level;

          // Check if zero crossing occurs
          if ((v0 > 0) !== (v1 > 0) || (v1 > 0) !== (v2 > 0) || (v2 > 0) !== (v3 > 0) || (v3 > 0) !== (v0 > 0)) {
            const p0 = toScreen(grid[i][j].x, grid[i][j].y);
            const p1 = toScreen(grid[i][j + 1].x, grid[i][j + 1].y);
            const p2 = toScreen(grid[i + 1][j + 1].x, grid[i + 1][j + 1].y);
            const p3 = toScreen(grid[i + 1][j].x, grid[i + 1][j].y);

            // Simple segment midpoints
            if ((v0 > 0) !== (v1 > 0)) {
              ctx.moveTo(p0[0] + (p1[0] - p0[0]) * 0.5, p0[1]);
              ctx.lineTo(p3[0] + (p2[0] - p3[0]) * 0.5, p3[1]);
            }
          }
        }
      }
      ctx.stroke();
    };

    // Margin bands (+1 and -1)
    drawIsoLine(1.0, '#047857', [4, 4], 1.2);
    drawIsoLine(-1.0, '#be123c', [4, 4], 1.2);
    // Decision boundary (0.0)
    drawIsoLine(0.0, '#1e293b', [], 2.2);

    // Draw data points
    points.forEach((p) => {
      const [sx, sy] = toScreen(p.x1, p.x2);

      // Highlight Support Vectors
      if (p.isSupportVector) {
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.strokeStyle = p.svType === 'bounded' ? '#e11d48' : '#d97706';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.y === 1 ? '#10b981' : '#f43f5e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });
  }, [points, result, params, gridResolution]);

  // Click on canvas to add points
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (clickMode === 'inspect') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const range = 1.25;
    const x1 = +((cx / canvas.width) * (2 * range) - range).toFixed(3);
    const x2 = +((range - (cy / canvas.height) * (2 * range))).toFixed(3);

    const newPt: Point2D = {
      id: Date.now(),
      x1,
      x2,
      y: clickMode === 'add_pos' ? 1 : -1,
    };
    setPoints((prev) => [...prev, newPt]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 03</span>
              <span>·</span>
              <span>超参数调谐</span>
              <span>·</span>
              <span>边界平滑与弯曲连续演化</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">惩罚因子 C 与 γ 参数切片</h2>
            <p className="text-sm text-stone-600 mt-1">
              通过双参数滑动切片，连续观测软间隔损失系数 <MathView math="C" /> 与高斯核带宽 <MathView math="\gamma" /> 对模型方差-偏差权衡（Bias-Variance Tradeoff）的决定性影响。
            </p>
          </div>

          {/* Model Health Status Badge */}
          <div className={`px-3 py-2 rounded-md border text-xs flex items-center gap-2 ${fittingRegime.color}`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-medium block">{fittingRegime.state}</span>
              <span className="text-[11px] opacity-90 line-clamp-1">{fittingRegime.desc}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-medium text-stone-800">实时决策面与等高线切片</span>
              <span className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                <span className="w-2.5 h-0.5 bg-stone-900 inline-block" /> 决策界 f(x)=0
              </span>
              <span className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                <span className="w-2.5 h-0.5 bg-emerald-600 border-b border-dashed inline-block" /> 间隔带 f(x)=±1
              </span>
            </div>

            {/* Click Mode Segmented Control */}
            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded border border-stone-200">
              <button
                onClick={() => setClickMode('inspect')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  clickMode === 'inspect' ? 'bg-white text-stone-800 shadow-2xs' : 'text-stone-500'
                }`}
              >
                观测
              </button>
              <button
                onClick={() => setClickMode('add_pos')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  clickMode === 'add_pos' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-500'
                }`}
              >
                +加正类
              </button>
              <button
                onClick={() => setClickMode('add_neg')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  clickMode === 'add_neg' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-500'
                }`}
              >
                +加负类
              </button>
            </div>
          </div>

          <div className="relative aspect-square w-full max-h-[440px] border border-stone-200 rounded bg-stone-50 overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={520}
              height={520}
              onClick={handleCanvasClick}
              className="w-full h-full object-contain cursor-crosshair"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>支持向量数：<strong className="font-mono text-stone-800">{result.supportVectors.length}</strong> / {points.length} ({(result.supportVectors.length / points.length * 100).toFixed(0)}%)</span>
            <span>训练准确率：<strong className="font-mono text-stone-800">{(result.trainAccuracy * 100).toFixed(1)}%</strong></span>
            <span>几何间隔宽度：<strong className="font-mono text-stone-800">{result.marginWidth}</strong></span>
          </div>
        </div>

        {/* Right: Parameter Slice Controllers & Diagnostics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sliders Card */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-stone-700" />
                超参数连续控制切片
              </span>
              <span className="text-xs text-stone-400 font-mono">Kernel: {params.kernel}</span>
            </div>

            {/* C Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-stone-800 flex items-center gap-1.5">
                  松弛惩罚因子 C (Penalty Parameter)
                </span>
                <span className="font-mono font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                  {params.C}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="3"
                step="0.1"
                value={Math.log10(params.C)}
                onChange={(e) => {
                  const val = +(Math.pow(10, parseFloat(e.target.value))).toFixed(2);
                  setParams((prev) => ({ ...prev, C: val }));
                }}
                className="w-full accent-stone-800 cursor-pointer h-1.5 bg-stone-200 rounded"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>0.01 (宽松软间隔/高容错)</span>
                <span>1.0</span>
                <span>1000 (严苛硬间隔/零容忍)</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-normal">
                控制目标函数中 <MathView math="C \sum \xi_i" /> 的权重。<MathView math="C" /> 过小会导致欠拟合；<MathView math="C" /> 过大会强行拟合每个噪声样本，破坏超平面平滑度。
              </p>
            </div>

            {/* Gamma Slider (only for RBF/Poly/Sigmoid) */}
            {params.kernel !== 'linear' && (
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-stone-800 flex items-center gap-1.5">
                    核带宽参数 γ (Kernel Width / Sensitivity)
                  </span>
                  <span className="font-mono font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                    {params.gamma}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="15"
                  step="0.05"
                  value={params.gamma}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setParams((prev) => ({ ...prev, gamma: val }));
                  }}
                  className="w-full accent-stone-800 cursor-pointer h-1.5 bg-stone-200 rounded"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>0.05 (平缓平滑/高泛化)</span>
                  <span>5.0</span>
                  <span>15.0 (极端过拟合/尖峰孤岛)</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  对应 RBF 高斯核方差倒数 <MathView math="\gamma = \frac{1}{2\sigma^2}" />。<MathView math="\gamma" /> 越大，单一支持向量的影响力半径越小，决策边界越易破碎扭曲。
                </p>
              </div>
            )}

            {/* Kernel Selector */}
            <div className="pt-2 border-t border-stone-100">
              <label className="text-xs text-stone-700 font-medium block mb-1.5">核函数族切换</label>
              <div className="grid grid-cols-4 gap-1 bg-stone-100 p-0.5 rounded text-xs">
                {(['rbf', 'linear', 'poly', 'sigmoid'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setParams((prev) => ({ ...prev, kernel: k }))}
                    className={`py-1 rounded font-medium uppercase text-[11px] transition-colors ${
                      params.kernel === k ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theoretical Slice Commentary */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2 text-xs text-stone-600">
            <span className="font-semibold text-stone-800 block">连续切片分析结论：</span>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong>低 γ + 低 C</strong>：间隔极宽，决策面近乎平直，产生“欠拟合”偏置。</li>
              <li><strong>中 γ + 适度 C</strong>：支持向量数量占总样本 15%~35%，决策边界兼顾曲率与间隔，泛化误差理论极小。</li>
              <li><strong>高 γ + 高 C</strong>：每个样本点演化为独立的高斯孤岛，“支持向量爆炸”（SV 占比逼近 100%），训练集虽为 100% 但测试集必坍塌。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
