import React, { useState, useEffect } from 'react';
import { MathView } from '../MathView';
import { SVMHyperparams, SVMModelResult, Point2D } from '../../types/svm';
import {
  LLMConfig,
  getStoredLLMConfig,
  executeLLMCall,
  SupportedLLM,
} from '../../utils/llmService';
import { ModelSettingsModal } from '../ModelSettingsModal';
import {
  Bot,
  Send,
  Sparkles,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Activity,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface AIDiagnosticSliceProps {
  points: Point2D[];
  params: SVMHyperparams;
  result: SVMModelResult;
}

export const AIDiagnosticSlice: React.FC<AIDiagnosticSliceProps> = ({
  points,
  params,
  result,
}) => {
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(getStoredLLMConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; modelTag?: string }[]
  >(() => [
    {
      role: 'assistant',
      text: `您好！我是您的支持向量机与高维核空间学术随诊顾问。
当前激活大模型：${getStoredLLMConfig().selectedModel}。
系统将依据您当前配置的 API-Key，由浏览器前端直接发起大模型推理。您可以点击标题右侧的【小齿轮 ⚙ 图标】随时切换为 gemini 3 flash 或 deepseek-v4-pro 并更新您的 API-Key。`,
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [apiKeyWarning, setApiKeyWarning] = useState<string | null>(null);

  // Sync with localStorage
  useEffect(() => {
    setLlmConfig(getStoredLLMConfig());
  }, []);

  const sendDiagnosis = async (userPrompt?: string, mode?: string) => {
    const textToSend = userPrompt || input.trim();
    if (!textToSend && !mode) return;

    // Check if API key is entered
    if (!llmConfig.apiKey.trim()) {
      setApiKeyWarning('调用大模型前必须先手工输入 API-Key，请在打开的设置窗口中输入。');
      setIsSettingsOpen(true);
      return;
    }

    setApiKeyWarning(null);
    const newMsgs = [
      ...messages,
      { role: 'user' as const, text: textToSend || `[触发 ${mode} 专项诊断]` },
    ];
    setMessages(newMsgs);
    if (!userPrompt) setInput('');
    setLoading(true);

    const contextPayload = {
      datasetSize: points.length,
      kernel: params.kernel,
      C: params.C,
      gamma: params.gamma,
      degree: params.degree,
      coef0: params.coef0,
      supportVectorsCount: result.supportVectors.length,
      supportVectorsRatio: +(result.supportVectors.length / (points.length || 1)).toFixed(3),
      marginWidth: result.marginWidth,
      trainAccuracy: result.trainAccuracy,
      b: result.b,
      gramMatrixStats: result.gramMatrixStats,
      confusionMatrix: result.confusionMatrix,
      samplePointsOverview: points.slice(0, 10).map((p) => ({
        id: p.id,
        x1: p.x1,
        x2: p.x2,
        y: p.y,
        alpha: p.alpha,
        slack: p.slack,
      })),
    };

    try {
      const outputText = await executeLLMCall(
        {
          message: textToSend,
          context: contextPayload,
          mode,
        },
        llmConfig
      );

      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: outputText,
          modelTag: llmConfig.selectedModel,
        },
      ]);
    } catch (err: any) {
      if (err.message === 'MISSING_API_KEY') {
        setIsSettingsOpen(true);
        setMessages([
          ...newMsgs,
          {
            role: 'assistant',
            text: '【提示】未检测到 API-Key。本项目采用浏览器纯前端直连调用大模型（适用于 GitHub 部署），所有大模型调用必须先在右上角 ⚙ 设置中输入 API-Key。',
          },
        ]);
      } else {
        setMessages([
          ...newMsgs,
          {
            role: 'assistant',
            text: `【调用异常】${err.message || '大模型请求失败，请检查 API-Key 有效性或网络连接。'}`,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header with Gear Icon */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-wider mb-1">
              <span>模块 07</span>
              <span>·</span>
              <span>智能随诊顾问</span>
              <span>·</span>
              <span>浏览器端直连大模型</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-medium text-stone-900">
                AI 诊断与大模型 Q&A 交互对话窗口
              </h2>
              {/* Gear Settings Button (小齿轮设置大模型图标) */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-md border border-stone-300 bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-100 hover:border-stone-400 transition-all shadow-2xs group relative"
                title="设置大模型与手工输入 API-Key"
              >
                <Settings className="w-4 h-4 text-stone-700 group-hover:rotate-45 transition-transform" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mt-1">
              当前大模型：<strong className="font-mono text-stone-900">{llmConfig.selectedModel}</strong>
              {llmConfig.apiKey ? (
                <span className="ml-2 text-xs text-emerald-700 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> API-Key 已就绪 (浏览器本地安全存储)
                </span>
              ) : (
                <span className="ml-2 text-xs text-rose-600 inline-flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> 尚未录入 API-Key (点击右侧齿轮设置)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded text-xs text-stone-800 hover:bg-stone-100 transition-colors shadow-2xs font-medium"
            >
              <Settings className="w-3.5 h-3.5 text-stone-600" />
              <span>设置大模型</span>
              <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                {llmConfig.selectedModel}
              </span>
            </button>
          </div>
        </div>

        {/* API-Key Warning Notification */}
        {apiKeyWarning && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiKeyWarning}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="underline font-semibold ml-2"
            >
              立即输入
            </button>
          </div>
        )}

        {/* Quick Audit Action Triggers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-3 border-t border-stone-200">
          <button
            onClick={() =>
              sendDiagnosis(
                '请对我当前实验的核函数进行 Mercer 条件满足度与 RKHS 空间性质完整评估。',
                'mercer_gram_audit'
              )
            }
            disabled={loading}
            className="p-2.5 rounded bg-white border border-stone-200 hover:border-stone-400 text-left text-xs transition-all shadow-2xs group"
          >
            <div className="font-medium text-stone-800 flex items-center justify-between mb-0.5">
              <span>1. Mercer 条件诊断</span>
              <Sparkles className="w-3 h-3 text-stone-400 group-hover:text-indigo-600" />
            </div>
            <div className="text-[11px] text-stone-500">RKHS 连续性与核内积严格性</div>
          </button>

          <button
            onClick={() =>
              sendDiagnosis(
                '请评估当前核矩阵 Gram Matrix 的特征值谱分布、数值秩与条件数。',
                'mercer_gram_audit'
              )
            }
            disabled={loading}
            className="p-2.5 rounded bg-white border border-stone-200 hover:border-stone-400 text-left text-xs transition-all shadow-2xs group"
          >
            <div className="font-medium text-stone-800 flex items-center justify-between mb-0.5">
              <span>2. Gram 矩阵正半定性</span>
              <Sparkles className="w-3 h-3 text-stone-400 group-hover:text-indigo-600" />
            </div>
            <div className="text-[11px] text-stone-500">半正定判定与数值下溢防范</div>
          </button>

          <button
            onClick={() =>
              sendDiagnosis(
                '请分析当前模型对离群点/噪声样本的敏感度及松弛变量惩罚 C 的鲁棒性。',
                'outlier_margin_audit'
              )
            }
            disabled={loading}
            className="p-2.5 rounded bg-white border border-stone-200 hover:border-stone-400 text-left text-xs transition-all shadow-2xs group"
          >
            <div className="font-medium text-stone-800 flex items-center justify-between mb-0.5">
              <span>3. 离群点与松弛审计</span>
              <Sparkles className="w-3 h-3 text-stone-400 group-hover:text-indigo-600" />
            </div>
            <div className="text-[11px] text-stone-500">ξ 累积损失与软间隔平衡</div>
          </button>

          <button
            onClick={() =>
              sendDiagnosis(
                '请评估当前是否存在支持向量爆炸（SV Explosion）或高维伪过拟合风险。',
                'outlier_margin_audit'
              )
            }
            disabled={loading}
            className="p-2.5 rounded bg-white border border-stone-200 hover:border-stone-400 text-left text-xs transition-all shadow-2xs group"
          >
            <div className="font-medium text-stone-800 flex items-center justify-between mb-0.5">
              <span>4. 支持向量爆炸诊断</span>
              <Sparkles className="w-3 h-3 text-stone-400 group-hover:text-indigo-600" />
            </div>
            <div className="text-[11px] text-stone-500">检测超大 γ 导致的孤岛陷阱</div>
          </button>
        </div>
      </div>

      {/* Chat Area Viewport */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 select-text">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-stone-900 text-stone-100 font-medium'
                    : 'bg-stone-50 border border-stone-200 text-stone-800 font-sans'
                }`}
              >
                {m.modelTag && (
                  <div className="text-[10px] font-mono text-stone-400 mb-1 border-b border-stone-200 pb-0.5">
                    模型应答：{m.modelTag}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-stone-500 p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-700" />
              <span>
                正在通过浏览器直接调用 <strong>{llmConfig.selectedModel}</strong> 解析中...
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendDiagnosis();
          }}
          className="mt-4 pt-3 border-t border-stone-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`向 ${llmConfig.selectedModel} 提问 SVM 理论、核空间变换或参数调优...`}
            className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-stone-400 focus:bg-white text-stone-800 placeholder-stone-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-2xs"
          >
            <span>发送提问</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Model Settings Modal */}
      <ModelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onSaveConfig={(newConfig) => {
          setLlmConfig(newConfig);
          setApiKeyWarning(null);
        }}
      />
    </div>
  );
};
