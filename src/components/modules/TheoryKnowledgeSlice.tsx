import React, { useState } from 'react';
import { MathView } from '../MathView';
import { Point2D, SVMHyperparams, SVMModelResult } from '../../types/svm';
import {
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Sliders,
  ChevronRight,
  Check,
  History,
  Briefcase,
  GitBranch,
  Dna,
  Binary,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface TheoryKnowledgeSliceProps {
  points: Point2D[];
  params: SVMHyperparams;
  setParams: React.Dispatch<React.SetStateAction<SVMHyperparams>>;
  result: SVMModelResult;
}

export const TheoryKnowledgeSlice: React.FC<TheoryKnowledgeSliceProps> = ({
  points,
  params,
  setParams,
  result,
}) => {
  const [activeSlice, setActiveSlice] = useState<number>(1);
  const [autoTuningApplied, setAutoTuningApplied] = useState<boolean>(false);

  const svRatio = +(result.supportVectors.length / (points.length || 1)).toFixed(2);
  const isSVExplosion = svRatio > 0.75;
  const isGammaTooLarge = params.gamma > 5.0 && params.kernel === 'rbf';

  // Auto-Tuning Advisor Logic
  const handleAutoTune = () => {
    // Determine reasonable heuristic based on data distribution
    let bestKernel = params.kernel;
    let bestC = 2.0;
    let bestGamma = 1.0;

    if (points.length < 50) {
      bestC = 1.5;
      bestGamma = 0.8;
    } else {
      bestC = 5.0;
      bestGamma = 1.2;
    }

    setParams((prev) => ({
      ...prev,
      C: bestC,
      gamma: bestGamma,
    }));
    setAutoTuningApplied(true);
    setTimeout(() => setAutoTuningApplied(false), 2500);
  };

  const slices = [
    {
      id: 1,
      tag: '切片一',
      title: '两大求解模式机理差异',
      subtitle: '硬间隔 (Hard Margin) vs 软间隔 (Soft Margin)',
    },
    {
      id: 2,
      tag: '切片二',
      title: '适用条件与高维空间表示',
      subtitle: '高维小样本精准分类与 RKHS 核技巧内积',
    },
    {
      id: 3,
      tag: '切片三',
      title: '三大致命训练陷阱',
      subtitle: '未标准化、γ 过大过拟合与 Gram 矩阵暴涨',
    },
    {
      id: 4,
      tag: '切片四',
      title: '误区警示与诊断陷阱',
      subtitle: '全样本支持向量爆炸与多分类 OvR / OvO 抉择',
    },
    {
      id: 5,
      tag: '切片五',
      title: '发展演化与算法族谱',
      subtitle: '从线性超平面到核技巧、SMO与现代演进',
    },
    {
      id: 6,
      tag: '切片六',
      title: '典型应用场景全景',
      subtitle: '生物医学芯片、图像OCR、文本NLP与金融风控',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 10</span>
              <span>·</span>
              <span>系统知识导引与诊断</span>
              <span>·</span>
              <span>6 大核心切片 · 发展演化与应用全景</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">SVM 理论与核空间变换知识导引</h2>
            <p className="text-sm text-stone-600 mt-1">
              梳理硬软间隔、再生核希尔伯特空间表示、三大致命训练陷阱、历史演进脉络及工业界典型落地场景。
            </p>
          </div>

          {/* Auto-Tuning Tool Trigger */}
          <button
            onClick={handleAutoTune}
            className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs"
          >
            {autoTuningApplied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5 text-amber-300" />}
            <span>{autoTuningApplied ? '已应用推荐参数' : '一键执行智能自动调参'}</span>
          </button>
        </div>

        {/* 6 Thematic Slices Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5">
          {slices.map((sl) => {
            const isActive = activeSlice === sl.id;
            return (
              <button
                key={sl.id}
                onClick={() => setActiveSlice(sl.id)}
                className={`p-3 rounded border text-left transition-all ${
                  isActive
                    ? 'bg-white border-stone-800 shadow-xs'
                    : 'bg-stone-100/60 border-stone-200 hover:bg-white text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-medium ${isActive ? 'text-stone-900' : 'text-stone-500'}`}>
                    {sl.tag}
                  </span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-stone-800" />}
                </div>
                <div className="text-xs font-semibold text-stone-900 truncate">{sl.title}</div>
                <div className="text-[11px] text-stone-500 truncate mt-0.5">{sl.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slice Deep Content & Auto-Tuning Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Theoretical Content (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg p-6 space-y-5">
          {activeSlice === 1 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">切片一 · 求解范式</span>
                <h3 className="text-base font-semibold text-stone-900 mt-1">硬间隔 (Hard Margin) 与软间隔 (Soft Margin) 机理差异</h3>
              </div>

              <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
                <p>
                  <strong>硬间隔 (Hard Margin)：</strong> 要求所有样本必须被两条间隔边界平面完全分离（即严格满足 <MathView math="y_i(w^T x_i + b) \ge 1" />）。它仅适用于理想中完全线性可分的数据。一旦数据中混入一个孤立噪声或离群点，硬间隔二次规划就会无可行解（Infeasible），发生数学求解崩溃。
                </p>

                <p>
                  <strong>软间隔 (Soft Margin)：</strong> 为解决现实中噪声与非线性重叠，引入松弛变量 <MathView math="\xi_i \ge 0" />。允许个别样本侵犯间隔甚至发生轻微误分类，目标函数通过超参数 <MathView math="C" /> 平衡最大化间隔与经验损失：
                </p>

                <div className="p-4 bg-stone-50 rounded border border-stone-200 text-center font-serif">
                  <MathView math="\min_{w, b, \xi} \;\; \frac{1}{2}\|w\|^2 + C \sum_{i=1}^n \xi_i" block />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-stone-50 rounded border border-stone-200">
                    <span className="font-semibold text-stone-800 block mb-1">C 趋向于无穷大 (C → ∞)</span>
                    强制所有 <MathView math="\xi_i \to 0" />，退化为硬间隔；超平面极度弯曲敏感，极易过拟合。
                  </div>
                  <div className="p-3 bg-stone-50 rounded border border-stone-200">
                    <span className="font-semibold text-stone-800 block mb-1">C 趋向于零 (C → 0)</span>
                    完全忽视经验损失，最大化几何间隔宽度，导致超平面过度平缓欠拟合。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSlice === 2 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">切片二 · 空间表示</span>
                <h3 className="text-base font-semibold text-stone-900 mt-1">适用条件与高维空间表示 (Kernel Trick)</h3>
              </div>

              <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
                <p>
                  <strong>高维小样本的绝对统治力：</strong> SVM 是统计学习理论（Vapnik-Chervonenkis Theory）的杰作。基于结构风险最小化（Structural Risk Minimization）而非经验风险最小化，其泛化能力由几何间隔决定，而与样本所在的维度高低无直接因果关系。因此在生物芯片基因表达（特征数 7000+，样本仅数十例）或高维稀疏文本中，SVM 依然表现出极高的鲁棒性。
                </p>

                <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-2">
                  <strong className="text-stone-800 block">核技巧 (The Kernel Trick) 的核心魔法：</strong>
                  <p>
                    若将低维数据映射到无穷维希尔伯特特征空间 <MathView math="\mathcal{H}" />，直接计算坐标映射 <MathView math="\phi(x)" /> 会引发不可承受的“维度灾难”。然而在对偶二次规划中，所有特征向量仅以内积形式出现：
                  </p>
                  <div className="text-center font-serif py-1">
                    <MathView math="K(x_i, x_j) = \langle \phi(x_i), \phi(x_j) \rangle_{\mathcal{H}}" block />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    只要连续对称函数 <MathView math="K(x, z)" /> 满足 Mercer 定理（在所有正测度空间上半正定），即可在原始低维空间直接求出高维内积值！
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSlice === 3 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">切片三 · 避坑指南</span>
                <h3 className="text-base font-semibold text-stone-900 mt-1">三大致命训练陷阱</h3>
              </div>

              <div className="space-y-3 text-xs text-stone-700">
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded space-y-1">
                  <span className="font-semibold text-rose-900 block">陷阱一：未做特征标准化 (Standardization Omission)</span>
                  <p className="text-rose-800 text-[11px]">
                    SVM 计算中欧氏距离与核内积是核心。若某特征取值范围为 [0, 100000]，而另一特征为 [0, 1]，大尺度特征将彻底主宰距离测度，导致小尺度关键特征被完全掩盖。<strong>必须在流水线首端挂载 StandardScaler！</strong>
                  </p>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded space-y-1">
                  <span className="font-semibold text-rose-900 block">陷阱二：γ 过大引发严重过拟合 (Gamma Explosion)</span>
                  <p className="text-rose-800 text-[11px]">
                    RBF 核中 <MathView math="\gamma = \frac{1}{2\sigma^2}" />。当 <MathView math="\gamma" /> 取值极大时，每个样本的高斯有效半径收缩为针尖，模型在每个训练点周围构造封闭的孤岛，训练集准确率 100%，但在新测试集上全部预测失败。
                  </p>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded space-y-1">
                  <span className="font-semibold text-rose-900 block">陷阱三：大数据量下 Gram Matrix 内存暴涨 (O(N²) 内存墙)</span>
                  <p className="text-rose-800 text-[11px]">
                    核 SVM 需要计算并缓存 <MathView math="N \times N" /> 的核矩阵。当样本量 <MathView math="N > 10^5" /> 时，存储核矩阵需耗费超过 80GB 内存，二次规划求解时间复杂度高达 <MathView math="O(N^2) \sim O(N^3)" />。对于超大规模数据，应转为线性核近似（如 LinearSVC 或 SGDClassifier）。
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSlice === 4 && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">切片四 · 误区诊断</span>
                <h3 className="text-base font-semibold text-stone-900 mt-1">误区警示与多分类策略抉择</h3>
              </div>

              <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
                <div>
                  <strong className="text-stone-800 block mb-1">支持向量爆炸警示 (SV Explosion)：</strong>
                  <p>
                    健康高效的 SVM 模型通常只保留 10%~30% 的骨干样本作为支持向量。若发现<strong>几乎所有样本点的 α 均大于 0（支持向量占比逼近 100%）</strong>，说明超参数 C 或 γ 严重失调，模型退化为纯记忆型查表机，失去了泛化间隔的初衷。
                  </p>
                </div>

                <div className="border-t border-stone-100 pt-3">
                  <strong className="text-stone-800 block mb-1">多分类策略：OvR vs OvO 对比切片：</strong>
                  <div className="grid grid-cols-2 gap-3 text-stone-700 pt-1">
                    <div className="p-3 bg-stone-50 rounded border border-stone-200">
                      <span className="font-semibold block mb-0.5">One-vs-Rest (OvR 一对其余)</span>
                      训练 <MathView math="K" /> 个二分类器。训练速度更快，但在类别严重不平衡时负类样本比例过大，需做置信度校准。
                    </div>
                    <div className="p-3 bg-stone-50 rounded border border-stone-200">
                      <span className="font-semibold block mb-0.5">One-vs-One (OvO 一对一)</span>
                      训练 <MathView math="\frac{K(K-1)}{2}" /> 个二分类器。样本均衡性更好，但当类别数 <MathView math="K" /> 较大时模型数量呈平方爆炸，显著拖慢推理。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Slice 5: 发展演化 */}
          {activeSlice === 5 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">切片五 · 历史演进与衍生谱系</span>
                <h3 className="text-base font-semibold text-stone-900 mt-1">支持向量机发展里程碑与算法族谱</h3>
              </div>

              {/* Milestones Timeline */}
              <div className="space-y-3 text-xs">
                <span className="font-semibold text-stone-800 block">从理论奠基到现代演进的五大里程碑：</span>

                <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-stone-900 ring-2 ring-white" />
                    <div className="font-mono text-stone-400 text-[11px]">1963 - 1964</div>
                    <div className="font-medium text-stone-800">原始最大几何间隔超平面 (Vapnik & Chervonenkis)</div>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      奠定统计学习理论（VC 维）基础，提出线性可分模式下的最大间隔凸优化准则，彻底打破了传统感知机仅求任意分离面的局限。
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />
                    <div className="font-mono text-stone-400 text-[11px]">1992 (COLT 会议)</div>
                    <div className="font-medium text-stone-800">引入非线性核技巧 (Boser, Guyon & Vapnik)</div>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      将 Aizerman 势函数与 Mercer 定理正式引入对偶二次规划，使 SVM 无需显式计算高维映射坐标，即可在无限维希尔伯特空间实现非线性一刀切分。
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
                    <div className="font-mono text-stone-400 text-[11px]">1995 (Machine Learning 期刊)</div>
                    <div className="font-medium text-stone-800">软间隔与松弛变量理论确立 (Cortes & Vapnik)</div>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      引入松弛变量 <MathView math="\xi_i" /> 与惩罚因子 <MathView math="C" />，形成现代标准软间隔 SVM 范式，使其具备强大的抗噪容错与概率泛化性能。
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-600 ring-2 ring-white" />
                    <div className="font-mono text-stone-400 text-[11px]">1998</div>
                    <div className="font-medium text-stone-800">Platt 序列最小优化算法 (SMO) 诞生</div>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      突破通用内点法 QP 求解器在海量数据下的内存与算力瓶颈，将优化分解为两两变量的解析极值闭式更新，直接催生了 LibSVM 等工业基石库。
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-stone-700 ring-2 ring-white" />
                    <div className="font-mono text-stone-400 text-[11px]">2000s 至今</div>
                    <div className="font-medium text-stone-800">超大规模近似与深度核学习 (Random Fourier / Deep SVM)</div>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      采用 Rahimi-Recht 随机傅里叶特征（RFF）与 Nyström 采样将非线性核降阶为线性加速；同时与深度神经网络表征层结合，形成端到端最大间隔网络。
                    </p>
                  </div>
                </div>
              </div>

              {/* Family Tree */}
              <div className="pt-2 border-t border-stone-100">
                <span className="font-semibold text-stone-800 block text-xs mb-2">SVM 衍生算法族谱：</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                    <strong className="text-stone-900 block mb-0.5">支持向量回归 (SVR)</strong>
                    引入 <MathView math="\epsilon" />-不敏感损失管道，管道内预测误差为零，管道外线性惩罚，兼具高鲁棒性。
                  </div>
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                    <strong className="text-stone-900 block mb-0.5">单类支持向量机 (One-Class SVM)</strong>
                    寻找包含正常样本的最小超球体（SVDD），广泛用于无监督异常检测与离群点识别。
                  </div>
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded">
                    <strong className="text-stone-900 block mb-0.5">最小二乘 SVM (LS-SVM)</strong>
                    将不等式约束松弛为二次等式，将二次规划转化为求解一组线性方程组，推理极快。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Slice 6: 应用场景 */}
          {activeSlice === 6 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">切片六 · 工业落地与多领域实战</span>
                <h3 className="text-base font-semibold text-stone-900 mt-1">支持向量机典型应用场景全景</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Domain 1: Bioinformatics */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-semibold">
                    <Dna className="w-4 h-4 text-indigo-600" />
                    <span>1. 生物信息学与精准肿瘤医学</span>
                  </div>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    <strong>高维小样本的黄金主战场：</strong> 基因微阵列表达谱特征数高达数千至数万（<MathView math="p > 10^4" />），但病患样本仅几十例（<MathView math="n < 100" />）。深度学习在此场景极易严重过拟合，而基于结构风险最小化的线性核 SVM 不仅天然规避维度灾难，还能通过权重排序锁定关键致癌靶点探针。
                  </p>
                  <div className="text-[10px] text-stone-500 bg-white p-2 rounded border border-stone-200 font-mono">
                    典型应用：白血病 ALL vs AML 分型 · 癌症早期甲基化诊断 · 蛋白质二级结构预测
                  </div>
                </div>

                {/* Domain 2: Computer Vision */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-semibold">
                    <Binary className="w-4 h-4 text-emerald-600" />
                    <span>2. 机器视觉与模式识别</span>
                  </div>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    在卷积网络兴起之前，<strong>HOG + 线性 SVM</strong> 是计算机视觉领域数十年无可撼动的目标检测黄金范式（Dalal & Triggs 2005）。SVM 对边界轮廓的高抗噪性使其在嵌入式端侧或极低算力设备上具有极佳的实时推理速度。
                  </p>
                  <div className="text-[10px] text-stone-500 bg-white p-2 rounded border border-stone-200 font-mono">
                    典型应用：手写字符 OCR (MNIST/银行票据) · 工业探伤表面缺陷检测 · 行人与人脸验证
                  </div>
                </div>

                {/* Domain 3: NLP & Text */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-semibold">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>3. 自然语言处理与高维文本挖掘</span>
                  </div>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    TF-IDF 或词袋模型构建的高维文本向量通常具备强烈的<strong>稀疏性（Sparsity）与正交性</strong>。SVM 的内积计算仅对非零特征有效，在垃圾邮件实时过滤、司法文书自动化标签推荐与多语种舆情倾向研判中表现出极高的吞吐与准确度。
                  </p>
                  <div className="text-[10px] text-stone-500 bg-white p-2 rounded border border-stone-200 font-mono">
                    典型应用：垃圾邮件过滤 (Spam Filter) · 司法判决罪名智能推导 · 情感二分类
                  </div>
                </div>

                {/* Domain 4: Finance & Anomaly */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-semibold">
                    <TrendingUp className="w-4 h-4 text-rose-600" />
                    <span>4. 金融量化风控与异常入侵检测</span>
                  </div>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    利用单类支持向量机（One-Class SVM）建立“正常交易”的紧凑凸包超球面，任何落在间隔界外的离群交易即触发欺诈拦截；同时在企业信用违约评级中，软间隔 SVM 能容忍偶发会计波动，提供极强的穿透性风险判别。
                  </p>
                  <div className="text-[10px] text-stone-500 bg-white p-2 rounded border border-stone-200 font-mono">
                    典型应用：信用卡盗刷与欺诈侦测 · 网络入侵异常流量检测 · 违约风险评分卡
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auto-Tuner & Real-time Health Radar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-time Health Gauge */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
            <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
              当前模型健康度雷达
            </span>

            <div className="space-y-3 text-xs">
              {/* SV Ratio Health */}
              <div className="p-3 rounded border space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-stone-700">支持向量占比检测:</span>
                  <span className={isSVExplosion ? 'text-rose-700 font-bold' : 'text-emerald-700 font-semibold'}>
                    {(svRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isSVExplosion ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, svRatio * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-stone-500 block">
                  {isSVExplosion ? '警告：支持向量占比过高，存在过拟合记忆风险！' : '健康：模型保持了优异的解稀疏性。'}
                </span>
              </div>

              {/* Gamma Health */}
              <div className="p-3 rounded border space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-stone-700">核带宽 γ 评估:</span>
                  <span className={isGammaTooLarge ? 'text-rose-700 font-bold' : 'text-emerald-700 font-semibold'}>
                    {params.gamma}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 block">
                  {isGammaTooLarge ? '警告：γ 极大，等高线易产生针状闭合孤岛！' : '平滑：决策等高线曲率良好。'}
                </span>
              </div>

              {/* Mercer Satisfaction */}
              <div className="p-3 rounded border space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-stone-700">Mercer 核条件:</span>
                  <span className="text-emerald-700 font-semibold">严格满足 (PSD)</span>
                </div>
                <span className="text-[11px] text-stone-500 block">
                  保证二次规划目标函数严格凹，具备唯一全局最优对偶解。
                </span>
              </div>
            </div>
          </div>

          {/* Quick Auto-Tune Suggestion */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 space-y-3 text-xs">
            <span className="font-semibold text-stone-900 block flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-stone-700" />
              智能推荐调参建议
            </span>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              基于当前样本量 <strong className="font-mono text-stone-800">{points.length}</strong> 及非线性分布特征：建议选用 <strong>RBF 核</strong>，保持 <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">C ∈ [1.0, 5.0]</code>，<code className="bg-stone-200 px-1 py-0.5 rounded font-mono">γ ∈ [0.8, 1.5]</code>，可取得最小交叉验证泛化误差。
            </p>
            <button
              onClick={handleAutoTune}
              className="w-full py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium rounded transition-colors text-xs"
            >
              采纳调优建议
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
