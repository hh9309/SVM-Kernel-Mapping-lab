import { Point2D, DatasetPreset, RealCaseMeta, RealCaseType } from '../types/svm';

// Synthetic benchmark generator
export function generateSyntheticDataset(
  preset: DatasetPreset,
  count = 60,
  noise = 0.08
): Point2D[] {
  const points: Point2D[] = [];
  let id = 1;

  if (preset === 'circles') {
    const half = Math.floor(count / 2);
    // Inner circle (Class +1)
    for (let i = 0; i < half; i++) {
      const r = 0.35 + (Math.random() - 0.5) * noise * 2;
      const theta = (i / half) * 2 * Math.PI + Math.random() * 0.1;
      points.push({
        id: id++,
        x1: +(r * Math.cos(theta)).toFixed(3),
        x2: +(r * Math.sin(theta)).toFixed(3),
        y: 1,
      });
    }
    // Outer circle (Class -1)
    for (let i = 0; i < count - half; i++) {
      const r = 0.85 + (Math.random() - 0.5) * noise * 2;
      const theta = (i / (count - half)) * 2 * Math.PI + Math.random() * 0.1;
      points.push({
        id: id++,
        x1: +(r * Math.cos(theta)).toFixed(3),
        x2: +(r * Math.sin(theta)).toFixed(3),
        y: -1,
      });
    }
  } else if (preset === 'moons') {
    const half = Math.floor(count / 2);
    // Top moon
    for (let i = 0; i < half; i++) {
      const theta = (i / half) * Math.PI;
      const x1 = Math.cos(theta) + (Math.random() - 0.5) * noise * 2;
      const x2 = Math.sin(theta) + (Math.random() - 0.5) * noise * 2 - 0.2;
      points.push({
        id: id++,
        x1: +(x1 * 0.7).toFixed(3),
        x2: +(x2 * 0.7).toFixed(3),
        y: 1,
      });
    }
    // Bottom moon
    for (let i = 0; i < count - half; i++) {
      const theta = (i / (count - half)) * Math.PI;
      const x1 = 1 - Math.cos(theta) + (Math.random() - 0.5) * noise * 2;
      const x2 = 1 - Math.sin(theta) - 0.5 + (Math.random() - 0.5) * noise * 2 - 0.2;
      points.push({
        id: id++,
        x1: +(x1 * 0.7 - 0.35).toFixed(3),
        x2: +(x2 * 0.7 + 0.15).toFixed(3),
        y: -1,
      });
    }
  } else if (preset === 'xor') {
    const qCount = Math.floor(count / 4);
    const centers: [number, number, 1 | -1][] = [
      [0.55, 0.55, 1],
      [-0.55, -0.55, 1],
      [-0.55, 0.55, -1],
      [0.55, -0.55, -1],
    ];
    centers.forEach(([cx, cy, label]) => {
      for (let i = 0; i < qCount; i++) {
        const x1 = cx + (Math.random() - 0.5) * 0.45;
        const x2 = cy + (Math.random() - 0.5) * 0.45;
        points.push({
          id: id++,
          x1: +x1.toFixed(3),
          x2: +x2.toFixed(3),
          y: label,
        });
      }
    });
  } else if (preset === 'linear') {
    const half = Math.floor(count / 2);
    // Class +1 cluster
    for (let i = 0; i < half; i++) {
      const x1 = 0.45 + (Math.random() - 0.5) * 0.55;
      const x2 = 0.45 + (Math.random() - 0.5) * 0.55;
      points.push({
        id: id++,
        x1: +x1.toFixed(3),
        x2: +x2.toFixed(3),
        y: 1,
      });
    }
    // Class -1 cluster
    for (let i = 0; i < count - half; i++) {
      const x1 = -0.45 + (Math.random() - 0.5) * 0.55;
      const x2 = -0.45 + (Math.random() - 0.5) * 0.55;
      points.push({
        id: id++,
        x1: +x1.toFixed(3),
        x2: +x2.toFixed(3),
        y: -1,
      });
    }
  } else {
    // Spiral
    const half = Math.floor(count / 2);
    for (let i = 0; i < half; i++) {
      const r = (i / half) * 0.85;
      const theta = (i / half) * 2.5 * Math.PI;
      points.push({
        id: id++,
        x1: +(r * Math.cos(theta) + (Math.random() - 0.5) * noise).toFixed(3),
        x2: +(r * Math.sin(theta) + (Math.random() - 0.5) * noise).toFixed(3),
        y: 1,
      });
    }
    for (let i = 0; i < count - half; i++) {
      const r = (i / (count - half)) * 0.85;
      const theta = (i / (count - half)) * 2.5 * Math.PI + Math.PI;
      points.push({
        id: id++,
        x1: +(r * Math.cos(theta) + (Math.random() - 0.5) * noise).toFixed(3),
        x2: +(r * Math.sin(theta) + (Math.random() - 0.5) * noise).toFixed(3),
        y: -1,
      });
    }
  }

  return points;
}

