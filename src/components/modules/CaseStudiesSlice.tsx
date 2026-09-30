import React, { useState } from 'react';
import { MathView } from '../MathView';
import { REAL_WORLD_CASES, getPointsFromRealCase } from '../../utils/datasets';
import { RealCaseType, Point2D, SVMHyperparams } from '../../types/svm';
import { Database, ArrowRight, Dna, FileText, Activity, Binary, Check } from 'lucide-react';

interface CaseStudiesSliceProps {
  onApplyCase: (points: Point2D[], params: Partial<SVMHyperparams>, caseType: RealCaseType) => void;
  activeCase?: RealCaseType;
}

export const CaseStudiesSlice: React.FC<CaseStudiesSliceProps> = ({
  onApplyCase,
  activeCase = 'mnist',
}) => {
  const [selectedCase, setSelectedCase] = useState<RealCaseType>(activeCase);
  const meta = REAL_WORLD_CASES[selectedCase];

  const caseIcons: Record<RealCaseType, React.ReactNode> = {
    mnist: <Binary className="w-4 h-4" />,
    gene: <Dna className="w-4 h-4" />,
    breast_cancer: <Activity className="w-4 h-4" />,
    text_sentiment: <FileText className="w-4 h-4" />,
  };

  const handleApply = () => {
    const points = getPointsFromRealCase(selectedCase);
    onApplyCase(
      points,
      {
        kernel: meta.recommendedKernel,
        C: meta.recommendedC,
        gamma: meta.recommendedGamma,
      },
      selectedCase
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 05</span>
              <span>·</span>
              <span>实战基准库</span>
              <span>·</span>
              <span>多领域高维与生物数据</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">四大分类实战案例库</h2>
            <p className="text-sm text-stone-600 mt-1">
              覆盖机器视觉、生物信息基因微阵列、医学肿瘤病理与自然语言高维稀疏文本四大经典场景。一键切换真实标准化数据与推荐超参数。
            </p>
          </div>

          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-50 rounded hover:bg-stone-800 transition-colors text-xs font-medium shadow-xs"
          >
            <span>加载当前案例至工作区</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Case Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
          {(Object.keys(REAL_WORLD_CASES) as RealCaseType[]).map((cKey) => {
            const cMeta = REAL_WORLD_CASES[cKey];
            const isSelected = selectedCase === cKey;
            return (
              <button
                key={cKey}
                onClick={() => setSelectedCase(cKey)}
                className={`p-3 rounded border text-left transition-all ${
                  isSelected
                    ? 'bg-white border-stone-800 shadow-xs'
                    : 'bg-stone-100/60 border-stone-200 hover:bg-white text-stone-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 text-stone-800">
                  {caseIcons[cKey]}
                  <span className="font-medium text-xs truncate">{cMeta.name}</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  {cMeta.dimensions} 维 · {cMeta.sampleCount} 样本
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Academic Profile (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-lg p-6 space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                案例特征档案 · {meta.id.toUpperCase()}
              </span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">{meta.name}</h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">{meta.tagline}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-400 block font-mono">二分类目标</span>
              <span className="text-xs font-medium text-stone-800">
                {meta.classNames[0]} vs {meta.classNames[1]}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
            <div>
              <strong className="text-stone-800 block mb-1">业务与理论背景：</strong>
              <p>{meta.description}</p>
            </div>
            <div>
              <strong className="text-stone-800 block mb-1">SVM 与核方法核心学术启示：</strong>
              <div className="p-3 bg-stone-50 rounded border border-stone-200 text-stone-700">
                {meta.significance}
              </div>
            </div>
          </div>

          {/* Dimension vs Sample ratio */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-400 block text-[11px]">原始特征维度 (p)</span>
              <span className="font-mono font-semibold text-stone-800 text-sm">{meta.dimensions} 维</span>
            </div>
            <div className="p-3 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-400 block text-[11px]">基准实验样本 (n)</span>
              <span className="font-mono font-semibold text-stone-800 text-sm">{meta.sampleCount} 例</span>
            </div>
            <div className="p-3 bg-stone-50 rounded border border-stone-200">
              <span className="text-stone-400 block text-[11px]">维度/样本比 (p/n)</span>
              <span className="font-mono font-semibold text-indigo-700 text-sm">
                {(meta.dimensions / meta.sampleCount).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Data Matrix Preview & Recommended Hyperparams (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recommended Parameters */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
              理论推荐超参数切片 (Theoretical Grid Optimum)
            </span>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">推荐核函数</span>
                <span className="font-mono font-bold text-stone-800 uppercase text-xs">
                  {meta.recommendedKernel}
                </span>
              </div>
              <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">惩罚因子 C</span>
                <span className="font-mono font-bold text-stone-800 text-xs">
                  {meta.recommendedC}
                </span>
              </div>
              <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">核带宽 γ</span>
                <span className="font-mono font-bold text-stone-800 text-xs">
                  {meta.recommendedGamma}
                </span>
              </div>
            </div>

            <button
              onClick={handleApply}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-xs border border-stone-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>载入当前实战数据并应用该组超参数</span>
            </button>
          </div>

          {/* Raw Samples Preview Matrix */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
              标准化样本切片预览 (Standardized Features)
            </span>

            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded text-xs divide-y divide-stone-100">
              {meta.rawSamples.map((item, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between font-mono text-[11px]">
                  <span className="font-sans text-stone-700 truncate w-32">{item.name}</span>
                  <span className="text-stone-500">[{item.features.slice(0, 2).map((v) => v.toFixed(2)).join(', ')}]</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-medium ${
                      item.label === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {item.label === 1 ? '+1' : '-1'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
