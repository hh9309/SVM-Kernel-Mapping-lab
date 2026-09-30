import React, { useState } from 'react';
import { MathView } from '../MathView';
import { Point2D, SVMHyperparams, SVMModelResult } from '../../types/svm';
import { CheckCircle2, ChevronRight, Layers, HelpCircle, ArrowRight } from 'lucide-react';

interface LagrangeDualSliceProps {
  points: Point2D[];
  params: SVMHyperparams;
  result: SVMModelResult;
}

export const LagrangeDualSlice: React.FC<LagrangeDualSliceProps> = ({
  points,
  params,
  result,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedPointId, setSelectedPointId] = useState<number>(points[0]?.id || 1);

  const selectedPoint = points.find((p) => p.id === selectedPointId) || points[0];

  const steps = [
    {
      num: 1,
      title: '原始目标 (Primal Formulation)',
      desc: '在容忍软间隔损失下最大化几何间隔',
    },
    {
      num: 2,
      title: '拉格朗日函数 (Lagrangian)',
      desc: '引入非负对偶乘子 α 与 r 构建鞍点极小极大问题',
    },
    {
      num: 3,
      title: 'KKT 条件与互补松弛',
      desc: '极值偏导推导支持向量分类准则',
    },
    {
      num: 4,
      title: '对偶二次规划 (Dual QP)',
      desc: '消去原变量 w, b, ξ 转化为 Gram 矩阵的凹二次优化',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 01</span>
              <span>·</span>
              <span>凸二次规划理论</span>
              <span>·</span>
              <span>Karush-Kuhn-Tucker 条件</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">代数建模与对偶拉格朗日切片</h2>
            <p className="text-sm text-stone-600 mt-1">
              从原始空间带约束凸二次规划，经由拉格朗日对偶性与 KKT 条件，推导高维内积对偶形式与核化机制。
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-600 bg-white border border-stone-200 px-3 py-2 rounded-md">
            <div>
              <span className="text-stone-400 block">惩罚因子 C</span>
              <span className="font-mono font-medium text-stone-800">{params.C}</span>
            </div>
            <div className="w-px h-6 bg-stone-200" />
            <div>
              <span className="text-stone-400 block">偏置 b</span>
              <span className="font-mono font-medium text-stone-800">{result.b}</span>
            </div>
            <div className="w-px h-6 bg-stone-200" />
            <div>
              <span className="text-stone-400 block">几何间隔 2/||w||</span>
              <span className="font-mono font-medium text-stone-800">{result.marginWidth}</span>
            </div>
          </div>
        </div>

        {/* Step Navigation Slices */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
          {steps.map((step) => {
            const isActive = activeStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`text-left p-3 rounded border transition-all text-xs ${
                  isActive
                    ? 'bg-white border-stone-700 shadow-xs'
                    : 'bg-stone-100/70 border-stone-200 hover:bg-white/80 text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono font-medium ${
                      isActive ? 'text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    切片 0{step.num}
                  </span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-stone-800" />}
                </div>
                <div className="font-medium text-stone-800 truncate">{step.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Detail Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Math Derivation Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg p-6 space-y-6">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">Step 1. 原始优化目标 (Primal Formulation)</span>
                <h3 className="text-base font-medium text-stone-900 mt-1">最大化间隔与软间隔松弛变量</h3>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                SVM 的几何出发点是寻找一个超平面 <MathView math="w^T \phi(x) + b = 0" />，使得两类数据到该超平面的几何间隔 <MathView math="\frac{2}{\|w\|}" /> 最大。
                为容忍现实中不可避免的噪声与重叠，引入松弛变量 <MathView math="\xi_i \ge 0" /> 与正则化惩罚因子 <MathView math="C" />：
              </p>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3 font-serif">
                <div className="text-xs text-stone-500 font-sans font-medium uppercase tracking-wider">原始目标函数 (Primal Objective)</div>
                <div className="py-2 overflow-x-auto text-center">
                  <MathView
                    math="\min_{w, b, \xi} \;\; \frac{1}{2}\|w\|^2 + C \sum_{i=1}^n \xi_i"
                    block
                  />
                </div>
                <div className="text-xs text-stone-500 font-sans font-medium uppercase tracking-wider">线性/非线性分类约束 (Primal Constraints)</div>
                <div className="py-2 overflow-x-auto text-center">
                  <MathView
                    math="\text{s.t.} \quad y_i \left( w^T \phi(x_i) + b \right) \ge 1 - \xi_i, \quad \xi_i \ge 0 \quad (\forall i = 1, \dots, n)"
                    block
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-stone-600 pt-2">
                <div className="p-3 bg-stone-50 rounded border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1">第一项 <MathView math="\frac{1}{2}\|w\|^2" /></span>
                  控制决策超平面的复杂度与泛化能力。使 <MathView math="\|w\|" /> 极小化等价于使间隔带宽度 <MathView math="\frac{2}{\|w\|}" /> 极大化。
                </div>
                <div className="p-3 bg-stone-50 rounded border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1">第二项 <MathView math="C \sum \xi_i" /></span>
                  软间隔经验损失惩罚。<MathView math="C" /> 越大对间隔侵犯的容忍度越低；<MathView math="C \to \infty" /> 退化为硬间隔。
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">Step 2. 广义拉格朗日函数 (Generalized Lagrangian)</span>
                <h3 className="text-base font-medium text-stone-900 mt-1">引入对偶乘子消解不等式约束</h3>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                对每个样本约束引入非负拉格朗日乘子 <MathView math="\alpha_i \ge 0" />（针对间隔约束）与 <MathView math="r_i \ge 0" />（针对松弛非负约束），构造无约束鞍点函数：
              </p>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3 font-serif">
                <div className="py-2 overflow-x-auto text-center">
                  <MathView
                    math="L(w, b, \xi, \alpha, r) = \frac{1}{2}\|w\|^2 + C \sum_{i=1}^n \xi_i - \sum_{i=1}^n \alpha_i \left[ y_i (w^T \phi(x_i) + b) - 1 + \xi_i \right] - \sum_{i=1}^n r_i \xi_i"
                    block
                  />
                </div>
              </div>

              <p className="text-xs text-stone-600">
                原始问题转化为对偶极小极大问题：<MathView math="\min_{w, b, \xi} \max_{\alpha \ge 0, r \ge 0} L(w, b, \xi, \alpha, r)" />。由于目标函数与约束区域均为凸集，满足 Slater 条件，强对偶性（Strong Duality）成立，原始极小值等于对偶极大值。
              </p>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">Step 3. KKT 极值偏导与互补松弛条件</span>
                <h3 className="text-base font-medium text-stone-900 mt-1">鞍点一阶偏导与三种支持向量状态</h3>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                令拉格朗日函数对原变量 <MathView math="w, b, \xi" /> 的偏导数为 0：
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <span className="font-mono text-stone-500 block mb-1">对 w 偏导 = 0</span>
                  <MathView math="\nabla_w L = 0 \implies w = \sum_{i=1}^n \alpha_i y_i \phi(x_i)" />
                  <span className="text-stone-500 block mt-2">法向量是所有支持向量在特征空间的线性组合。</span>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <span className="font-mono text-stone-500 block mb-1">对 b 偏导 = 0</span>
                  <MathView math="\frac{\partial L}{\partial b} = 0 \implies \sum_{i=1}^n \alpha_i y_i = 0" />
                  <span className="text-stone-500 block mt-2">正负样本受到的拉格朗日乘子合力保持标量平衡。</span>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                  <span className="font-mono text-stone-500 block mb-1">对 ξ 偏导 = 0</span>
                  <MathView math="C - \alpha_i - r_i = 0 \implies 0 \le \alpha_i \le C" />
                  <span className="text-stone-500 block mt-2">乘子被限定在盒状约束 [0, C] 内。</span>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-3">
                <div className="text-xs font-medium text-stone-800 mb-2">KKT 互补松弛判定切片 (Complementary Slackness)：</div>
                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex items-start gap-2 p-2 rounded bg-stone-50 border border-stone-200">
                    <span className="font-mono font-medium text-stone-700 whitespace-nowrap">α_i = 0 :</span>
                    <span>非支持向量。该点严格处于间隔带之外，<MathView math="y_i f(x_i) > 1, \xi_i = 0" />，删除这些点完全不影响决策超平面。</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-amber-50/60 border border-amber-200">
                    <span className="font-mono font-medium text-amber-800 whitespace-nowrap">0 &lt; α_i &lt; C :</span>
                    <span><strong>边界支持向量 (Boundary SV)</strong>。点恰好落在间隔边界上，<MathView math="y_i f(x_i) = 1, \xi_i = 0" />。用于稳定解析求解偏置 <MathView math="b" />。</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-rose-50/60 border border-rose-200">
                    <span className="font-mono font-medium text-rose-800 whitespace-nowrap">α_i = C :</span>
                    <span><strong>内部/违规支持向量 (Bounded SV)</strong>。点落在间隔带内部或被误分类，<MathView math="\xi_i > 0" />，受到最大的惩罚约束。</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">Step 4. 对偶二次规划与核技巧 (Dual QP & Kernel Trick)</span>
                <h3 className="text-base font-medium text-stone-900 mt-1">代入偏导消元，将内积转为 Mercer 核</h3>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                将 <MathView math="w = \sum \alpha_i y_i \phi(x_i)" /> 与 <MathView math="\sum \alpha_i y_i = 0" /> 带回拉格朗日函数，消去原变量，即可推导出纯粹依赖特征内积的对偶目标：
              </p>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3 font-serif">
                <div className="text-xs text-stone-500 font-sans font-medium uppercase tracking-wider">最终对偶二次规划 (Dual Quadratic Programming)</div>
                <div className="py-2 overflow-x-auto text-center">
                  <MathView
                    math="\max_{\alpha} \;\; \sum_{i=1}^n \alpha_i - \frac{1}{2} \sum_{i=1}^n \sum_{j=1}^n \alpha_i \alpha_j y_i y_j K(x_i, x_j)"
                    block
                  />
                </div>
                <div className="text-xs text-stone-500 font-sans font-medium uppercase tracking-wider">盒式对偶约束条件 (Box Constraints)</div>
                <div className="py-2 overflow-x-auto text-center">
                  <MathView
                    math="\text{s.t.} \quad 0 \le \alpha_i \le C \quad (\forall i = 1, \dots, n), \qquad \sum_{i=1}^n \alpha_i y_i = 0"
                    block
                  />
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded text-xs text-stone-700">
                <span className="font-semibold block mb-1">核技巧的核心蜕变：</span>
                在此形式下，特征变换 <MathView math="\phi(x)" /> 完全不需要显式计算，只出现内积形式 <MathView math="\langle \phi(x_i), \phi(x_j) \rangle" />。将其替换为满足 Mercer 定理的连续对称核函数 <MathView math="K(x_i, x_j)" />，便实现了无限维特征空间中的线性超平面划分。
              </div>
            </div>
          )}
        </div>

        {/* Live KKT Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 bg-stone-50 border border-stone-200 rounded-lg p-5 space-y-4">
          <div>
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">交互探针</span>
            <h3 className="text-sm font-medium text-stone-900 mt-0.5">当前样本 KKT 状态切片</h3>
          </div>

          <div className="text-xs text-stone-600">
            从下方列表中点击选择任意样本点，实时校验其代数约束与互补松弛判定：
          </div>

          {/* Point Selector */}
          <div className="max-h-44 overflow-y-auto border border-stone-200 rounded bg-white divide-y divide-stone-100 text-xs">
            {points.slice(0, 15).map((p) => {
              const isSelected = p.id === selectedPointId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPointId(p.id)}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.y === 1 ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    <span>点 #{p.id} ({p.x1}, {p.x2})</span>
                  </span>
                  <span className="font-mono text-stone-500">
                    α={p.alpha?.toFixed(3) || '0.000'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Point Inspection Card */}
          {selectedPoint && (
            <div className="bg-white border border-stone-200 rounded p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-800">点 #{selectedPoint.id} 代数切片</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                    selectedPoint.y === 1
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  类别 y = {selectedPoint.y === 1 ? '+1' : '-1'}
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-stone-600">
                <div className="flex justify-between">
                  <span className="text-stone-400">坐标 (x1, x2):</span>
                  <span>[{selectedPoint.x1}, {selectedPoint.x2}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">乘子 α_i:</span>
                  <span className="font-semibold text-stone-800">
                    {selectedPoint.alpha ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">松弛变量 ξ_i:</span>
                  <span>{selectedPoint.slack ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">边界分类:</span>
                  <span className="capitalize font-sans font-medium text-stone-800">
                    {selectedPoint.svType === 'boundary'
                      ? '边界支持向量 (0 < α < C)'
                      : selectedPoint.svType === 'bounded'
                      ? '松弛违规支持向量 (α = C)'
                      : '非支持向量 (α = 0)'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 text-stone-600 text-[11px] leading-relaxed">
                {selectedPoint.alpha && selectedPoint.alpha > 0.001 ? (
                  <div className="flex items-start gap-1.5 text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>该样本对最终超平面产生非零推力，直接决定决策函数权重 <MathView math="w" /> 与偏置 <MathView math="b" />。</span>
                  </div>
                ) : (
                  <div className="text-stone-500 bg-stone-50 p-2 rounded border border-stone-200">
                    该样本属于非边界样本（<MathView math="\alpha = 0" />），即使从训练集中剔除，支持向量与超平面也保持严格不变。
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
