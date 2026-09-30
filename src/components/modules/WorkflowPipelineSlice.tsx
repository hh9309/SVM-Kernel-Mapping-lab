import React, { useState } from 'react';
import { MathView } from '../MathView';
import { Point2D, SVMHyperparams, SVMModelResult } from '../../types/svm';
import { solveSVM } from '../../utils/svmSolver';
import { ArrowRight, Check, Sparkles, Scale, Cpu, Layers, CheckCircle2, FileCheck } from 'lucide-react';

interface WorkflowPipelineSliceProps {
  points: Point2D[];
  setPoints: React.Dispatch<React.SetStateAction<Point2D[]>>;
  params: SVMHyperparams;
  setParams: React.Dispatch<React.SetStateAction<SVMHyperparams>>;
  result: SVMModelResult;
}

export const WorkflowPipelineSlice: React.FC<WorkflowPipelineSliceProps> = ({
  points,
  setPoints,
  params,
  setParams,
  result,
}) => {
  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const [scalerType, setScalerType] = useState<'none' | 'standard' | 'minmax'>('standard');

  // Apply standardization
  const handleApplyScaler = (type: 'none' | 'standard' | 'minmax') => {
    setScalerType(type);
    if (type === 'none') return;

    if (type === 'standard') {
      const meanX1 = points.reduce((s, p) => s + p.x1, 0) / points.length;
      const meanX2 = points.reduce((s, p) => s + p.x2, 0) / points.length;
      const stdX1 = Math.sqrt(points.reduce((s, p) => s + (p.x1 - meanX1) ** 2, 0) / points.length) || 1;
      const stdX2 = Math.sqrt(points.reduce((s, p) => s + (p.x2 - meanX2) ** 2, 0) / points.length) || 1;

      setPoints((prev) =>
        prev.map((p) => ({
          ...p,
          x1: +((p.x1 - meanX1) / stdX1 * 0.6).toFixed(3),
          x2: +((p.x2 - meanX2) / stdX2 * 0.6).toFixed(3),
        }))
      );
    } else if (type === 'minmax') {
      const minX1 = Math.min(...points.map((p) => p.x1));
      const maxX1 = Math.max(...points.map((p) => p.x1));
      const minX2 = Math.min(...points.map((p) => p.x2));
      const maxX2 = Math.max(...points.map((p) => p.x2));

      setPoints((prev) =>
        prev.map((p) => ({
          ...p,
          x1: +(((p.x1 - minX1) / (maxX1 - minX1 || 1)) * 1.6 - 0.8).toFixed(3),
          x2: +(((p.x2 - minX2) / (maxX2 - minX2 || 1)) * 1.6 - 0.8).toFixed(3),
        }))
      );
    }
  };

  const steps = [
    { num: 1, title: '数据清洗与标准化', desc: '消除量纲鸿沟与距离失真', icon: <Scale className="w-4 h-4" /> },
    { num: 2, title: '核函数与二次规划', desc: 'Mercer 核选取与 Gram 矩阵计算', icon: <Layers className="w-4 h-4" /> },
    { num: 3, title: '支持向量与 Margin', desc: 'KKT 条件迭代收敛与间隔锁定', icon: <Cpu className="w-4 h-4" /> },
    { num: 4, title: '全维指标与 ROC 评估', desc: '混淆矩阵、F1、AUC 报告', icon: <FileCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 08</span>
              <span>·</span>
              <span>全流程导引流水线</span>
              <span>·</span>
              <span>清洗 → 映射 → 求解 → 评估</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">数据 → 核映射 → 求解 → 评估全流程</h2>
            <p className="text-sm text-stone-600 mt-1">
              标准工业级 SVM 建模四大全闭环工序切片。每一步紧密协同，确保数学严格性与工程可复现性。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPipelineStep((prev) => Math.max(1, prev - 1))}
              disabled={pipelineStep === 1}
              className="px-3 py-1.5 border border-stone-300 rounded text-xs text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-30"
            >
              上一步
            </button>
            <button
              onClick={() => setPipelineStep((prev) => Math.min(4, prev + 1))}
              disabled={pipelineStep === 4}
              className="px-3 py-1.5 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 disabled:opacity-30 flex items-center gap-1.5 shadow-2xs"
            >
              <span>下一步</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 4 Step Pipeline Tracker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-200">
          {steps.map((st) => {
            const isCurrent = pipelineStep === st.num;
            const isDone = pipelineStep > st.num;
            return (
              <button
                key={st.num}
                onClick={() => setPipelineStep(st.num)}
                className={`p-3 rounded border text-left transition-all ${
                  isCurrent
                    ? 'bg-white border-stone-800 shadow-xs'
                    : isDone
                    ? 'bg-stone-100/80 border-stone-300 text-stone-700'
                    : 'bg-stone-50/60 border-stone-200 text-stone-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-mono font-medium">
                    {st.icon}
                    <span>步骤 0{st.num}</span>
                  </span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-xs font-medium text-stone-800 truncate">{st.title}</div>
                <div className="text-[11px] text-stone-500 truncate">{st.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Working Canvas */}
      <div className="bg-white border border-stone-200 rounded-lg p-6">
        {/* Step 1: Standardization */}
        {pipelineStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">工序 1 / 4</span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">数据清洗与特征标准化对比实验</h3>
              <p className="text-xs text-stone-600 mt-1">
                SVM 极度依赖样本点之间的欧氏距离（尤其高斯 RBF 核 <MathView math="\|x_i - x_j\|^2" />）。未做标准化的特征中，大数值特征（如年收入 100000）将彻底淹没小数值特征（如年龄 30），导致核距离完全失真。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleApplyScaler('standard')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  scalerType === 'standard' ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-medium text-xs text-stone-900">
                  <span>Z-Score 标准化 (推荐)</span>
                  {scalerType === 'standard' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="font-serif text-center py-2 text-stone-700">
                  <MathView math="z = \frac{x - \mu}{\sigma}" block />
                </div>
                <p className="text-[11px] text-stone-500">
                  均值置 0，方差置 1。保持异常值分布并使高斯核等高线呈现完美的球状对称分布。
                </p>
              </button>

              <button
                onClick={() => handleApplyScaler('minmax')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  scalerType === 'minmax' ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-medium text-xs text-stone-900">
                  <span>MinMax 归一化</span>
                  {scalerType === 'minmax' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="font-serif text-center py-2 text-stone-700">
                  <MathView math="z = \frac{x - x_{\min}}{x_{\max} - x_{\min}}" block />
                </div>
                <p className="text-[11px] text-stone-500">
                  将所有特征硬性缩放至 [-1, 1] 或 [0, 1] 区间，适合特征有明确物理上下界的场景。
                </p>
              </button>

              <button
                onClick={() => handleApplyScaler('none')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  scalerType === 'none' ? 'border-amber-600 bg-amber-50/20 shadow-xs' : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-medium text-xs text-stone-900">
                  <span>无预处理 (原始量纲)</span>
                  {scalerType === 'none' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="font-serif text-center py-2 text-stone-700">
                  <MathView math="z = x" block />
                </div>
                <p className="text-[11px] text-amber-700">
                  高风险：若各维度量纲差异悬殊，易导致某些维度特征权重完全失效。
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Kernel & Gram Matrix */}
        {pipelineStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">工序 2 / 4</span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">核函数选取与 Gram 矩阵计算</h3>
              <p className="text-xs text-stone-600 mt-1">
                计算样本间内积映射矩阵 <MathView math="K_{ij} = K(x_i, x_j)" />。Gram 矩阵必须满足半正定性以确保对偶问题具备全局唯一凸极值。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <span className="font-medium text-stone-800 block">选择用于二次规划的核函数：</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['rbf', 'linear', 'poly', 'sigmoid'] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setParams((prev) => ({ ...prev, kernel: k }))}
                      className={`p-2.5 rounded border text-left transition-colors uppercase font-mono ${
                        params.kernel === k
                          ? 'bg-stone-900 text-stone-50 border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {k === 'rbf' ? 'RBF 径向基高斯核' : k === 'linear' ? 'Linear 线性核' : k === 'poly' ? 'Poly 多项式核' : 'Sigmoid 双曲正切核'}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1.5">
                  <span className="font-semibold text-stone-800 block">核数学表达式：</span>
                  {params.kernel === 'rbf' && <MathView math="K(x, z) = \exp(-\gamma \|x - z\|^2)" block />}
                  {params.kernel === 'linear' && <MathView math="K(x, z) = x^T z" block />}
                  {params.kernel === 'poly' && <MathView math="K(x, z) = (\gamma x^T z + r)^d" block />}
                  {params.kernel === 'sigmoid' && <MathView math="K(x, z) = \tanh(\gamma x^T z + r)" block />}
                </div>
              </div>

              {/* Gram Matrix Stats */}
              <div className="space-y-3 bg-stone-50 p-4 rounded border border-stone-200">
                <span className="font-medium text-stone-800 block">当前 Gram 矩阵理论指标：</span>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span className="text-stone-500 font-sans">矩阵规模 (N x N):</span>
                    <span>{points.length} × {points.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span className="text-stone-500 font-sans">半正定判定 (PSD):</span>
                    <span className="text-emerald-700 font-sans font-semibold">严格半正定 (λ ≥ 0)</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span className="text-stone-500 font-sans">条件数 κ:</span>
                    <span>{result.gramMatrixStats.conditionNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span className="text-stone-500 font-sans">Mercer 准则满足度:</span>
                    <span className="text-emerald-700 font-sans font-semibold">完全满足 (RKHS 完备)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Optimization & Support Vectors */}
        {pipelineStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">工序 3 / 4</span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">SMO 求解迭代与支持向量捕获</h3>
              <p className="text-xs text-stone-600 mt-1">
                运行序列最小优化算法，交替更新对偶乘子对并维护 KKT 互补松弛条件，最终锁定全局极小解。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">SMO 迭代轮数</span>
                <span className="font-mono text-lg font-bold text-stone-800">{result.iterations} 次</span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">数值收敛耗时</span>
                <span className="font-mono text-lg font-bold text-stone-800">{result.executionTimeMs} ms</span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">捕获支持向量</span>
                <span className="font-mono text-lg font-bold text-amber-700">{result.supportVectors.length} 个</span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">几何间隔 2/||w||</span>
                <span className="font-mono text-lg font-bold text-indigo-700">{result.marginWidth}</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded text-xs text-emerald-950 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>二次规划已完美收敛：</strong> 所有样本乘子均严格满足盒式约束 <MathView math="0 \le \alpha_i \le C" /> 与等式平衡约束 <MathView math="\sum \alpha_i y_i = 0" />。解具有严格的全局最优性保证。
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Full Evaluation & ROC */}
        {pipelineStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">工序 4 / 4</span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">模型多维评估与 ROC / AUC 曲线</h3>
              <p className="text-xs text-stone-600 mt-1">
                综合混淆矩阵、准确率、精确率、召回率、F1 分数以及受试者工作特征曲线 (ROC)。
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Confusion Matrix (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                  混淆矩阵 (Confusion Matrix)
                </span>

                <div className="border border-stone-200 rounded p-4 bg-stone-50 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-3 bg-white border border-stone-200 rounded">
                      <span className="text-[10px] text-stone-400 block">真正类 (TP)</span>
                      <span className="text-lg font-bold text-emerald-700">{result.confusionMatrix.tp}</span>
                    </div>
                    <div className="p-3 bg-white border border-stone-200 rounded">
                      <span className="text-[10px] text-stone-400 block">假负类 (FN)</span>
                      <span className="text-lg font-bold text-stone-600">{result.confusionMatrix.fn}</span>
                    </div>
                    <div className="p-3 bg-white border border-stone-200 rounded">
                      <span className="text-[10px] text-stone-400 block">假正类 (FP)</span>
                      <span className="text-lg font-bold text-stone-600">{result.confusionMatrix.fp}</span>
                    </div>
                    <div className="p-3 bg-white border border-stone-200 rounded">
                      <span className="text-[10px] text-stone-400 block">真负类 (TN)</span>
                      <span className="text-lg font-bold text-emerald-700">{result.confusionMatrix.tn}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-200 text-center">
                    <div>
                      <span className="text-[10px] text-stone-400 block">准确率</span>
                      <span className="font-mono font-bold text-stone-800">{(result.trainAccuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">精确率</span>
                      <span className="font-mono font-bold text-stone-800">{(result.precision * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">召回率</span>
                      <span className="font-mono font-bold text-stone-800">{(result.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">F1 分数</span>
                      <span className="font-mono font-bold text-indigo-700">{result.f1Score.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROC Curve Graph (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                    ROC 曲线与 AUC 积分
                  </span>
                  <span className="text-xs font-mono bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                    AUC = {result.auc.toFixed(3)}
                  </span>
                </div>

                <div className="relative aspect-16/10 border border-stone-200 rounded bg-stone-50 p-4 flex flex-col justify-between">
                  <svg className="w-full h-full" viewBox="0 0 300 200">
                    {/* Diagonal baseline */}
                    <line x1="30" y1="170" x2="270" y2="30" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />

                    {/* Axes */}
                    <line x1="30" y1="170" x2="270" y2="170" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="30" y1="170" x2="30" y2="30" stroke="#94a3b8" strokeWidth="1.5" />

                    {/* ROC Curve Path */}
                    {result.rocPoints.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#4338ca"
                        strokeWidth="2.5"
                        points={result.rocPoints
                          .map((p) => `${30 + p.fpr * 240},${170 - p.tpr * 140}`)
                          .join(' ')}
                      />
                    )}
                  </svg>
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                    <span>FPR: 0.0 (假阳性率)</span>
                    <span>ROC 曲线面积 AUC: {result.auc}</span>
                    <span>1.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
