/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Point2D, SVMHyperparams, ModuleTab, DatasetPreset, RealCaseType } from './types/svm';
import { generateSyntheticDataset } from './utils/datasets';
import { solveSVM } from './utils/svmSolver';

// Modules
import { LagrangeDualSlice } from './components/modules/LagrangeDualSlice';
import { KernelProjectionSlice } from './components/modules/KernelProjectionSlice';
import { ParameterTuningSlice } from './components/modules/ParameterTuningSlice';
import { SupportVectorsSlice } from './components/modules/SupportVectorsSlice';
import { CaseStudiesSlice } from './components/modules/CaseStudiesSlice';
import { CodeEngineSlice } from './components/modules/CodeEngineSlice';
import { AIDiagnosticSlice } from './components/modules/AIDiagnosticSlice';
import { WorkflowPipelineSlice } from './components/modules/WorkflowPipelineSlice';
import { DataReportExportSlice } from './components/modules/DataReportExportSlice';
import { TheoryKnowledgeSlice } from './components/modules/TheoryKnowledgeSlice';
import { FloatingAIWidget } from './components/FloatingAIWidget';

// Icons
import {
  Layers,
  Sparkles,
  Sliders,
  Target,
  Database,
  Code2,
  Bot,
  Workflow,
  Download,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleTab>('param_slices');
  const [preset, setPreset] = useState<DatasetPreset>('circles');

  // Interactive 2D Points State
  const [points, setPoints] = useState<Point2D[]>(() =>
    generateSyntheticDataset('circles', 60, 0.08)
  );

  // Hyperparameters State
  const [params, setParams] = useState<SVMHyperparams>({
    C: 2.0,
    gamma: 1.2,
    kernel: 'rbf',
    degree: 3,
    coef0: 1.0,
    tolerance: 1e-4,
    maxPasses: 20,
  });

  // Solve SVM whenever points or params change
  const result = useMemo(() => {
    return solveSVM(points, params);
  }, [points, params]);

  // Switch Synthetic preset
  const handleSelectPreset = (newPreset: DatasetPreset) => {
    setPreset(newPreset);
    setPoints(generateSyntheticDataset(newPreset, 60, 0.08));
  };

  // Apply real-world case study
  const handleApplyRealCase = (
    casePoints: Point2D[],
    newParams: Partial<SVMHyperparams>
  ) => {
    setPoints(casePoints);
    setParams((prev) => ({
      ...prev,
      ...newParams,
    }));
    setActiveModule('param_slices');
  };

  // 10 Core Modules Configuration
  const modulesList: { id: ModuleTab; name: string; tag: string; icon: React.ReactNode }[] = [
    { id: 'algebra_dual', name: '代数与对偶', tag: '01', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'kernel_2d_projection', name: '核空间2D演播', tag: '02', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'param_slices', name: '参数切片', tag: '03', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'support_vectors', name: '支持向量', tag: '04', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'case_studies', name: '四大案例', tag: '05', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'code_engine', name: '代码引擎', tag: '06', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'ai_consultation', name: 'AI对话窗口', tag: '07', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'workflow_pipeline', name: '全流程导引', tag: '08', icon: <Workflow className="w-3.5 h-3.5" /> },
    { id: 'data_report_export', name: '数据报告', tag: '09', icon: <Download className="w-3.5 h-3.5" /> },
    { id: 'theory_knowledge', name: '知识导引', tag: '10', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 font-sans flex flex-col selection:bg-stone-300 selection:text-stone-900">
      {/* Top Academic Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-stone-900 text-stone-50 flex items-center justify-center font-serif font-bold text-sm tracking-tighter">
              SVM
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                <span>Kernel Space Lab</span>
                <span>·</span>
                <span>高维几何与对偶凸优化</span>
              </div>
              <h1 className="text-base font-semibold text-stone-900 leading-tight">
                支持向量机与核空间变换实验室
              </h1>
            </div>
          </div>

          {/* Quick Benchmark Preset Switcher */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded border border-stone-200">
              <span className="text-[11px] text-stone-500 px-2 font-medium">基准流形：</span>
              {(['circles', 'moons', 'xor', 'linear', 'spiral'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => handleSelectPreset(d)}
                  className={`px-2 py-1 rounded capitalize text-[11px] font-medium transition-colors ${
                    preset === d
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {d === 'circles'
                    ? '同心圆'
                    : d === 'moons'
                    ? '双月'
                    : d === 'xor'
                    ? '异或'
                    : d === 'linear'
                    ? '线性'
                    : '双螺旋'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPoints(generateSyntheticDataset(preset, 60, 0.08))}
              className="p-1.5 border border-stone-200 rounded hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-colors"
              title="重抽样生成新数据"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 10 Core Modules Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none border-t border-stone-100">
          <nav className="flex items-center gap-1 py-1.5">
            {modulesList.map((m) => {
              const isActive = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs whitespace-nowrap font-medium transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-stone-50 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? 'text-stone-300' : 'text-stone-400'
                    }`}
                  >
                    {m.tag}
                  </span>
                  <span>{m.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Module Switcher Rendering */}
        {activeModule === 'algebra_dual' && (
          <LagrangeDualSlice points={points} params={params} result={result} />
        )}

        {activeModule === 'kernel_2d_projection' && (
          <KernelProjectionSlice datasetType={preset} />
        )}

        {activeModule === 'param_slices' && (
          <ParameterTuningSlice
            points={points}
            setPoints={setPoints}
            params={params}
            setParams={setParams}
            result={result}
          />
        )}

        {activeModule === 'support_vectors' && (
          <SupportVectorsSlice points={points} params={params} result={result} />
        )}

        {activeModule === 'case_studies' && (
          <CaseStudiesSlice onApplyCase={handleApplyRealCase} />
        )}

        {activeModule === 'code_engine' && (
          <CodeEngineSlice points={points} params={params} result={result} />
        )}

        {activeModule === 'ai_consultation' && (
          <AIDiagnosticSlice points={points} params={params} result={result} />
        )}

        {activeModule === 'workflow_pipeline' && (
          <WorkflowPipelineSlice
            points={points}
            setPoints={setPoints}
            params={params}
            setParams={setParams}
            result={result}
          />
        )}

        {activeModule === 'data_report_export' && (
          <DataReportExportSlice
            points={points}
            setPoints={setPoints}
            params={params}
            result={result}
          />
        )}

        {activeModule === 'theory_knowledge' && (
          <TheoryKnowledgeSlice
            points={points}
            params={params}
            setParams={setParams}
            result={result}
          />
        )}
      </main>

      {/* Persistent Floating AI Doctor Dock */}
      <FloatingAIWidget points={points} params={params} result={result} />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span>支持向量机与核空间变换实验室</span>
            <span>·</span>
            <span>十大切片核心模块联动求解</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>KKT 凸二次优化</span>
            <span>Mercer 半正定核</span>
            <span>Platt SMO 求解器</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
