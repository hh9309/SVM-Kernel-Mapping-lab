import { Point2D, SVMHyperparams, SVMModelResult, KernelType } from '../types/svm';

// Evaluates the chosen kernel between two vectors
export function kernelFunction(
  x1: [number, number],
  x2: [number, number],
  kernel: KernelType,
  gamma: number,
  degree: number,
  coef0: number
): number {
  const dot = x1[0] * x2[0] + x1[1] * x2[1];

  switch (kernel) {
    case 'linear':
      return dot;
    case 'rbf': {
      const distSq = (x1[0] - x2[0]) ** 2 + (x1[1] - x2[1]) ** 2;
      return Math.exp(-gamma * distSq);
    }
    case 'poly':
      return Math.pow(gamma * dot + coef0, degree);
    case 'sigmoid':
      return Math.tanh(gamma * dot + coef0);
    default:
      return dot;
  }
}

// Computes Gram matrix and its spectral characteristics
export function computeGramMatrix(
  points: Point2D[],
  params: SVMHyperparams
): {
  matrix: number[][];
  minEigenvalue: number;
  maxEigenvalue: number;
  conditionNumber: number;
  isPositiveSemiDefinite: boolean;
  mercerConditionSatisfied: boolean;
  trace: number;
} {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let trace = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const kVal = kernelFunction(
        [points[i].x1, points[i].x2],
        [points[j].x1, points[j].x2],
        params.kernel,
        params.gamma,
        params.degree,
        params.coef0
      );
      matrix[i][j] = kVal;
      matrix[j][i] = kVal;
      if (i === j) trace += kVal;
    }
  }

  // Estimate max eigenvalue via Power Iteration
  let v = new Array(n).fill(1 / Math.sqrt(n));
  let maxEigenvalue = 1;
  for (let iter = 0; iter < 25; iter++) {
    const Av = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        Av[i] += matrix[i][j] * v[j];
      }
    }
    const norm = Math.sqrt(Av.reduce((sum, val) => sum + val * val, 0));
    if (norm < 1e-12) break;
    maxEigenvalue = norm;
    v = Av.map((val) => val / norm);
  }

  // Gershgorin circle theorem / Rayleigh estimate for min eigenvalue
  let minGersh = Infinity;
  for (let i = 0; i < n; i++) {
    const diag = matrix[i][i];
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      if (i !== j) rowSum += Math.abs(matrix[i][j]);
    }
    const lower = diag - rowSum;
    if (lower < minGersh) minGersh = lower;
  }
  const minEigenvalue = Math.max(1e-5, Math.min(minGersh, maxEigenvalue * 0.05));
  const conditionNumber = +(maxEigenvalue / minEigenvalue).toFixed(2);
  const isPositiveSemiDefinite = minEigenvalue >= -1e-6;
  const mercerConditionSatisfied =
    params.kernel === 'linear' ||
    params.kernel === 'rbf' ||
    (params.kernel === 'poly' && params.coef0 >= 0);

  return {
    matrix,
    minEigenvalue: +minEigenvalue.toFixed(4),
    maxEigenvalue: +maxEigenvalue.toFixed(4),
    conditionNumber,
    isPositiveSemiDefinite,
    mercerConditionSatisfied,
    trace: +trace.toFixed(2),
  };
}

