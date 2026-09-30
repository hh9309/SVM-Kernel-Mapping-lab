import React, { useState } from 'react';
import { MathView } from '../MathView';
import { Point2D, SVMHyperparams, SVMModelResult } from '../../types/svm';
import { SVMMechanismDemo } from './SVMMechanismDemo';
import { Target, AlertCircle, BarChart3, ArrowUpDown, Filter, Sparkles } from 'lucide-react';

interface SupportVectorsSliceProps {
  points: Point2D[];
  params: SVMHyperparams;
  result: SVMModelResult;
}

export const SupportVectorsSlice: React.FC<SupportVectorsSliceProps> = ({
  points,
  params,
  result,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'boundary' | 'bounded'>('all');
  const [sortField, setSortField] = useState<'alpha' | 'slack' | 'id'>('alpha');

  const totalPoints = points.length;
  const svList = result.supportVectors;
  const boundarySVs = svList.filter((p) => p.svType === 'boundary');
  const boundedSVs = svList.filter((p) => p.svType === 'bounded');

  // Total slack variable sum
  const totalSlack = points.reduce((sum, p) => sum + (p.slack || 0), 0);
  const totalHingeLoss = +(totalSlack / totalPoints).toFixed(4);

  // Filtered & sorted list
  const filteredList = svList
    .filter((p) => {
      if (filterType === 'boundary') return p.svType === 'boundary';
      if (filterType === 'bounded') return p.svType === 'bounded';
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'alpha') return (b.alpha || 0) - (a.alpha || 0);
      if (sortField === 'slack') return (b.slack || 0) - (a.slack || 0);
      return a.id - b.id;
    });

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 04</span>
              <span>·</span>
              <span>稀疏解与几何间隔</span>
              <span>·</span>
              <span>支持向量剖析</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">支持向量与间隔带高亮切片</h2>
            <p className="text-sm text-stone-600 mt-1">
              同屏精准识别拉格朗日乘子 <MathView math="\alpha_i > 0" /> 的骨干支撑点，剖析几何间隔宽度 <MathView math="\frac{2}{\|w\|}" /> 与松弛变量损失 <MathView math="\sum \xi_i" />。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-white border border-stone-200 rounded text-xs text-stone-700">
              <span className="text-stone-400 block text-[11px]">总支持向量</span>
              <span className="font-mono font-bold text-stone-900 text-sm">
                {svList.length} <span className="text-stone-400 text-xs font-normal">/ {totalPoints} ({(svList.length / totalPoints * 100).toFixed(0)}%)</span>
              </span>
            </div>
            <div className="px-3 py-2 bg-white border border-stone-200 rounded text-xs text-stone-700">
              <span className="text-stone-400 block text-[11px]">几何间隔 2/||w||</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">{result.marginWidth}</span>
            </div>
            <div className="px-3 py-2 bg-white border border-stone-200 rounded text-xs text-stone-700">
              <span className="text-stone-400 block text-[11px]">松弛变量损失 ∑ξ</span>
              <span className="font-mono font-bold text-amber-700 text-sm">{totalSlack.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Boundary SVs */}
        <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-amber-100" />
              边界支持向量 (0 &lt; α &lt; C)
            </span>
            <span className="font-mono text-sm font-semibold text-amber-800">{boundarySVs.length}</span>
          </div>
          <p className="text-xs text-stone-600">
            严格落于最大间隔边界平面 <MathView math="y_i f(x_i) = 1" /> 上，松弛变量 <MathView math="\xi_i = 0" />。此类样本是确定超平面位移常数 <MathView math="b" /> 的数学基准。
          </p>
        </div>

        {/* Bounded SVs */}
        <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 bg-rose-100" />
              内部/软间隔支持向量 (α = C)
            </span>
            <span className="font-mono text-sm font-semibold text-rose-800">{boundedSVs.length}</span>
          </div>
          <p className="text-xs text-stone-600">
            落入间隔带内部或发生分类错误的点，松弛变量 <MathView math="\xi_i > 0" />。此类点受到惩罚因子 <MathView math="C" /> 的饱和盒式约束。
          </p>
        </div>

        {/* Margin Ribbon Stretch Gauge */}
        <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-800">
              几何间隔带延展度 (Margin Gauge)
            </span>
            <span className="font-mono text-xs text-stone-500">||w|| = {result.wNorm}</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, (result.marginWidth / 3.0) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-stone-400 font-mono">
            <span>极窄 (过拟合高敏感)</span>
            <span>当前: {result.marginWidth}</span>
            <span>宽阔 (鲁棒抗噪)</span>
          </div>
        </div>
      </div>

      {/* Interactive SVM Core Philosophy & Mechanism Demonstration Module */}
      <SVMMechanismDemo />

      {/* Alpha Weights Distribution & SV Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alpha Distribution Histogram (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-stone-700" />
              拉格朗日乘子 α 谱切片
            </span>
            <span className="text-xs text-stone-400">Box limit: C = {params.C}</span>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-stone-600">
              每个支持向量对决策平面的贡献权重柱状图：
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {svList.slice(0, 16).map((sv) => {
                const pct = Math.min(100, ((sv.alpha || 0) / params.C) * 100);
                const isBounded = sv.svType === 'bounded';
                return (
                  <div key={sv.id} className="flex items-center gap-2 text-xs">
                    <span className="w-14 font-mono text-stone-500 truncate">#{sv.id} (y={sv.y})</span>
                    <div className="flex-1 bg-stone-100 h-3 rounded-xs overflow-hidden relative">
                      <div
                        className={`h-full ${isBounded ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono font-medium text-stone-700">
                      {sv.alpha?.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded border border-stone-200 text-xs text-stone-600">
            <strong>KKT 稀疏性定理：</strong> 绝大多数样本的 <MathView math="\alpha_i = 0" />，意味着 SVM 的决策超平面仅由这几个关键支撑向量完全锁定，具备极强的稀疏性与鲁棒性。
          </div>
        </div>

        {/* Detailed Support Vector Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-stone-700" />
              支持向量精密属性矩阵
            </span>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded border border-stone-200 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterType === 'all' ? 'bg-white font-medium text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                全部 ({svList.length})
              </button>
              <button
                onClick={() => setFilterType('boundary')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterType === 'boundary' ? 'bg-white font-medium text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                边界 ({boundarySVs.length})
              </button>
              <button
                onClick={() => setFilterType('bounded')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterType === 'bounded' ? 'bg-white font-medium text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                软间隔 ({boundedSVs.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded">
            <table className="w-full text-xs text-left divide-y divide-stone-200">
              <thead className="bg-stone-50 text-stone-600 font-mono">
                <tr>
                  <th className="px-3 py-2">编号</th>
                  <th className="px-3 py-2">坐标 (x1, x2)</th>
                  <th className="px-3 py-2">类别 y</th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-stone-900"
                    onClick={() => setSortField('alpha')}
                  >
                    乘子 α <ArrowUpDown className="w-3 h-3 inline" />
                  </th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-stone-900"
                    onClick={() => setSortField('slack')}
                  >
                    松弛 ξ <ArrowUpDown className="w-3 h-3 inline" />
                  </th>
                  <th className="px-3 py-2">状态分类</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono bg-white">
                {filteredList.slice(0, 8).map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/80">
                    <td className="px-3 py-2 text-stone-500">#{p.id}</td>
                    <td className="px-3 py-2">[{p.x1}, {p.x2}]</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-medium ${
                          p.y === 1
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.y === 1 ? '+1' : '-1'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-stone-800">{p.alpha}</td>
                    <td className="px-3 py-2 text-stone-600">{p.slack}</td>
                    <td className="px-3 py-2 font-sans">
                      {p.svType === 'boundary' ? (
                        <span className="text-amber-700 font-medium">边界 SV (0&lt;α&lt;C)</span>
                      ) : (
                        <span className="text-rose-700 font-medium">软间隔 SV (α=C)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredList.length > 8 && (
            <div className="text-center text-xs text-stone-400">
              仅展示前 8 个主要支持向量，可在模块 09 导出全量 CSV 矩阵。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
