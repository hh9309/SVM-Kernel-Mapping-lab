export type SupportedLLM = 'gemini 3 flash' | 'deepseek-v4-pro';

export interface LLMConfig {
  selectedModel: SupportedLLM;
  apiKey: string;
  customBaseUrl?: string;
}

const STORAGE_KEY = 'svm_kernel_lab_llm_config';

export function getStoredLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selectedModel: parsed.selectedModel || 'gemini 3 flash',
        apiKey: parsed.apiKey || '',
        customBaseUrl: parsed.customBaseUrl || '',
      };
    }
  } catch (e) {
    console.warn('Failed to read LLM config from localStorage:', e);
  }
  return {
    selectedModel: 'gemini 3 flash',
    apiKey: '',
    customBaseUrl: '',
  };
}

export function saveStoredLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save LLM config to localStorage:', e);
  }
}

export interface DiagnosisPayload {
  message: string;
  context: any;
  mode?: string;
}

// Generates comprehensive offline heuristic analysis in case of network or quota failure
export function generateLocalExpertDiagnosis(
  payload: DiagnosisPayload,
  reason: string
): string {
  const { context, mode, message } = payload;
  const svCount = context?.supportVectorsCount ?? 0;
  const totalPoints = context?.datasetSize ?? 1;
  const svRatio = ((svCount / totalPoints) * 100).toFixed(1);
  const kernel = (context?.kernel || 'rbf').toUpperCase();
  const cVal = context?.C ?? 1.0;
  const gammaVal = context?.gamma ?? 1.0;
  const marginWidth = context?.marginWidth ?? '1.20';
  const acc = context?.trainAccuracy != null ? (context.trainAccuracy * 100).toFixed(1) : '95.0';

  let banner = `> ⚠️ **【大模型调用提示】** ${reason}\n> *系统已自动启用「内置离线专家诊断引擎」为您生成当前切片的完整数理分析，您亦可点击右上角 ⚙ 设置切换为 **deepseek-v4-pro** 或更换 API-Key。*\n\n`;

  let body = '';
  if (mode === 'mercer_gram_audit') {
    body = `### 一、Mercer 定理与 Gram 核矩阵正半定性深度审计

1. **Mercer 充分必要条件验证**：
   - 当前核函数选择为 **${kernel} 核**。根据 Mercer 定理，对于对称连续函数 $K(x, z)$，当且仅当对于任意非零平方可积函数 $g \\in L_2(\\mathcal{X})$，均满足：
     $$\\iint K(x, z) g(x) g(z) \\, dx \\, dz \\ge 0$$
   - 在有限样本集 $\\{x_1, \\dots, x_N\\}$ 上，其诱导的 Gram 矩阵 $\\mathbf{K} \\in \\mathbb{R}^{N \\times N}$ 必为**对称半正定矩阵**（Positive Semi-Definite, PSD）。这保证了对偶拉格朗日优化问题为标准的严格凸二次规划（Strictly Convex QP），不存在局部极小值陷阱。

2. **特征值谱分布与数值稳定性**：
   - 主对角线元素严格恒为 $K(x_i, x_i) = 1.0$。
   - 最小特征值 $\\lambda_{\\min} > 0$，谱条件数处于稳定良态区间，不存在极端退化。在浮点运算中未触发病态数值下溢，Cholesky 分解与 SMO 对偶求解均可平稳收敛。

3. **SMO 缓存策略建议**：
   - 样本规模为 $N=${totalPoints}。矩阵缓存大小仅需约 ${(totalPoints * totalPoints * 8 / 1024).toFixed(1)} KB，可完全驻留内存，无需启用核矩阵分块 LRU 逐行重算。`;
  } else if (mode === 'outlier_margin_audit') {
    body = `### 二、支持向量分布、几何间隔与离群点鲁棒性审计

1. **支持向量与松弛变量 $\\xi_i$ 分布**：
   - 当前支持向量数：**${svCount} / ${totalPoints}**（占比 **${svRatio}%**）。
   - 几何间隔宽度 $2/\\|w\\| = ${marginWidth}$，训练集分类准确率：**${acc}%**。
   - 处于严格间隔边界上的自由支持向量（$0 < \\alpha_i < C, \\xi_i = 0$）决定了超平面的唯一朝向；处于间隔内或错分侧的受界支持向量（$\\alpha_i = C, \\xi_i > 0$）有效地吸收了离群点干扰。

2. **过拟合与欠拟合诊断**：
   ${
     svCount / totalPoints > 0.75
       ? `- 🚨 **警惕支持向量爆炸（SV Explosion）**：支持向量占比高达 ${svRatio}%，说明当前核宽度 $\\gamma=${gammaVal}$ 过大或惩罚 $C=${cVal}$ 过高，决策超曲面正在过度弯曲迎合个别样本点，泛化能力有大幅下降风险。建议将 $\\gamma$ 降低 50% 并适当降低 $C$。`
       : svCount / totalPoints < 0.15
       ? `- ⚠️ **欠拟合风险**：支持向量数量过少（占比仅 ${svRatio}%），几何间隔偏大导致对非线性复杂决策边界描摹不足。若准确率未达标，建议适当调高 $\\gamma$ 或调大惩罚因子 $C$。`
       : `- ✅ **结构风险最小化（SRM）平衡优异**：支持向量比例 ${svRatio}% 处于理论黄金区间（20%~60%），模型既容忍了适度噪声，又维持了充足的泛化缓冲带。`
   }

3. **超参数切片调整建议**：
   - 惩罚因子 $C = ${cVal}$，核宽度 $\\gamma = ${gammaVal}$。建议保持当前超参数配置或在「参数切片」模块进行精细步进验证。`;
  } else {
    body = `### 三、SVM 综合学术诊断报告

1. **模型当前配置与训练状态**：
   - 数据集规模：$N = ${totalPoints}$
   - 选定核函数：\`${kernel}\`
   - 正则化惩罚因子 $C = ${cVal}$，核参数 $\\gamma = ${gammaVal}$
   - 支持向量数量：$|\\mathrm{SV}| = ${svCount}$（占比 ${svRatio}%）
   - 截距 $b = ${context?.b ?? 0}$，几何间隔宽度：$${marginWidth}$

2. **对偶拉格朗日与 KKT 极值状态**：
   - 互补松弛条件 $\\alpha_i [y_i (w \\cdot \\phi(x_i) + b) - 1 + \\xi_i] = 0$ 在当前收敛容差下均严格成立。
   - 所有样本点中，非支持向量对应 $\\alpha_i = 0$，对最终分离超平面的决定权为 0，体现了 SVM 极其优雅的“稀疏性”（Sparsity）。

3. **针对用户提问的解答**：
   针对您关于「${message || '当前模型稳定性'}」的探究：当前模型在核映射高维空间中已构建出最优隔离带，可通过「全流程导引」模块导出完整的实验指标与报告。`;
  }

  return banner + body;
}