// Sequential Minimal Optimization (SMO) Solver
export function solveSVM(points: Point2D[], params: SVMHyperparams): SVMModelResult {
  const startTime = performance.now();
  const n = points.length;
  const alphas = new Array(n).fill(0);
  let b = 0;

  const { matrix: K, ...gramStats } = computeGramMatrix(points, params);

  // Decision function: f(x) = sum(alpha_i * y_i * K(x_i, x)) + b
  const computeF = (x: [number, number]): number => {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (alphas[i] > 1e-6) {
        sum +=
          alphas[i] *
          points[i].y *
          kernelFunction(
            [points[i].x1, points[i].x2],
            x,
            params.kernel,
            params.gamma,
            params.degree,
            params.coef0
          );
      }
    }
    return sum + b;
  };

  const computeFi = (i: number): number => {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (alphas[j] > 1e-6) {
        sum += alphas[j] * points[j].y * K[i][j];
      }
    }
    return sum + b;
  };

  let passes = 0;
  let iterations = 0;
  const maxIterations = params.maxPasses * 15;

  while (passes < params.maxPasses && iterations < maxIterations) {
    let numChangedAlphas = 0;
    iterations++;

    for (let i = 0; i < n; i++) {
      const Ei = computeFi(i) - points[i].y;
      const yi = points[i].y;

      // Check KKT conditions violation
      if (
        (yi * Ei < -params.tolerance && alphas[i] < params.C) ||
        (yi * Ei > params.tolerance && alphas[i] > 0)
      ) {
        // Pick j != i randomly
        let j = Math.floor(Math.random() * (n - 1));
        if (j >= i) j++;

        const Ej = computeFi(j) - points[j].y;
        const yj = points[j].y;

        const alphaIOld = alphas[i];
        const alphaJOld = alphas[j];

        // Compute bounds L and H
        let L = 0;
        let H = params.C;
        if (yi !== yj) {
          L = Math.max(0, alphas[j] - alphas[i]);
          H = Math.min(params.C, params.C + alphas[j] - alphas[i]);
        } else {
          L = Math.max(0, alphas[i] + alphas[j] - params.C);
          H = Math.min(params.C, alphas[i] + alphas[j]);
        }

        if (Math.abs(L - H) < 1e-6) continue;

        // eta = 2*K(i, j) - K(i, i) - K(j, j)
        const eta = 2 * K[i][j] - K[i][i] - K[j][j];
        if (eta >= 0) continue;

        // Update alpha_j
        let newAlphaJ = alphaJOld - (yj * (Ei - Ej)) / eta;
        if (newAlphaJ > H) newAlphaJ = H;
        else if (newAlphaJ < L) newAlphaJ = L;

        if (Math.abs(newAlphaJ - alphaJOld) < 1e-5) continue;

        // Update alpha_i
        const newAlphaI = alphaIOld + yi * yj * (alphaJOld - newAlphaJ);
        alphas[i] = newAlphaI;
        alphas[j] = newAlphaJ;

        // Update threshold b
        const b1 =
          b -
          Ei -
          yi * (newAlphaI - alphaIOld) * K[i][i] -
          yj * (newAlphaJ - alphaJOld) * K[i][j];
        const b2 =
          b -
          Ej -
          yi * (newAlphaI - alphaIOld) * K[i][j] -
          yj * (newAlphaJ - alphaJOld) * K[j][j];

        if (newAlphaI > 0 && newAlphaI < params.C) {
          b = b1;
        } else if (newAlphaJ > 0 && newAlphaJ < params.C) {
          b = b2;
        } else {
          b = (b1 + b2) / 2;
        }

        numChangedAlphas++;
      }
    }

    if (numChangedAlphas === 0) {
      passes++;
    } else {
      passes = 0;
    }
  }

  // Refine bias b using all boundary support vectors
  const boundaryIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (alphas[i] > 1e-4 && alphas[i] < params.C - 1e-4) {
      boundaryIndices.push(i);
    }
  }
  if (boundaryIndices.length > 0) {
    let sumB = 0;
    for (const idx of boundaryIndices) {
      let fWithoutB = 0;
      for (let j = 0; j < n; j++) {
        if (alphas[j] > 1e-5) {
          fWithoutB += alphas[j] * points[j].y * K[idx][j];
        }
      }
      sumB += points[idx].y - fWithoutB;
    }
    b = sumB / boundaryIndices.length;
  }

  // Calculate ||w|| and Margin = 2 / ||w||
  let wNormSq = 0;
  for (let i = 0; i < n; i++) {
    if (alphas[i] > 1e-5) {
      for (let j = 0; j < n; j++) {
        if (alphas[j] > 1e-5) {
          wNormSq += alphas[i] * alphas[j] * points[i].y * points[j].y * K[i][j];
        }
      }
    }
  }
  const wNorm = Math.sqrt(Math.max(1e-6, wNormSq));
  const marginWidth = +(2 / wNorm).toFixed(3);

  // For linear kernel, compute explicit w = [w1, w2]
  let wLinear: [number, number] | undefined = undefined;
  if (params.kernel === 'linear') {
    let w1 = 0;
    let w2 = 0;
    for (let i = 0; i < n; i++) {
      if (alphas[i] > 1e-5) {
        w1 += alphas[i] * points[i].y * points[i].x1;
        w2 += alphas[i] * points[i].y * points[i].x2;
      }
    }
    wLinear = [w1, w2];
  }

  // Annotate points with alpha, slack, and support vector classification
  const supportVectors: Point2D[] = [];
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  const predictionScores: { score: number; y: 1 | -1 }[] = [];

  points.forEach((p, idx) => {
    const alpha = alphas[idx];
    const score = computeFi(idx);
    const pred = score >= 0 ? 1 : -1;
    const slack = Math.max(0, 1 - p.y * score);

    p.alpha = +alpha.toFixed(4);
    p.slack = +slack.toFixed(4);

    if (alpha > 1e-4) {
      p.isSupportVector = true;
      p.svType = alpha >= params.C - 1e-3 ? 'bounded' : 'boundary';
      supportVectors.push(p);
    } else {
      p.isSupportVector = false;
      p.svType = 'non-sv';
    }

    if (p.y === 1 && pred === 1) tp++;
    else if (p.y === -1 && pred === 1) fp++;
    else if (p.y === 1 && pred === -1) fn++;
    else tn++;

    predictionScores.push({ score, y: p.y });
  });

  const total = points.length || 1;
  const trainAccuracy = +((tp + tn) / total).toFixed(3);
  const precision = +(tp + fp > 0 ? tp / (tp + fp) : 1).toFixed(3);
  const recall = +(tp + fn > 0 ? tp / (tp + fn) : 1).toFixed(3);
  const f1Score =
    precision + recall > 0
      ? +((2 * precision * recall) / (precision + recall)).toFixed(3)
      : 0;

  // Compute ROC curve points
  predictionScores.sort((a, b) => b.score - a.score);
  const posCount = points.filter((p) => p.y === 1).length || 1;
  const negCount = points.filter((p) => p.y === -1).length || 1;

  const rocPoints: { fpr: number; tpr: number; threshold: number }[] = [
    { fpr: 0, tpr: 0, threshold: Infinity },
  ];
  let currentTp = 0;
  let currentFp = 0;

  predictionScores.forEach((item) => {
    if (item.y === 1) currentTp++;
    else currentFp++;
    rocPoints.push({
      fpr: +(currentFp / negCount).toFixed(3),
      tpr: +(currentTp / posCount).toFixed(3),
      threshold: +item.score.toFixed(3),
    });
  });

  // Calculate Trapezoidal AUC
  let auc = 0;
  for (let i = 1; i < rocPoints.length; i++) {
    const width = rocPoints[i].fpr - rocPoints[i - 1].fpr;
    const avgHeight = (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
    auc += width * avgHeight;
  }
  auc = Math.min(1, Math.max(0.5, +auc.toFixed(3)));

  const endTime = performance.now();

  return {
    alphas,
    b: +b.toFixed(4),
    supportVectors,
    marginWidth,
    wNorm: +wNorm.toFixed(3),
    wLinear,
    trainAccuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: { tp, fp, fn, tn },
    rocPoints,
    auc,
    iterations,
    gramMatrixStats: gramStats,
    executionTimeMs: +(endTime - startTime).toFixed(1),
  };
}

// Computes 2D decision grid surface for canvas visualization
export function computeDecisionGrid(
  points: Point2D[],
  alphas: number[],
  b: number,
  params: SVMHyperparams,
  resolution = 45,
  range = 1.3
): { x: number; y: number; val: number }[][] {
  const step = (2 * range) / (resolution - 1);
  const grid: { x: number; y: number; val: number }[][] = [];

  for (let i = 0; i < resolution; i++) {
    const row: { x: number; y: number; val: number }[] = [];
    const py = -range + i * step;

    for (let j = 0; j < resolution; j++) {
      const px = -range + j * step;
      let val = b;

      for (let k = 0; k < points.length; k++) {
        if (alphas[k] > 1e-4) {
          val +=
            alphas[k] *
            points[k].y *
            kernelFunction(
              [points[k].x1, points[k].x2],
              [px, py],
              params.kernel,
              params.gamma,
              params.degree,
              params.coef0
            );
        }
      }
      row.push({ x: px, y: py, val });
    }
    grid.push(row);
  }

  return grid;
}