// 4 Classic Real-World Cases
export const REAL_WORLD_CASES: Record<RealCaseType, RealCaseMeta> = {
  mnist: {
    id: 'mnist',
    name: '手写数字识别 (MNIST 0 vs 1)',
    tagline: '784 维像素特征空间降维与超平面切分',
    dimensions: 784,
    sampleCount: 50,
    classNames: ['数字 "0"', '数字 "1"'],
    description: 'MNIST 为计算机视觉与模式识别基准。数字 0 与 1 结构差异巨大，但存在倾斜、粗细与笔锋变异。在 2D 主成分投影切片中，SVM 构建的超平面可清晰分离二者。',
    significance: '展示高维稀疏图像特征在核技巧下的天然凸分离性与支持向量在极端笔画样本上的分布。',
    recommendedKernel: 'rbf',
    recommendedC: 10,
    recommendedGamma: 1.5,
    features: ['主成分 PC1 (笔画对称度)', '主成分 PC2 (竖向骨架重心)', '环状闭合度', '像素密度'],
    rawSamples: [
      { name: 'Digit 0 #1', features: [-0.62, 0.45, 0.91, 0.72], label: -1 },
      { name: 'Digit 0 #2', features: [-0.55, 0.38, 0.88, 0.65], label: -1 },
      { name: 'Digit 0 #3', features: [-0.71, 0.52, 0.95, 0.79], label: -1 },
      { name: 'Digit 0 #4', features: [-0.48, 0.31, 0.82, 0.60], label: -1 },
      { name: 'Digit 0 #5', features: [-0.65, 0.40, 0.89, 0.71], label: -1 },
      { name: 'Digit 0 #6 (倾斜0)', features: [-0.35, 0.15, 0.75, 0.55], label: -1 },
      { name: 'Digit 0 #7', features: [-0.58, 0.48, 0.90, 0.68], label: -1 },
      { name: 'Digit 0 #8', features: [-0.67, 0.35, 0.86, 0.74], label: -1 },
      { name: 'Digit 1 #1', features: [0.65, -0.42, 0.12, 0.28], label: 1 },
      { name: 'Digit 1 #2', features: [0.58, -0.38, 0.15, 0.22], label: 1 },
      { name: 'Digit 1 #3', features: [0.72, -0.50, 0.08, 0.31], label: 1 },
      { name: 'Digit 1 #4', features: [0.49, -0.29, 0.19, 0.25], label: 1 },
      { name: 'Digit 1 #5', features: [0.61, -0.45, 0.11, 0.30], label: 1 },
      { name: 'Digit 1 #6 (带帽1)', features: [0.38, -0.18, 0.28, 0.38], label: 1 },
      { name: 'Digit 1 #7', features: [0.68, -0.44, 0.14, 0.26], label: 1 },
      { name: 'Digit 1 #8', features: [0.54, -0.32, 0.17, 0.24], label: 1 },
    ],
  },
  gene: {
    id: 'gene',
    name: '基因表达微阵列分类 (Leukemia ALL vs AML)',
    tagline: '高维小样本 (HDLSS: 7129 基因 / 38 样本) 经典切片',
    dimensions: 7129,
    sampleCount: 38,
    classNames: ['急性淋巴白血病 (ALL)', '急性髓系白血病 (AML)'],
    description: 'Golub et al. 经典癌症基因微阵列。特征数 (p=7129) 远大于样本量 (n=38)。由于维度极高，线性核在此场景下不仅计算极快，且天然避免了过拟合，是高维小样本的统治级模型。',
    significance: '核空间中线性核与小 C 值在避免维度诅咒中的决定性优势，证明“无需升维，原始高维已凸可分”。',
    recommendedKernel: 'linear',
    recommendedC: 1.0,
    recommendedGamma: 0.5,
    features: ['Z-Score 探针 M27891_at (CST3)', 'Z-Score 探针 M84526_at (DF)', 'X95735_at (Zyxin)', 'U50136_rna1_at (Leukotriene C4)'],
    rawSamples: [
      { name: 'Patient ALL_01', features: [-0.52, -0.48, -0.61, -0.44], label: -1 },
      { name: 'Patient ALL_02', features: [-0.60, -0.55, -0.70, -0.51], label: -1 },
      { name: 'Patient ALL_03', features: [-0.45, -0.39, -0.58, -0.40], label: -1 },
      { name: 'Patient ALL_04', features: [-0.68, -0.62, -0.75, -0.59], label: -1 },
      { name: 'Patient ALL_05', features: [-0.38, -0.32, -0.49, -0.35], label: -1 },
      { name: 'Patient ALL_06', features: [-0.56, -0.50, -0.66, -0.47], label: -1 },
      { name: 'Patient AML_01', features: [0.55, 0.62, 0.58, 0.65], label: 1 },
      { name: 'Patient AML_02', features: [0.62, 0.70, 0.65, 0.72], label: 1 },
      { name: 'Patient AML_03', features: [0.48, 0.54, 0.51, 0.58], label: 1 },
      { name: 'Patient AML_04', features: [0.70, 0.78, 0.72, 0.80], label: 1 },
      { name: 'Patient AML_05', features: [0.42, 0.49, 0.46, 0.52], label: 1 },
      { name: 'Patient AML_06 (边缘)', features: [0.28, 0.35, 0.32, 0.39], label: 1 },
    ],
  },
  breast_cancer: {
    id: 'breast_cancer',
    name: '乳腺癌肿瘤病理诊断 (Wisconsin Diagnostic)',
    tagline: '30 维连续生物物理特征与软间隔容错',
    dimensions: 30,
    sampleCount: 569,
    classNames: ['良性 (Benign)', '恶性 (Malignant)'],
    description: '威斯康星大学细针穿刺 (FNA) 细胞核数字化图像特征，涵盖细胞半径、凹陷度、分形维数、纹理等 30 个连续变量。特征量纲跨度大，极大依赖标准化。',
    significance: '检验特征标准化 (Standardization) 对核距离的救赎，以及软间隔松弛变量在医疗召回率 (Recall) 优先时的权衡。',
    recommendedKernel: 'rbf',
    recommendedC: 2.0,
    recommendedGamma: 0.8,
    features: ['标准化平均半径 (Mean Radius)', '标准化凹陷程度 (Mean Concavity)', '边缘平滑度', '质地方差'],
    rawSamples: [
      { name: 'Case B-01 (良性)', features: [-0.58, -0.62, -0.45, -0.50], label: -1 },
      { name: 'Case B-02 (良性)', features: [-0.64, -0.70, -0.52, -0.58], label: -1 },
      { name: 'Case B-03 (良性)', features: [-0.49, -0.55, -0.38, -0.42], label: -1 },
      { name: 'Case B-04 (良性)', features: [-0.72, -0.78, -0.60, -0.65], label: -1 },
      { name: 'Case B-05 (良性)', features: [-0.41, -0.48, -0.32, -0.37], label: -1 },
      { name: 'Case B-06 (良性疑似)', features: [-0.15, -0.10, -0.18, -0.12], label: -1 },
      { name: 'Case M-01 (恶性)', features: [0.65, 0.72, 0.58, 0.64], label: 1 },
      { name: 'Case M-02 (恶性)', features: [0.74, 0.82, 0.66, 0.73], label: 1 },
      { name: 'Case M-03 (恶性)', features: [0.55, 0.63, 0.49, 0.55], label: 1 },
      { name: 'Case M-04 (恶性)', features: [0.81, 0.90, 0.74, 0.82], label: 1 },
      { name: 'Case M-05 (恶性)', features: [0.48, 0.56, 0.42, 0.48], label: 1 },
      { name: 'Case M-06 (恶性早期)', features: [0.22, 0.28, 0.19, 0.24], label: 1 },
    ],
  },
  text_sentiment: {
    id: 'text_sentiment',
    name: '高维文本情感分类 (TF-IDF 稀疏词袋)',
    tagline: '5000+ 词汇向量空间正负情绪判定',
    dimensions: 5000,
    sampleCount: 45,
    classNames: ['消极评测 (Negative)', '积极评测 (Positive)'],
    description: '影评文本通过 TF-IDF 编码后的高维稀疏特征。正向情感关键词（如 excellent, brilliant, masterpiece）与负向词（disaster, boring, waste）在高维空间形成正交超平面。',
    significance: '稀疏向量点积计算天然高效，线性核与 RBF 核对多义词语境扰动的抗噪性对比。',
    recommendedKernel: 'rbf',
    recommendedC: 5.0,
    recommendedGamma: 1.2,
    features: ['TF-IDF 积极情感聚类 (Positive Lexicon)', 'TF-IDF 消极情感聚类 (Negative Lexicon)', '词语搭配熵', '标点语气强弱'],
    rawSamples: [
      { name: 'Rev "Masterpiece"', features: [-0.60, 0.68, 0.54, 0.61], label: 1 },
      { name: 'Rev "Superb acting"', features: [-0.52, 0.60, 0.48, 0.55], label: 1 },
      { name: 'Rev "Deeply moving"', features: [-0.68, 0.75, 0.61, 0.68], label: 1 },
      { name: 'Rev "Flawless"', features: [-0.45, 0.55, 0.42, 0.49], label: 1 },
      { name: 'Rev "Heartwarming"', features: [-0.58, 0.64, 0.51, 0.58], label: 1 },
      { name: 'Rev "Boring plot"', features: [0.62, -0.65, 0.49, 0.56], label: -1 },
      { name: 'Rev "Total disaster"', features: [0.75, -0.78, 0.62, 0.70], label: -1 },
      { name: 'Rev "Waste of time"', features: [0.58, -0.61, 0.45, 0.52], label: -1 },
      { name: 'Rev "Worst script"', features: [0.69, -0.72, 0.56, 0.64], label: -1 },
      { name: 'Rev "Unbearable"', features: [0.50, -0.54, 0.38, 0.45], label: -1 },
      { name: 'Rev "Mixed feeling"', features: [0.10, 0.08, 0.22, 0.25], label: 1 },
    ],
  },
};

// Convert raw samples of a real-world case into 2D points for rendering
export function getPointsFromRealCase(caseType: RealCaseType): Point2D[] {
  const meta = REAL_WORLD_CASES[caseType];
  return meta.rawSamples.map((sample, idx) => ({
    id: idx + 1,
    x1: sample.features[0],
    x2: sample.features[1],
    y: sample.label,
  }));
}