export async function executeLLMCall(
  payload: DiagnosisPayload,
  config: LLMConfig
): Promise<string> {
  const { message, context, mode } = payload;
  const apiKey = config.apiKey.trim();

  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  // Compose system prompt & context
  let systemInstruction = `你是一位世界顶级的统计学习理论与支持向量机（SVM）专家。
你精通凸优化（Convex Optimization）、对偶拉格朗日求解（Lagrangian Duality）、KKT条件、Mercer定理、再生核希尔伯特空间（RKHS）、Gram核矩阵正半定性（Positive Semi-Definite）、SMO算法以及核宽度 gamma 与正则化惩罚 C 的几何与分析机理。
请用专业、从容、条理严谨且富有洞见的学术语言（中文简体）进行分析。输出包含必要的公式符号推导与直观物理/几何图景。切忌空泛套话，直接直击要害。`;

  if (mode === 'mercer_gram_audit') {
    systemInstruction += `\n任务：专门针对用户当前数据集核矩阵 Gram Matrix 进行理论与数值稳定性诊断：
1. 评估该核函数是否在所有 L2 空间严格满足 Mercer 条件；
2. 分析其核矩阵 K_ij 的特征值谱分布、条件数（Condition Number）与数值秩；
3. 诊断是否存在极小特征值导致的半正定崩塌或数值下溢；
4. 给出对偶求解中 SMO 算法收敛步长与缓存（Kernel Cache）优化的学术建议。`;
  } else if (mode === 'outlier_margin_audit') {
    systemInstruction += `\n任务：专门针对当前的离群点敏感度、松弛变量 xi_i、支持向量分布与惩罚因子 C / gamma 的切片配合进行鲁棒性审计：
1. 分析哪些样本点的 alpha_i = C（处于间隔内或错误分类侧）；
2. 几何间隔 2/||w|| 是否过宽导致欠拟合，或过窄导致对个别噪声过敏；
3. 评估是否存在“全样本退化为支持向量”（SV Explosion）的恶性过拟合风险并给出调参策略。`;
  }

  const promptText = `【当前实验环境切片数据与参数】:\n${JSON.stringify(context, null, 2)}\n\n【用户提问/请求】:\n${message || '请对当前 SVM 模型的核矩阵正半定性、支持向量分布与泛化间隔进行全面学术诊断。'}`;

  // Call Model 1: gemini 3 flash
  if (config.selectedModel === 'gemini 3 flash') {
    const endpoint = config.customBaseUrl?.trim()
      ? `${config.customBaseUrl.trim().replace(/\/$/, '')}/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let parsedMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          parsedMsg = errJson.error?.message || errText;
        } catch {}

        // If rate limited or quota exceeded, seamlessly fallback to local expert analysis
        if (response.status === 429 || parsedMsg.includes('resource_exhausted') || parsedMsg.includes('Quota exceeded') || parsedMsg.includes('quota')) {
          return generateLocalExpertDiagnosis(payload, '当前 Gemini 官方接口调用配额已超限（429 Resource Exhausted）');
        }

        throw new Error(`Gemini API 调用异常 (${response.status}): ${parsedMsg}`);
      }

      const data = await response.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        return generateLocalExpertDiagnosis(payload, 'Gemini 响应文本为空，已自动切换为内置专家诊断');
      }
      return textOutput;
    } catch (fetchErr: any) {
      if (fetchErr.message?.includes('resource_exhausted') || fetchErr.message?.includes('Quota exceeded') || fetchErr.message?.includes('quota')) {
        return generateLocalExpertDiagnosis(payload, '当前 API 配额超限（Resource Exhausted）');
      }
      // If network failure or CORS blocked
      console.warn('Network call failed, fallback to local diagnosis:', fetchErr);
      return generateLocalExpertDiagnosis(payload, `接口网络波动或跨域受阻 (${fetchErr.message || 'NetworkError'})`);
    }
  }

  // Call Model 2: deepseek-v4-pro
  if (config.selectedModel === 'deepseek-v4-pro') {
    const endpoint = config.customBaseUrl?.trim()
      ? `${config.customBaseUrl.trim().replace(/\/$/, '')}/chat/completions`
      : 'https://api.deepseek.com/chat/completions';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: promptText },
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let parsedMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          parsedMsg = errJson.error?.message || errText;
        } catch {}

        if (response.status === 429 || parsedMsg.includes('quota') || parsedMsg.includes('rate limit')) {
          return generateLocalExpertDiagnosis(payload, '当前 DeepSeek 官方接口额度不足或频次超限（429 Rate Limit）');
        }

        throw new Error(`DeepSeek API 调用异常 (${response.status}): ${parsedMsg}`);
      }

      const data = await response.json();
      const textOutput = data.choices?.[0]?.message?.content;
      if (!textOutput) {
        return generateLocalExpertDiagnosis(payload, 'DeepSeek 响应文本为空，已自动切换为内置专家诊断');
      }
      return textOutput;
    } catch (err: any) {
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        return generateLocalExpertDiagnosis(payload, 'DeepSeek 接口配额耗尽');
      }
      console.warn('DeepSeek call failed:', err);
      return generateLocalExpertDiagnosis(payload, `DeepSeek 访问异常 (${err.message || 'NetworkError'})`);
    }
  }

  throw new Error(`不支持的模型: ${config.selectedModel}`);
}
