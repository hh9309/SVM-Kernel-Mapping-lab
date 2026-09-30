export interface Point2D {
  id: number;
  x1: number;
  x2: number;
  y: 1 | -1;
  // Computed values after solving
  alpha?: number;
  slack?: number; // xi_i
  isSupportVector?: boolean;
  svType?: 'boundary' | 'bounded' | 'non-sv'; // 0 < alpha < C (boundary) vs alpha == C (bounded)
}

export type KernelType = 'rbf' | 'linear' | 'poly' | 'sigmoid';

export interface SVMHyperparams {
  C: number;
  gamma: number; // For RBF and Poly
  kernel: KernelType;
  degree: number; // For Poly
  coef0: number; // For Poly and Sigmoid
  tolerance: number; // Tolerance for KKT violation
  maxPasses: number; // SMO passes
}

export interface SVMModelResult {
  alphas: number[];
  b: number;
  supportVectors: Point2D[];
  marginWidth: number; // 2 / ||w||
  wNorm: number;
  wLinear?: [number, number]; // Only for linear kernel
  trainAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
  rocPoints: { fpr: number; tpr: number; threshold: number }[];
  auc: number;
  iterations: number;
  gramMatrixStats: {
    minEigenvalue: number;
    maxEigenvalue: number;
    conditionNumber: number;
    isPositiveSemiDefinite: boolean;
    mercerConditionSatisfied: boolean;
    trace: number;
  };
  executionTimeMs: number;
}

export type DatasetPreset = 'circles' | 'moons' | 'xor' | 'linear' | 'spiral';

export type RealCaseType = 'mnist' | 'gene' | 'breast_cancer' | 'text_sentiment';

export interface RealCaseMeta {
  id: RealCaseType;
  name: string;
  tagline: string;
  dimensions: number;
  sampleCount: number;
  classNames: [string, string];
  description: string;
  significance: string;
  recommendedKernel: KernelType;
  recommendedC: number;
  recommendedGamma: number;
  features: string[];
  rawSamples: { features: number[]; label: 1 | -1; name: string }[];
}

export type ModuleTab =
  | 'algebra_dual'        // 1. 代数与对偶
  | 'kernel_2d_projection'// 2. 核空间2D演播
  | 'param_slices'        // 3. 参数切片 (C & gamma)
  | 'support_vectors'     // 4. 支持向量与间隔
  | 'case_studies'        // 5. 四大案例
  | 'code_engine'         // 6. 代码引擎
  | 'ai_consultation'     // 7. AI对话窗口
  | 'workflow_pipeline'   // 8. 全流程导引
  | 'data_report_export'  // 9. 数据报告与导出
  | 'theory_knowledge';   // 10. 知识导引
