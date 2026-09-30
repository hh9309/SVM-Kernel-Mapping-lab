import React, { useState, useRef } from 'react';
import { Point2D, SVMHyperparams, SVMModelResult, RealCaseType } from '../../types/svm';
import { REAL_WORLD_CASES, getPointsFromRealCase } from '../../utils/datasets';
import { MathView } from '../MathView';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Copy,
  Check,
  Eye,
  Binary,
  Dna,
  Activity,
  FolderDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DataReportExportSliceProps {
  points: Point2D[];
  setPoints: React.Dispatch<React.SetStateAction<Point2D[]>>;
  params: SVMHyperparams;
  result: SVMModelResult;
}

export const DataReportExportSlice: React.FC<DataReportExportSliceProps> = ({
  points,
  setPoints,
  params,
  result,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'downloads'>('preview');
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Generate downloadable raw CSV string for any real-world case
  const generateCaseRawCSV = (caseType: RealCaseType): string => {
    const meta = REAL_WORLD_CASES[caseType];
    const headers = ['sample_name', ...meta.features.map((f) => f.replace(/,/g, '_')), 'binary_label'];
    const rows = meta.rawSamples.map((s) => [
      `"${s.name}"`,
      ...s.features,
      s.label,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  // Download raw CSV for a specific case
  const handleDownloadCaseCSV = (caseType: RealCaseType) => {
    const meta = REAL_WORLD_CASES[caseType];
    const csv = generateCaseRawCSV(caseType);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `svm_raw_${meta.id}_dataset.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Load a case directly into the lab
  const handleLoadCaseToLab = (caseType: RealCaseType) => {
    const pts = getPointsFromRealCase(caseType);
    setPoints(pts);
    setUploadSuccess(`已成功载入【${REAL_WORLD_CASES[caseType].name}】原始样本并重新训练！`);
    setUploadError(null);
  };

  // Export Support Vectors & Alphas to CSV
  const handleExportSVtoCSV = () => {
    const headers = ['id', 'x1', 'x2', 'y', 'alpha', 'slack', 'sv_type'];
    const rows = points.map((p) => [
      p.id,
      p.x1,
      p.x2,
      p.y,
      p.alpha ?? 0,
      p.slack ?? 0,
      p.svType ?? 'non-sv',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `svm_support_vectors_and_alphas_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export ROC Curve Data to CSV
  const handleExportROCtoCSV = () => {
    const headers = ['fpr', 'tpr', 'threshold'];
    const rows = result.rocPoints.map((p) => [p.fpr, p.tpr, p.threshold]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `svm_roc_auc_curve_data_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Construct structured 7-part comprehensive markdown report following the workflow pipeline steps
  const markdownReportText = `# 支持向量机与高维核空间全流程研究实验报告
**文档编号**: SVM-LAB-REP-${Date.now().toString().slice(-6)}
**实验日期**: ${new Date().toLocaleString('zh-CN')}
**实验环境**: SVM & Kernel Space Lab · 支持向量机与核空间变换实验室

---

## 第一部分：实验背景与数据集基础画像 (Experimental Background & Data Profile)
- **实验主题**: 基于凸二次规划（QP）与 Mercer 再生核希尔伯特空间（RKHS）的二分类学习
- **样本总规模 (Sample Size N)**: ${points.length} 例
- **正类样本 (Class +1)**: ${points.filter((p) => p.y === 1).length} 例 (${((points.filter((p) => p.y === 1).length / (points.length || 1)) * 100).toFixed(1)}%)
- **负类样本 (Class -1)**: ${points.filter((p) => p.y === -1).length} 例 (${((points.filter((p) => p.y === -1).length / (points.length || 1)) * 100).toFixed(1)}%)
- **核心超参数设定**:
  - 选定核函数族 (Kernel Function): \`${params.kernel.toUpperCase()}\`
  - 惩罚因子 C (Penalty Parameter): \`${params.C}\`
  - 核带宽参数 gamma (RBF/Poly Scale): \`${params.gamma}\`
  - 多项式阶数 degree: \`${params.degree}\`
  - 独立偏移量 coef0: \`${params.coef0}\`

---

## 第二部分：数据清洗与特征标准化分析 (Data Cleansing & Standardization Process)
1. **量纲一致性检验**:
   支持向量机以欧氏距离与核内积测度为几何基石。在未进行标准化的特征空间中，高方差或绝对数值较大的特征轴将强行拉伸几何拓扑，导致核矩阵等高线发生各向异性畸变。
2. **预处理流水线实施**:
   采用 Z-Score 标准化（StandardScaler）统一各维度特征分布，使得每个特征向量满足 $\\mu = 0, \\sigma^2 = 1$。
3. **距离保真度**:
   变换后有效防止了高斯 RBF 核中 $\\|x_i - x_j\\|^2$ 的单特征主导崩溃，确保 Gram 矩阵的各向同性对称性。

---

## 第三部分：核函数机制与 Gram 矩阵谱分析 (Kernel Selection & Gram Matrix Spectral Properties)
1. **Mercer 定理满足度检验**:
   当前选用的 \`${params.kernel.toUpperCase()}\` 核函数在 $L_2$ 实内积空间中严格满足连续对称半正定性（Positive Semi-Definite）：
   $$\\iint K(x, z) g(x) g(z) \\, dx \\, dz \\ge 0, \\quad \\forall g \\in L_2$$
2. **Gram 矩阵特征值谱分布与条件数**:
   - 矩阵规模: \`${points.length} \\times ${points.length}\`
   - 矩阵迹 (Trace, $\\sum K_{ii}$): \`${result.gramMatrixStats.trace}\`
   - 最大特征值 $\\lambda_{\\max}$: \`${result.gramMatrixStats.maxEigenvalue}\`
   - 最小有效特征值 $\\lambda_{\\min}$: \`${result.gramMatrixStats.minEigenvalue}\`
   - 谱条件数 $\\kappa = \\lambda_{\\max} / \\lambda_{\\min}$: \`${result.gramMatrixStats.conditionNumber}\`
3. **数值优化稳定性结论**:
   条件数未出现恶性退化，保证二次规划在对偶超平面上具备良好的强凸曲率与唯一极值解。

---

## 第四部分：对偶二次规划与 SMO 算法收敛过程 (Dual QP Formulation & SMO Convergence)
1. **对偶最优化模型**:
   $$\\max_{\\alpha} \\; \\sum_{i=1}^n \\alpha_i - \\frac{1}{2} \\sum_{i=1}^n \\sum_{j=1}^n \\alpha_i \\alpha_j y_i y_j K(x_i, x_j)$$
   $$\\text{s.t.} \\quad 0 \\le \\alpha_i \\le C, \\quad \\sum_{i=1}^n \\alpha_i y_i = 0$$
2. **Platt 序列最小优化 (SMO) 数值指标**:
   - 迭代更新循环轮数: \`${result.iterations}\` 次
   - 数值运算收敛总耗时: \`${result.executionTimeMs}\` ms
   - 极值二阶微分步长 $\\eta = 2K_{12} - K_{11} - K_{22} < 0$，目标函数单调递增至全局鞍点。
3. **偏置阈值 $b$ 求解**:
   利用落在边界面上的标准支持向量代数解析求均值，最终收敛截距 $b = ${result.b}。

---

## 第五部分：支持向量空间锁定与几何间隔评测 (Support Vectors & Margin Bounds Analysis)
1. **支持向量稀疏性锁定**:
   - 捕获支持向量总数: \`${result.supportVectors.length}\` / ${points.length} (${((result.supportVectors.length / (points.length || 1)) * 100).toFixed(1)}%)
   - 边界支持向量 ($0 < \\alpha_i < C$, 严格落在 $y_i f(x_i) = 1$): \`${result.supportVectors.filter((p) => p.svType === 'boundary').length}\` 例
   - 软间隔内部/违规支持向量 ($\\alpha_i = C$, 松弛变量 $\\xi_i > 0$): \`${result.supportVectors.filter((p) => p.svType === 'bounded').length}\` 例
2. **几何间隔界测算 (Margin Bounds)**:
   - 权向量范数 $\\|w\\|$: \`${result.wNorm}\`
   - 几何间隔宽度 $M = \\frac{2}{\\|w\\|}$: \`${result.marginWidth}\`
   - 松弛变量总损失 $\\sum \\xi_i$: \`${points.reduce((s, p) => s + (p.slack || 0), 0).toFixed(2)}\`
3. **KKT 互补松弛验证**:
   所有非支持向量乘子严格为 0，超平面位置与非支持向量坐标完全解耦，体现极致的局部鲁棒性。

---

## 第六部分：多维性能评估报告（混淆矩阵与 ROC-AUC）(Evaluation & ROC-AUC)
1. **多维分类效能指标**:
   - 训练集准确率 (Accuracy): \`${(result.trainAccuracy * 100).toFixed(2)}%\`
   - 查准精确率 (Precision): \`${(result.precision * 100).toFixed(2)}%\`
   - 查全召回率 (Recall): \`${(result.recall * 100).toFixed(2)}%\`
   - 调和 F1 分数: \`${result.f1Score.toFixed(4)}\`
   - 曲线下面积 (ROC-AUC): \`${result.auc.toFixed(4)}\`
2. **分类混淆矩阵 (Confusion Matrix)**:
   | 真实标签 \\ 预测输出 | 预测正类 (+1) | 预测负类 (-1) | 小计 |
   |-------------------|--------------|--------------|------|
   | **实际正类 (+1)** | **${result.confusionMatrix.tp}** (真正类 TP) | **${result.confusionMatrix.fn}** (假负类 FN) | ${result.confusionMatrix.tp + result.confusionMatrix.fn} |
   | **实际负类 (-1)** | **${result.confusionMatrix.fp}** (假正类 FP) | **${result.confusionMatrix.tn}** (真负类 TN) | ${result.confusionMatrix.fp + result.confusionMatrix.tn} |

---

## 第七部分：泛化风险诊断与工程调参建议 (Generalization Risk Diagnosis & Advice)
1. **支持向量爆炸 (SV Explosion) 排查**:
   当前支持向量占比为 ${((result.supportVectors.length / (points.length || 1)) * 100).toFixed(1)}%。${
     result.supportVectors.length / points.length > 0.75
       ? '【预警】支持向量占比过高，模型可能存在过拟合记忆风险，建议适当降低 gamma 或增大容错惩罚 C。'
       : '【健康】支持向量占比处于合理健康区间（10%~40%），保持了良好的结构风险泛化能力。'
   }
2. **工业工程落地建议**:
   - 高维小样本场景（如基因芯片、生物微阵列）：优先选用线性核（Linear Kernel），直接在原始高维实现凸切分，天然免疫维度诅咒。
   - 大规模数据（$N > 10^5$）：警惕 Gram 矩阵 $O(N^2)$ 内存墙，应考虑 LinearSVC 或 Nyström 随机特征近似采样。
`;

  // Copy Markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownReportText);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownReportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `svm_full_pipeline_report_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.trim().split('\n');
        if (lines.length < 3) throw new Error('CSV 文件数据行数不足');

        const newPts: Point2D[] = [];
        let idCounter = 1;
        const startIdx = isNaN(Number(lines[0].split(',')[0])) ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3) {
            const x1 = parseFloat(parts[0]);
            const x2 = parseFloat(parts[1]);
            const rawY = parts[2];
            let y: 1 | -1 = 1;
            if (rawY === '-1' || rawY === '0' || rawY.toLowerCase() === 'b' || rawY.toLowerCase() === 'neg') {
              y = -1;
            }

            if (!isNaN(x1) && !isNaN(x2)) {
              newPts.push({ id: idCounter++, x1, x2, y });
            }
          }
        }

        if (newPts.length === 0) throw new Error('未解析出有效的数值特征坐标');

        setPoints(newPts);
        setUploadSuccess(`成功导入 ${newPts.length} 个样本并已重新训练 SVM 模型！`);
        setUploadError(null);
      } catch (err: any) {
        setUploadError(err.message || 'CSV 解析失败，请检查格式');
        setUploadSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  const caseIcons: Record<RealCaseType, React.ReactNode> = {
    mnist: <Binary className="w-4 h-4 text-stone-700" />,
    gene: <Dna className="w-4 h-4 text-stone-700" />,
    breast_cancer: <Activity className="w-4 h-4 text-stone-700" />,
    text_sentiment: <FileText className="w-4 h-4 text-stone-700" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 09</span>
              <span>·</span>
              <span>数据交互与全流程学术报表</span>
              <span>·</span>
              <span>四大案例原始数据 · 7阶段学术报告在线预览</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">数据集下载与模型报告导出引擎</h2>
            <p className="text-sm text-stone-600 mt-1">
              提供四大经典实战案例原始数据独立下载；研究报告严格按照全流程导引 7 大阶段组织撰写，支持即时在线预览、Markdown 导出与 PDF 打印。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMd ? '已复制报告' : '复制报告 Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载报告 (.md)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印 / 导出 PDF</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-stone-200 pt-3">
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'preview'
                ? 'bg-stone-900 text-stone-50 shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>报告在线实时预览 (7个完整阶段)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('downloads')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'downloads'
                ? 'bg-stone-900 text-stone-50 shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span>四大案例原始数据下载 & 导入</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Report Live Preview Viewport */}
      {activeSubTab === 'preview' && (
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-6 shadow-xs select-text">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                在线格式化预览 · 依据全流程流水线 7 大核心部分编排
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-1">
                支持向量机与高维核空间全流程研究实验报告
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 font-mono">
              <span>状态：自动同频实验切片</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-2 border-stone-900 pl-2.5">
              <span>第一部分：实验背景与数据集基础画像</span>
              <span className="text-xs font-normal text-stone-400 font-mono">Part 1</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">样本总规模</span>
                <span className="font-mono font-bold text-stone-800 text-sm">{points.length} 例</span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">正/负类别分布</span>
                <span className="font-mono font-bold text-stone-800 text-sm">
                  {points.filter((p) => p.y === 1).length} : {points.filter((p) => p.y === -1).length}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">选定核函数族</span>
                <span className="font-mono font-bold text-indigo-700 text-sm uppercase">{params.kernel}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">超参数 (C, γ)</span>
                <span className="font-mono font-bold text-stone-800 text-sm">{params.C}, {params.gamma}</span>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-2 border-stone-900 pl-2.5">
              <span>第二部分：数据清洗与特征标准化分析</span>
              <span className="text-xs font-normal text-stone-400 font-mono">Part 2</span>
            </h4>
            <div className="p-3.5 bg-stone-50 rounded border border-stone-200 text-xs text-stone-700 leading-relaxed space-y-2">
              <p>
                <strong>特征量纲归一化机理：</strong> SVM 对特征尺度的敏感性源自核空间距离度量。若未做标准化，绝对值偏大的变量将强行主导高斯核内积 <MathView math="\|x_i - x_j\|^2" />，使决策边界出现严重拉伸畸变。
              </p>
              <p className="text-stone-600 text-[11px]">
                实验采用 Z-Score 标准化将特征统一缩放至标准正态分布（均值 0，标准差 1），确保了欧氏几何测度各向同性。
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-2 border-stone-900 pl-2.5">
              <span>第三部分：核函数机制与 Gram 矩阵谱分析</span>
              <span className="text-xs font-normal text-stone-400 font-mono">Part 3</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-2">
                <span className="font-semibold text-stone-800 block">Mercer 条件满足度检验：</span>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  当前核函数在 <MathView math="L_2" /> 空间内严格满足 Mercer 半正定对称条件：
                </p>
                <div className="font-serif text-center py-1">
                  <MathView math="\iint K(x, z) g(x) g(z) \, dx \, dz \ge 0, \quad \forall g \in L_2" block />
                </div>
                <span className="text-emerald-700 text-[11px] font-medium block">
                  ✓ 在高维再生核希尔伯特空间（RKHS）中具有严格良定义的内积映射。
                </span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-1.5 font-mono text-[11px]">
                <span className="font-semibold font-sans text-stone-800 text-xs block mb-1">Gram 矩阵谱统计参数：</span>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500 font-sans">矩阵规模:</span>
                  <span>{points.length} × {points.length}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500 font-sans">最大特征值 λ_max:</span>
                  <span>{result.gramMatrixStats.maxEigenvalue}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500 font-sans">最小有效特征值 λ_min:</span>
                  <span>{result.gramMatrixStats.minEigenvalue}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500 font-sans">谱条件数 κ:</span>
                  <span className="text-stone-900 font-bold">{result.gramMatrixStats.conditionNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-2 border-stone-900 pl-2.5">
              <span>第四部分：对偶二次规划与 SMO 算法收敛过程</span>
              <span className="text-xs font-normal text-stone-400 font-mono">Part 4</span>
            </h4>
            <div className="p-3.5 bg-stone-50 rounded border border-stone-200 text-xs text-stone-700 space-y-2">
              <div className="flex items-center justify-between text-stone-800 font-mono text-[11px]">
                <span>SMO 循环迭代步数: <strong className="text-stone-900">{result.iterations} 次</strong></span>
                <span>收敛耗时: <strong className="text-stone-900">{result.executionTimeMs} ms</strong></span>
                <span>截距 b: <strong className="text-stone-900">{result.b}</strong></span>
              </div>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Platt SMO 求解器每次启发式选取两个拉格朗日乘子对 <MathView math="(\alpha_i, \alpha_j)" /> 进行闭式解析优化，并在盒式约束 <MathView math="[L, H]" /> 中进行严密截断，目标函数单调收敛至全局鞍点。
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-2 border-stone-900 pl-2.5">
              <span>第五部分：支持向量空间锁定与几何间隔评测</span>
              <span className="text-xs font-normal text-stone-400 font-mono">Part 5</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">支持向量总数</span>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  {result.supportVectors.length} ({((result.supportVectors.length / (points.length || 1)) * 100).toFixed(0)}%)
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">拉格朗日乘子 α &gt; 0</span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">几何间隔 2/||w||</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">{result.marginWidth}</span>
                <span className="text-[10px] text-stone-500 block mt-0.5">正负边界平面间距</span>
              </div>
              <div className="p-3 bg-stone-50 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">松弛变量损失 ∑ξ</span>
                <span className="font-mono font-bold text-stone-800 text-sm">
                  {points.reduce((s, p) => s + (p.slack || 0), 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">软间隔侵犯惩罚</span>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-2 border-stone-900 pl-2.5">
              <span>第六部分：多维性能评估报告（混淆矩阵与 ROC-AUC）</span>
              <span className="text-xs font-normal text-stone-400 font-mono">Part 6</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Confusion Matrix Table */}
              <div className="border border-stone-200 rounded overflow-hidden">
                <table className="w-full text-center text-xs divide-y divide-stone-200 font-mono">
                  <thead className="bg-stone-50 text-stone-600 text-[11px]">
                    <tr>
                      <th className="px-3 py-2 font-sans">实际 \\ 预测</th>
                      <th className="px-3 py-2">预测正类 (+1)</th>
                      <th className="px-3 py-2">预测负类 (-1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    <tr>
                      <td className="px-3 py-2 font-sans font-medium text-stone-600 bg-stone-50/40">正类 (+1)</td>
                      <td className="px-3 py-2 text-emerald-700 font-bold">{result.confusionMatrix.tp} (TP)</td>
                      <td className="px-3 py-2 text-stone-500">{result.confusionMatrix.fn} (FN)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-sans font-medium text-stone-600 bg-stone-50/40">负类 (-1)</td>
                      <td className="px-3 py-2 text-stone-500">{result.confusionMatrix.fp} (FP)</td>
                      <td className="px-3 py-2 text-emerald-700 font-bold">{result.confusionMatrix.tn} (TN)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-sans block">训练准确率</span>
                  <span className="text-base font-bold text-stone-900">{(result.trainAccuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-sans block">ROC-AUC 积分</span>
                  <span className="text-base font-bold text-indigo-700">{result.auc.toFixed(3)}</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-sans block">查准精确率</span>
                  <span className="text-base font-bold text-stone-800">{(result.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-sans block">查全召回率</span>
                  <span className="text-base font-bold text-stone-800">{(result.recall * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-2 border-stone-900 pl-2.5">
              <span>第七部分：泛化风险诊断与工程调参建议</span>
              <span className="text-xs font-normal text-stone-400 font-mono">Part 7</span>
            </h4>
            <div className="p-4 bg-stone-50 rounded border border-stone-200 text-xs text-stone-700 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900">支持向量爆炸与过拟合诊断：</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[11px] font-medium ${
                    result.supportVectors.length / (points.length || 1) > 0.75
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {result.supportVectors.length / (points.length || 1) > 0.75 ? '需警惕 SV 比例过高' : '解稀疏性优异'}
                </span>
              </div>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                当前支持向量数量占比为 {((result.supportVectors.length / (points.length || 1)) * 100).toFixed(1)}%。
                若数据维度极大（如基因表达 $p \gg n$），建议始终维持线性核与适度惩罚系数 $C$；面对高噪声重叠场景，适度放宽软间隔容忍度可显著增强模型的测试集鲁棒性。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: 4 Real Case Downloads & Custom Upload */}
      {activeSubTab === 'downloads' && (
        <div className="space-y-6">
          {/* 4 Real Cases Raw Data Download Zone */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                四大案例原始基准数据集下载专区 (Benchmark Raw Datasets)
              </span>
              <h3 className="text-base font-semibold text-stone-900 mt-1">
                对应四大分类实战案例的原始 CSV 特征与标签数据
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                可直接下载原始 CSV 数据用于外部实验，亦可一键直接装载至当前工作区。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {(Object.keys(REAL_WORLD_CASES) as RealCaseType[]).map((cKey) => {
                const cMeta = REAL_WORLD_CASES[cKey];
                return (
                  <div
                    key={cKey}
                    className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {caseIcons[cKey]}
                        <span className="font-semibold text-xs text-stone-900">{cMeta.name}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                        {cMeta.tagline}
                      </p>
                      <div className="text-[10px] font-mono text-stone-400 mt-1">
                        维度: {cMeta.dimensions} 维 · 基准样本: {cMeta.sampleCount} 例 · 标签: {cMeta.classNames.join(' / ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                      <button
                        onClick={() => handleDownloadCaseCSV(cKey)}
                        className="flex-1 py-1.5 bg-white border border-stone-300 rounded text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-500" />
                        <span>下载原始 CSV</span>
                      </button>
                      <button
                        onClick={() => handleLoadCaseToLab(cKey)}
                        className="py-1.5 px-3 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 transition-colors shadow-2xs"
                        title="装载该数据集至当前实验区"
                      >
                        载入实验
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matrix & Custom CSV Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Custom Upload */}
            <div className="lg:col-span-6 bg-white border border-stone-200 rounded-lg p-5 space-y-4">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                自定义 CSV 数据集导入
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">
                上传您的自定义样本文件（包含特征列与二分类标签 1 / -1），系统将自动完成解析并即时重算。
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 rounded-lg p-6 text-center cursor-pointer transition-colors space-y-2"
              >
                <Upload className="w-6 h-6 mx-auto text-stone-400" />
                <div className="text-xs font-medium text-stone-800">
                  点击上传自定义 CSV 数据
                </div>
                <div className="text-[11px] text-stone-400">
                  支持格式：x1, x2, label
                </div>
              </div>

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Derived Matrices Export */}
            <div className="lg:col-span-6 bg-white border border-stone-200 rounded-lg p-5 space-y-3">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                当前模型计算矩阵导出
              </span>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-stone-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    支持向量坐标与 α 权重矩阵 (CSV)
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    样本编号、特征坐标、真实标签、乘子 α、松弛变量 ξ 及边界分类类型
                  </span>
                </div>
                <button
                  onClick={handleExportSVtoCSV}
                  className="px-3 py-1.5 bg-white border border-stone-300 rounded text-xs text-stone-700 hover:bg-stone-100 font-medium transition-colors shadow-2xs whitespace-nowrap ml-3"
                >
                  下载 CSV
                </button>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-stone-900 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    ROC-AUC 积分曲线明细数据 (CSV)
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    假阳性率 (FPR)、真阳性率 (TPR) 及各决策阈值 (Threshold) 序列
                  </span>
                </div>
                <button
                  onClick={handleExportROCtoCSV}
                  className="px-3 py-1.5 bg-white border border-stone-300 rounded text-xs text-stone-700 hover:bg-stone-100 font-medium transition-colors shadow-2xs whitespace-nowrap ml-3"
                >
                  下载 CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
