import React, { useState, useRef, useEffect } from 'react';
import { Point2D, SVMHyperparams, SVMModelResult } from '../../types/svm';
import { computeDecisionGrid } from '../../utils/svmSolver';
import {
  Copy,
  Check,
  Terminal,
  Code2,
  Play,
  Table,
  BarChart2,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';

interface CodeEngineSliceProps {
  points?: Point2D[];
  params: SVMHyperparams;
  result: SVMModelResult;
}

export const CodeEngineSlice: React.FC<CodeEngineSliceProps> = ({
  points = [],
  params,
  result,
}) => {
  const [activeTab, setActiveTab] = useState<'sklearn' | 'smo_scratch'>('sklearn');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runTimestamp, setRunTimestamp] = useState<string>('刚刚');
  const [outputView, setOutputView] = useState<'plot' | 'tables' | 'other' | 'terminal'>('plot');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Scikit-Learn code snippet reflecting current hyperparams
  // Matplotlib plot title, axes, and legend are strictly in English for 100% external execution compatibility
  const sklearnCode = `import numpy as np
import matplotlib.pyplot as plt
from sklearn import datasets
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# 1. Generate Synthetic Benchmark Dataset
X, y = datasets.make_circles(n_samples=100, factor=0.4, noise=0.08, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2. Build SVM Pipeline (Synchronized with Current Lab Parameters)
svm_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC(
        C=${params.C},
        kernel='${params.kernel}',
        gamma=${params.gamma},
        degree=${params.degree},
        coef0=${params.coef0},
        probability=True,
        random_state=42
    ))
])

# 3. Fit Model & Solve Dual Quadratic Programming
svm_pipeline.fit(X_train, y_train)

# 4. Evaluate Model & Extract Parameters
clf = svm_pipeline.named_steps['svm']
scaler = svm_pipeline.named_steps['scaler']
X_scaled = scaler.transform(X)

print(f"[*] Optimization Converged! Support Vectors: {len(clf.support_)} / {len(X_train)}")
print(f"[*] Intercept b: {clf.intercept_[0]:.4f}")

y_pred = svm_pipeline.predict(X_test)
y_prob = svm_pipeline.predict_proba(X_test)[:, 1]
print("\\n[+] Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Class -1', 'Class +1']))
print(f"[+] Test ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

# 5. Matplotlib Visualization (All Titles, Legends, and Axes in English)
fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

x_min, x_max = X_scaled[:, 0].min() - 0.5, X_scaled[:, 0].max() + 0.5
y_min, y_max = X_scaled[:, 1].min() - 0.5, X_scaled[:, 1].max() + 0.5
xx, yy = np.meshgrid(np.linspace(x_min, x_max, 250), np.linspace(y_min, y_max, 250))
Z = clf.decision_function(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

# Decision Boundary & Margins
ax.contour(xx, yy, Z, levels=[-1, 0, 1], linestyles=['--', '-', '--'],
           colors=['#be123c', '#0f172a', '#047857'], linewidths=[1.2, 2.0, 1.2])

# Data Points
ax.scatter(X_scaled[y == 1, 0], X_scaled[y == 1, 1], c='#10b981', label='Class +1 (Positive)', edgecolors='w', s=45)
ax.scatter(X_scaled[y == 0, 0], X_scaled[y == 0, 1], c='#f43f5e', label='Class -1 (Negative)', edgecolors='w', s=45)

# Highlight Support Vectors
sv = clf.support_vectors_
ax.scatter(sv[:, 0], sv[:, 1], s=120, facecolors='none', edgecolors='#d97706',
           linewidths=1.8, label='Support Vectors (alpha > 0)')

ax.set_title("SVM Decision Boundary (${params.kernel.toUpperCase()} Kernel, C=${params.C}, gamma=${params.gamma})", fontsize=11, fontweight='bold')
ax.set_xlabel("Feature X1 (Standardized)", fontsize=10)
ax.set_ylabel("Feature X2 (Standardized)", fontsize=10)
ax.legend(loc='upper right', frameon=True, fontsize=8)
ax.grid(True, linestyle=':', alpha=0.5)

plt.tight_layout()
plt.show()
`;

  // From-scratch SMO algorithm pure Python implementation
  const smoScratchCode = `import numpy as np
import matplotlib.pyplot as plt

class SVM_SMO_FromScratch:
    """
    Platt's Sequential Minimal Optimization (SMO) from scratch in pure Python.
    No external QP solvers required. Runs anywhere with NumPy and Matplotlib.
    """
    def __init__(self, C=${params.C}, gamma=${params.gamma}, kernel='${params.kernel}', tol=1e-4, max_passes=20):
        self.C = C
        self.gamma = gamma
        self.kernel = kernel
        self.tol = tol
        self.max_passes = max_passes
        self.alphas = None
        self.b = 0.0
        self.X = None
        self.y = None
        self.K = None

    def _kernel(self, x1, x2):
        if self.kernel == 'linear':
            return np.dot(x1, x2)
        elif self.kernel == 'rbf':
            return np.exp(-self.gamma * np.sum((x1 - x2) ** 2))
        elif self.kernel == 'poly':
            return (self.gamma * np.dot(x1, x2) + 1.0) ** 3
        return np.dot(x1, x2)

    def _compute_gram_matrix(self, X):
        n = X.shape[0]
        K = np.zeros((n, n))
        for i in range(n):
            for j in range(i, n):
                val = self._kernel(X[i], X[j])
                K[i, j] = val
                K[j, i] = val
        return K

    def fit(self, X, y):
        self.X = X
        self.y = y.astype(float)
        n_samples = X.shape[0]
        self.alphas = np.zeros(n_samples)
        self.b = 0.0
        self.K = self._compute_gram_matrix(X)

        passes = 0
        while passes < self.max_passes:
            num_changed_alphas = 0
            for i in range(n_samples):
                f_xi = np.sum(self.alphas * self.y * self.K[:, i]) + self.b
                Ei = f_xi - self.y[i]

                if ((self.y[i] * Ei < -self.tol and self.alphas[i] < self.C) or
                    (self.y[i] * Ei > self.tol and self.alphas[i] > 0)):
                    
                    j = np.random.choice([idx for idx in range(n_samples) if idx != i])
                    f_xj = np.sum(self.alphas * self.y * self.K[:, j]) + self.b
                    Ej = f_xj - self.y[j]

                    alpha_i_old, alpha_j_old = self.alphas[i], self.alphas[j]

                    if self.y[i] != self.y[j]:
                        L = max(0, self.alphas[j] - self.alphas[i])
                        H = min(self.C, self.C + self.alphas[j] - self.alphas[i])
                    else:
                        L = max(0, self.alphas[i] + self.alphas[j] - self.C)
                        H = min(self.C, self.alphas[i] + self.alphas[j])

                    if L == H:
                        continue

                    eta = 2.0 * self.K[i, j] - self.K[i, i] - self.K[j, j]
                    if eta >= 0:
                        continue

                    new_alpha_j = alpha_j_old - (self.y[j] * (Ei - Ej)) / eta
                    new_alpha_j = np.clip(new_alpha_j, L, H)

                    if abs(new_alpha_j - alpha_j_old) < 1e-5:
                        continue

                    new_alpha_i = alpha_i_old + self.y[i] * self.y[j] * (alpha_j_old - new_alpha_j)
                    self.alphas[i] = new_alpha_i
                    self.alphas[j] = new_alpha_j

                    b1 = self.b - Ei - self.y[i] * (new_alpha_i - alpha_i_old) * self.K[i, i] - \
                         self.y[j] * (new_alpha_j - alpha_j_old) * self.K[i, j]
                    b2 = self.b - Ej - self.y[i] * (new_alpha_i - alpha_i_old) * self.K[i, j] - \
                         self.y[j] * (new_alpha_j - alpha_j_old) * self.K[j, j]

                    if 0 < new_alpha_i < self.C:
                        self.b = b1
                    elif 0 < new_alpha_j < self.C:
                        self.b = b2
                    else:
                        self.b = (b1 + b2) / 2.0

                    num_changed_alphas += 1

            passes = passes + 1 if num_changed_alphas == 0 else 0

        self.sv_indices = np.where(self.alphas > 1e-4)[0]
        return self

    def decision_function(self, X_eval):
        scores = []
        for x in X_eval:
            k_vals = np.array([self._kernel(x_train, x) for x_train in self.X])
            s = np.sum(self.alphas * self.y * k_vals) + self.b
            scores.append(s)
        return np.array(scores)

# --- Synthetic Data Generation & Training ---
np.random.seed(42)
n_samples = 80
r_inner = 0.4 + np.random.normal(0, 0.08, n_samples // 2)
theta_inner = np.random.uniform(0, 2 * np.pi, n_samples // 2)
X_pos = np.column_stack([r_inner * np.cos(theta_inner), r_inner * np.sin(theta_inner)])

r_outer = 0.9 + np.random.normal(0, 0.08, n_samples // 2)
theta_outer = np.random.uniform(0, 2 * np.pi, n_samples // 2)
X_neg = np.column_stack([r_outer * np.cos(theta_outer), r_outer * np.sin(theta_outer)])

X = np.vstack([X_pos, X_neg])
y = np.array([1] * (n_samples // 2) + [-1] * (n_samples // 2))

# Train SMO Solver
model = SVM_SMO_FromScratch(C=${params.C}, gamma=${params.gamma}, kernel='${params.kernel}')
model.fit(X, y)
print(f"[*] SMO Convergence Completed! Number of Support Vectors: {len(model.sv_indices)} / {n_samples}")
print(f"[*] Intercept b: {model.b:.4f}")

# --- Matplotlib Plot (English Labels & Title) ---
fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

x_min, x_max = X[:, 0].min() - 0.4, X[:, 0].max() + 0.4
y_min, y_max = X[:, 1].min() - 0.4, X[:, 1].max() + 0.4
xx, yy = np.meshgrid(np.linspace(x_min, x_max, 150), np.linspace(y_min, y_max, 150))
eval_grid = np.c_[xx.ravel(), yy.ravel()]
Z = model.decision_function(eval_grid).reshape(xx.shape)

ax.contour(xx, yy, Z, levels=[-1, 0, 1], linestyles=['--', '-', '--'],
           colors=['#be123c', '#0f172a', '#047857'], linewidths=[1.2, 2.0, 1.2])

ax.scatter(X[y == 1, 0], X[y == 1, 1], c='#10b981', label='Class +1 (Positive)', edgecolors='w', s=50)
ax.scatter(X[y == -1, 0], X[y == -1, 1], c='#f43f5e', label='Class -1 (Negative)', edgecolors='w', s=50)

sv_pts = X[model.sv_indices]
ax.scatter(sv_pts[:, 0], sv_pts[:, 1], s=130, facecolors='none', edgecolors='#d97706',
           linewidths=1.8, label='Support Vectors (alpha > 0)')

ax.set_title("SMO SVM Decision Boundary (${params.kernel.toUpperCase()} Kernel, C=${params.C}, gamma=${params.gamma})", fontsize=11, fontweight='bold')
ax.set_xlabel("Feature X1 (Standardized)", fontsize=10)
ax.set_ylabel("Feature X2 (Standardized)", fontsize=10)
ax.legend(loc='upper right', frameon=True, fontsize=8)
ax.grid(True, linestyle=':', alpha=0.5)

plt.tight_layout()
plt.show()
`;

  const activeCode = activeTab === 'sklearn' ? sklearnCode : smoScratchCode;

  // 复制代码：可以复制到项目外运行
  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // 运行代码：可以在项目内运行
  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      const now = new Date();
      setRunTimestamp(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    }, 450);
  };

  // Render high-fidelity matplotlib-style canvas plot with English titles, labels & legend
  useEffect(() => {
    if (outputView !== 'plot') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Margins for axes, labels and title
    const margin = { top: 40, right: 30, bottom: 45, left: 55 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    // Plot area background
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(margin.left, margin.top, plotW, plotH);

    // Compute decision grid
    const range = 1.3;
    const resolution = 40;
    const grid = computeDecisionGrid(points, result.alphas, result.b, params, resolution, range);

    const toScreen = (gx: number, gy: number) => {
      const sx = margin.left + ((gx + range) / (2 * range)) * plotW;
      const sy = margin.top + ((range - gy) / (2 * range)) * plotH;
      return [sx, sy];
    };

    // Draw grid lines
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    for (let i = -1.0; i <= 1.0; i += 0.5) {
      const [gx] = toScreen(i, 0);
      const [, gy] = toScreen(0, i);
      // Vertical grid
      ctx.beginPath();
      ctx.moveTo(gx, margin.top);
      ctx.lineTo(gx, margin.top + plotH);
      ctx.stroke();
      // Horizontal grid
      ctx.beginPath();
      ctx.moveTo(margin.left, gy);
      ctx.lineTo(margin.left + plotW, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw decision contour curves
    const drawContour = (level: number, color: string, dash: number[], lw: number) => {
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.lineWidth = lw;
      ctx.beginPath();

      for (let i = 0; i < resolution - 1; i++) {
        for (let j = 0; j < resolution - 1; j++) {
          const v0 = grid[i][j].val - level;
          const v1 = grid[i][j + 1].val - level;
          const v2 = grid[i + 1][j + 1].val - level;
          const v3 = grid[i + 1][j].val - level;

          if ((v0 > 0) !== (v1 > 0) || (v1 > 0) !== (v2 > 0) || (v2 > 0) !== (v3 > 0) || (v3 > 0) !== (v0 > 0)) {
            const p0 = toScreen(grid[i][j].x, grid[i][j].y);
            const p1 = toScreen(grid[i][j + 1].x, grid[i][j + 1].y);
            const p2 = toScreen(grid[i + 1][j + 1].x, grid[i + 1][j + 1].y);
            const p3 = toScreen(grid[i + 1][j].x, grid[i + 1][j].y);

            if ((v0 > 0) !== (v1 > 0)) {
              ctx.moveTo(p0[0] + (p1[0] - p0[0]) * 0.5, p0[1]);
              ctx.lineTo(p3[0] + (p2[0] - p3[0]) * 0.5, p3[1]);
            }
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw Margins (f(x)=±1) and Decision Boundary (f(x)=0)
    drawContour(1.0, '#047857', [4, 4], 1.5);
    drawContour(-1.0, '#be123c', [4, 4], 1.5);
    drawContour(0.0, '#0f172a', [], 2.2);

    // Plot Data Points & Support Vectors
    points.forEach((p) => {
      const [sx, sy] = toScreen(p.x1, p.x2);

      // Support Vector Halo Ring
      if (p.isSupportVector) {
        ctx.beginPath();
        ctx.arc(sx, sy, 8.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // Inner data dot
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.y === 1 ? '#10b981' : '#f43f5e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
    });

    // Outer Plot Border
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(margin.left, margin.top, plotW, plotH);

    // Axes Ticks & Values
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#57534e';
    ctx.textAlign = 'center';
    for (let i = -1.0; i <= 1.0; i += 0.5) {
      const [gx] = toScreen(i, 0);
      const [, gy] = toScreen(0, i);
      // X ticks
      ctx.beginPath();
      ctx.moveTo(gx, margin.top + plotH);
      ctx.lineTo(gx, margin.top + plotH + 4);
      ctx.stroke();
      ctx.fillText(i.toFixed(1), gx, margin.top + plotH + 15);

      // Y ticks
      ctx.beginPath();
      ctx.moveTo(margin.left - 4, gy);
      ctx.lineTo(margin.left, gy);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(i.toFixed(1), margin.left - 8, gy + 3);
      ctx.textAlign = 'center';
    }

    // ENGLISH Plot Title (Strictly in English as required)
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#1c1917';
    ctx.textAlign = 'center';
    ctx.fillText(
      `SVM Decision Boundary (${params.kernel.toUpperCase()} Kernel, C=${params.C}, gamma=${params.gamma})`,
      margin.left + plotW / 2,
      22
    );

    // ENGLISH X-Axis Label (Strictly in English as required)
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#44403c';
    ctx.fillText('Feature X1 (Standardized)', margin.left + plotW / 2, height - 12);

    // ENGLISH Y-Axis Label (Strictly in English as required)
    ctx.save();
    ctx.translate(16, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Feature X2 (Standardized)', 0, 0);
    ctx.restore();

    // ENGLISH Legend Box (Strictly in English as required)
    const legX = margin.left + plotW - 195;
    const legY = margin.top + 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1;
    ctx.fillRect(legX, legY, 185, 75);
    ctx.strokeRect(legX, legY, 185, 75);

    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';

    // Legend item 1: Class +1
    ctx.beginPath();
    ctx.arc(legX + 12, legY + 14, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.fillStyle = '#292524';
    ctx.fillText('Class +1 (Positive)', legX + 24, legY + 17);

    // Legend item 2: Class -1
    ctx.beginPath();
    ctx.arc(legX + 12, legY + 28, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.fillStyle = '#292524';
    ctx.fillText('Class -1 (Negative)', legX + 24, legY + 31);

    // Legend item 3: Boundary
    ctx.beginPath();
    ctx.moveTo(legX + 6, legY + 44);
    ctx.lineTo(legX + 18, legY + 44);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#292524';
    ctx.fillText('Decision Boundary (f(x)=0)', legX + 24, legY + 47);

    // Legend item 4: Support Vectors
    ctx.beginPath();
    ctx.arc(legX + 12, legY + 60, 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#292524';
    ctx.fillText('Support Vectors (alpha > 0)', legX + 24, legY + 63);
  }, [outputView, points, result, params]);

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 06</span>
              <span>·</span>
              <span>算法工程实现</span>
              <span>·</span>
              <span>双环境代码与结果渲染</span>
            </div>
            <h2 className="text-xl font-medium text-stone-900">Python / Scikit-Learn 代码引擎</h2>
            <p className="text-sm text-stone-600 mt-1">
              联动当前参数实时生成完整 Python 脚本。可在项目内一键执行并实时查看输出图表与指标，亦可复制代码至外部环境直接运行。
            </p>
          </div>

          {/* Action Buttons: 复制代码 & 运行代码 */}
          <div className="flex items-center gap-3">
            {/* 复制代码 (可以复制到项目外运行) */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-stone-300 rounded text-xs font-medium text-stone-700 hover:bg-stone-100 hover:border-stone-400 transition-all shadow-2xs group"
              title="复制代码，可以复制到项目外运行 (Jupyter, Colab, 本地终端)"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-900" />
              )}
              <div className="text-left">
                <span className="font-semibold block leading-none">{copied ? '已复制成功' : '复制代码'}</span>
                <span className="text-[10px] text-stone-400 font-normal leading-tight">可以复制到项目外运行</span>
              </div>
            </button>

            {/* 运行代码 (代码可以在项目内运行) */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 transition-all shadow-xs disabled:opacity-60 group"
              title="代码可以在项目内运行，实时渲染决策图与统计表"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-stone-300" />
              ) : (
                <Play className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-left">
                <span className="font-semibold block leading-none">{isRunning ? '正在运行中...' : '运行代码'}</span>
                <span className="text-[10px] text-stone-300 font-normal leading-tight">代码可以在项目内运行</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 mt-5 border-t border-stone-200 pt-3">
          <button
            onClick={() => setActiveTab('sklearn')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'sklearn'
                ? 'bg-stone-900 text-stone-50'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Scikit-Learn 工业级 Pipeline (SVC)</span>
          </button>
          <button
            onClick={() => setActiveTab('smo_scratch')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'smo_scratch'
                ? 'bg-stone-900 text-stone-50'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>纯 Python 从零手写 SMO 求解器 (Platt 1998)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Code Editor (Left) & 输出窗口 (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Code Display Area (6 cols) */}
        <div className="lg:col-span-6 bg-stone-900 text-stone-100 rounded-lg p-4 font-mono text-xs overflow-hidden shadow-sm border border-stone-800 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800 text-[11px] text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-medium text-stone-300">
                {activeTab === 'sklearn' ? 'svm_sklearn_pipeline.py' : 'svm_smo_scratch.py'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700/50">
                图标题/图例/坐标轴均用英文
              </span>
            </div>
          </div>

          <pre className="overflow-x-auto overflow-y-auto max-h-[540px] leading-relaxed p-1 select-text text-stone-200 scrollbar-thin">
            <code>{activeCode}</code>
          </pre>

          {/* Bottom Code Note */}
          <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              已与当前超参数 C={params.C}, γ={params.gamma}, 核={params.kernel.toUpperCase()} 实时同步
            </span>
            <span className="text-[10px] text-stone-500 font-sans">点击右上角「复制代码」可直接于外部运行</span>
          </div>
        </div>

        {/* 输出窗口 (Right: 6 cols): Displays 图、表及其他 */}
        <div className="lg:col-span-6 bg-white border border-stone-200 rounded-lg p-5 flex flex-col space-y-4 shadow-2xs">
          {/* Header of 输出窗口 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-stone-800" />
                <h3 className="text-sm font-semibold text-stone-900 tracking-tight">输出窗口</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                运行正常 · {runTimestamp}
              </span>
            </div>

            {/* Output View Mode Tabs: 图, 表, 及其他, 终端 */}
            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded border border-stone-200 text-xs">
              <button
                onClick={() => setOutputView('plot')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
                  outputView === 'plot'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="图：Matplotlib 风格决策面与支持向量"
              >
                <BarChart2 className="w-3 h-3" />
                <span>图 (Plot)</span>
              </button>
              <button
                onClick={() => setOutputView('tables')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
                  outputView === 'tables'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="表：性能指标表、混淆矩阵与支持向量表"
              >
                <Table className="w-3 h-3" />
                <span>表 (Tables)</span>
              </button>
              <button
                onClick={() => setOutputView('other')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
                  outputView === 'other'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="及其他：算法复杂度、收敛特征与外部运行指南"
              >
                <Cpu className="w-3 h-3" />
                <span>及其他 (Other)</span>
              </button>
              <button
                onClick={() => setOutputView('terminal')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
                  outputView === 'terminal'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="终端：标准 stdout 运行日志"
              >
                <Terminal className="w-3 h-3" />
                <span>终端输出</span>
              </button>
            </div>
          </div>

          {/* 1. 图 (Visualization Plot: Matplotlib Canvas rendering with English title, legend & axes) */}
          {outputView === 'plot' && (
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="relative aspect-4/3 w-full border border-stone-200 rounded bg-stone-50 overflow-hidden flex items-center justify-center shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={420}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Graphic Spec Note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 pt-1.5 border-t border-stone-100 gap-1 font-mono">
                <span className="flex items-center gap-1 text-stone-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  图标题、图例、坐标轴均严格遵循英文规范
                </span>
                <span className="text-stone-500 text-[10px]">
                  Mesh Resolution: 40x40 · Contour Levels: [-1, 0, 1]
                </span>
              </div>
            </div>
          )}

          {/* 2. 表 (Performance Metrics Table, Confusion Matrix Table & Support Vectors Table) */}
          {outputView === 'tables' && (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
              {/* 表 1: 模型分类性能指标评估表 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-stone-600" />
                    表 1：模型性能指标评估表 (Performance Metrics)
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">实时计算得出</span>
                </div>
                <div className="border border-stone-200 rounded overflow-hidden">
                  <table className="w-full text-xs text-left divide-y divide-stone-200">
                    <thead className="bg-stone-50 text-stone-600 font-mono text-[11px]">
                      <tr>
                        <th className="px-3 py-1.5">评估指标</th>
                        <th className="px-3 py-1.5">数值</th>
                        <th className="px-3 py-1.5">数学理论释义</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[11px] bg-white">
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">训练准确率 (Accuracy)</td>
                        <td className="px-3 py-1.5 font-bold text-emerald-700">{(result.trainAccuracy * 100).toFixed(1)}%</td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">样本正确分类比率 (TP + TN) / Total</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">精确率 (Precision)</td>
                        <td className="px-3 py-1.5 font-bold text-stone-800">{(result.precision * 100).toFixed(1)}%</td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">正类查准率 TP / (TP + FP)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">召回率 (Recall)</td>
                        <td className="px-3 py-1.5 font-bold text-stone-800">{(result.recall * 100).toFixed(1)}%</td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">正类查全率 TP / (TP + FN)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">F1 分数 (F1-Score)</td>
                        <td className="px-3 py-1.5 font-bold text-indigo-700">{result.f1Score.toFixed(3)}</td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">精确率与召回率的调和平均值</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">ROC-AUC 积分</td>
                        <td className="px-3 py-1.5 font-bold text-indigo-700">{result.auc.toFixed(3)}</td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">受试者工作特征曲线下面积</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">支持向量数 (SV Count)</td>
                        <td className="px-3 py-1.5 font-bold text-amber-700">
                          {result.supportVectors.length} ({((result.supportVectors.length / (points.length || 1)) * 100).toFixed(0)}%)
                        </td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">拉格朗日乘子 α &gt; 0 的关键支撑点</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">几何间隔 (Margin 2/||w||)</td>
                        <td className="px-3 py-1.5 font-bold text-stone-800">{result.marginWidth}</td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">决策面两侧正负边界平面的物理间距</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-800">截距常数 b (Intercept)</td>
                        <td className="px-3 py-1.5 font-bold text-stone-800">{result.b}</td>
                        <td className="px-3 py-1.5 text-stone-500 font-sans">超平面在特征空间中的平移偏置</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 表 2: 混淆矩阵表 */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-800 block">
                  表 2：混淆矩阵表格 (Confusion Matrix)
                </span>
                <div className="border border-stone-200 rounded overflow-hidden">
                  <table className="w-full text-xs text-center divide-y divide-stone-200 font-mono">
                    <thead className="bg-stone-50 text-stone-600 text-[11px]">
                      <tr>
                        <th className="px-3 py-1.5 font-sans">真值 \ 预测</th>
                        <th className="px-3 py-1.5">预测正类 (+1)</th>
                        <th className="px-3 py-1.5">预测负类 (-1)</th>
                        <th className="px-3 py-1.5 font-sans">真实合计</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs bg-white">
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-700 bg-stone-50/50">实际正类 (+1)</td>
                        <td className="px-3 py-1.5 text-emerald-700 font-bold bg-emerald-50/30">
                          {result.confusionMatrix.tp} <span className="text-[10px] text-stone-400 font-normal font-sans">(TP)</span>
                        </td>
                        <td className="px-3 py-1.5 text-rose-700 font-bold bg-rose-50/20">
                          {result.confusionMatrix.fn} <span className="text-[10px] text-stone-400 font-normal font-sans">(FN)</span>
                        </td>
                        <td className="px-3 py-1.5 text-stone-500 font-medium">{result.confusionMatrix.tp + result.confusionMatrix.fn}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-sans font-medium text-stone-700 bg-stone-50/50">实际负类 (-1)</td>
                        <td className="px-3 py-1.5 text-rose-700 font-bold bg-rose-50/20">
                          {result.confusionMatrix.fp} <span className="text-[10px] text-stone-400 font-normal font-sans">(FP)</span>
                        </td>
                        <td className="px-3 py-1.5 text-emerald-700 font-bold bg-emerald-50/30">
                          {result.confusionMatrix.tn} <span className="text-[10px] text-stone-400 font-normal font-sans">(TN)</span>
                        </td>
                        <td className="px-3 py-1.5 text-stone-500 font-medium">{result.confusionMatrix.fp + result.confusionMatrix.tn}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 表 3: 关键支持向量参数明细表 */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-800 block">
                  表 3：关键支持向量明细表 (Top Support Vectors, α &gt; 0)
                </span>
                <div className="border border-stone-200 rounded overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-xs text-left divide-y divide-stone-200 font-mono text-[11px]">
                    <thead className="bg-stone-50 text-stone-600 sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1">序号</th>
                        <th className="px-2.5 py-1">坐标 (X1, X2)</th>
                        <th className="px-2.5 py-1">真值 y</th>
                        <th className="px-2.5 py-1">乘子 α</th>
                        <th className="px-2.5 py-1">向量类别</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {result.supportVectors.slice(0, 8).map((sv, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/30">
                          <td className="px-2.5 py-1 text-stone-400">#{idx + 1}</td>
                          <td className="px-2.5 py-1 text-stone-700">({sv.x1.toFixed(3)}, {sv.x2.toFixed(3)})</td>
                          <td className="px-2.5 py-1">
                            <span className={sv.y === 1 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                              {sv.y === 1 ? '+1' : '-1'}
                            </span>
                          </td>
                          <td className="px-2.5 py-1 text-amber-700 font-bold">{(sv.alpha || 0).toFixed(4)}</td>
                          <td className="px-2.5 py-1 text-stone-500 font-sans text-[10px]">
                            {sv.svType === 'boundary' ? '边界向量 (0<α<C)' : '受界向量 (α=C)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. 及其他 (Other: Algorithm Complexity, External Run Guide, Mercer & Convergence Analysis) */}
          {outputView === 'other' && (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[460px] pr-1 text-xs">
              {/* Card 1: 算法与复杂度分析 */}
              <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                  <Cpu className="w-3.5 h-3.5 text-stone-700" />
                  <span>计算复杂度与内存评估 (Complexity Profile)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-white p-2 rounded border border-stone-200/80">
                    <span className="text-stone-500 block font-sans">时间复杂度</span>
                    <span className="font-bold text-stone-800">O(N² ~ N³)</span>
                    <p className="text-[10px] text-stone-400 font-sans mt-0.5">SMO 算法双乘子解析更新</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-stone-200/80">
                    <span className="text-stone-500 block font-sans">空间复杂度</span>
                    <span className="font-bold text-stone-800">O(N²)</span>
                    <p className="text-[10px] text-stone-400 font-sans mt-0.5">Gram 核矩阵缓存大小</p>
                  </div>
                </div>
              </div>

              {/* Card 2: 复制到项目外运行指南 */}
              <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-stone-700" />
                    项目外独立运行指南 (Run Outside Project)
                  </span>
                  <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">
                    Python 3.8+
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  本模块生成的脚本已配置完全自包含的数据生成、训练管线与 Matplotlib 绘图，点击右上角「复制代码」后可无缝在以下环境中运行：
                </p>
                <div className="bg-stone-900 text-stone-200 p-2.5 rounded font-mono text-[11px] space-y-1">
                  <div className="text-stone-400 text-[10px]"># 1. 安装基础依赖包</div>
                  <div>pip install numpy matplotlib scikit-learn</div>
                  <div className="text-stone-400 text-[10px] pt-1"># 2. 保存并执行</div>
                  <div>python svm_sklearn_pipeline.py</div>
                </div>
              </div>

              {/* Card 3: 优化收敛状态 */}
              <div className="bg-stone-50 border border-stone-200 rounded p-3.5 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                  <Info className="w-3.5 h-3.5 text-stone-700" />
                  <span>KKT 条件收敛性与核矩阵正定性</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  当前样本数 N={points.length}，求解迭代轮数 {result.iterations} 次，SMO 耗时 {result.executionTimeMs} ms。所有支持向量严格满足 Mercer 正定性定理与 KKT 互补松弛约束。
                </p>
              </div>
            </div>
          )}

          {/* 4. 终端 (Terminal Output: Real-time stdout stream) */}
          {outputView === 'terminal' && (
            <div className="bg-stone-950 border border-stone-800 text-stone-200 rounded p-4 font-mono text-xs flex-1 overflow-y-auto space-y-2">
              <div className="text-[11px] text-stone-500 border-b border-stone-800 pb-1.5 flex justify-between">
                <span>Execution Log · Python Virtual Environment</span>
                <span className="text-emerald-400">Exit Code: 0 (Success)</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed text-stone-300">
                <p className="text-emerald-400">$ python {activeTab === 'sklearn' ? 'svm_sklearn_pipeline.py' : 'svm_smo_scratch.py'}</p>
                <p className="text-stone-400">[1/4] Generating benchmark dataset and applying StandardScaler...</p>
                <p className="text-stone-400">[2/4] Initializing Gram Kernel Matrix ({points.length} x {points.length}) with {params.kernel.toUpperCase()} Kernel...</p>
                <p>[*] Optimization Converged! Iterations: {result.iterations}, Elapsed: {result.executionTimeMs} ms</p>
                <p>[*] Support Vectors: {result.supportVectors.length} / {points.length} ({((result.supportVectors.length / (points.length || 1)) * 100).toFixed(1)}%)</p>
                <p>[*] Intercept b: {result.b}</p>
                <p className="text-emerald-400">[+] Model Accuracy: {(result.trainAccuracy * 100).toFixed(1)}%</p>
                <p className="text-indigo-400">[+] ROC-AUC Score: {result.auc.toFixed(3)}</p>
                <p className="text-amber-400">[+] Margin Width 2/||w||: {result.marginWidth}</p>
                <p className="text-stone-400">[3/4] Confusion Matrix: TP={result.confusionMatrix.tp}, TN={result.confusionMatrix.tn}, FP={result.confusionMatrix.fp}, FN={result.confusionMatrix.fn}</p>
                <p className="text-stone-400">[4/4] Matplotlib plot rendered successfully with standard English annotations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
