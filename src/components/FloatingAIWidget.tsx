import React, { useState, useEffect } from 'react';
import { Bot, X, Sparkles, Send, RefreshCw, Settings, ShieldCheck, AlertCircle } from 'lucide-react';
import { Point2D, SVMHyperparams, SVMModelResult } from '../types/svm';
import {
  LLMConfig,
  getStoredLLMConfig,
  executeLLMCall,
} from '../utils/llmService';
import { ModelSettingsModal } from './ModelSettingsModal';

interface FloatingAIWidgetProps {
  points: Point2D[];
  params: SVMHyperparams;
  result: SVMModelResult;
}

export const FloatingAIWidget: React.FC<FloatingAIWidgetProps> = ({
  points,
  params,
  result,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(getStoredLLMConfig);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >(() => [
    {
      role: 'assistant',
      text: `您好！我是您的 SVM 理论随诊 AI。当前模型为 ${getStoredLLMConfig().selectedModel}。点击顶部 ⚙ 齿轮图标可切换模型并配置 API-Key。`,
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLlmConfig(getStoredLLMConfig());
  }, [isOpen]);

  const sendMessage = async (presetText?: string, mode?: string) => {
    const query = presetText || input.trim();
    if (!query && !mode) return;

    if (!llmConfig.apiKey.trim()) {
      setIsSettingsOpen(true);
      return;
    }

    const newMsgs = [...messages, { role: 'user' as const, text: query || `[执行 ${mode} 审计]` }];
    setMessages(newMsgs);
    if (!presetText) setInput('');
    setLoading(true);

    try {
      const outputText = await executeLLMCall(
        {
          message: query,
          mode,
          context: {
            datasetSize: points.length,
            kernel: params.kernel,
            C: params.C,
            gamma: params.gamma,
            supportVectorsCount: result.supportVectors.length,
            marginWidth: result.marginWidth,
            trainAccuracy: result.trainAccuracy,
            conditionNumber: result.gramMatrixStats.conditionNumber,
            isPositiveSemiDefinite: result.gramMatrixStats.isPositiveSemiDefinite,
          },
        },
        llmConfig
      );

      setMessages([...newMsgs, { role: 'assistant', text: outputText }]);
    } catch (err: any) {
      if (err.message === 'MISSING_API_KEY') {
        setIsSettingsOpen(true);
        setMessages([
          ...newMsgs,
          {
            role: 'assistant',
            text: '【提示】未录入 API-Key。本项目采用浏览器端直连大模型，请点击齿轮输入 API-Key 后方可调用。',
          },
        ]);
      } else {
        setMessages([
          ...newMsgs,
          {
            role: 'assistant',
            text: `【错误】${err.message || '大模型调用异常，请检查 API-Key 或网络。'}`,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40">
        {/* Closed State Floating Launcher Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-stone-50 rounded-full shadow-lg hover:bg-stone-800 transition-all border border-stone-700 text-xs font-medium group"
          >
            <Bot className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>AI 随诊对话</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        )}

        {/* Expanded Floating Modal Window */}
        {isOpen && (
          <div className="w-[360px] sm:w-[420px] h-[520px] bg-white rounded-xl shadow-2xl border border-stone-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header with Gear Settings */}
            <div className="px-4 py-3 bg-stone-900 text-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-300" />
                <div>
                  <div className="text-xs font-medium flex items-center gap-1.5">
                    <span>SVM 专家随诊</span>
                    <span className="font-mono text-[10px] bg-stone-800 text-stone-300 px-1 rounded">
                      {llmConfig.selectedModel}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {llmConfig.apiKey ? (
                      <span className="text-emerald-400">● Key 已就绪</span>
                    ) : (
                      <span className="text-rose-400">● 尚未输入 Key</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Gear button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
                  title="配置大模型与 API-Key"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Triggers */}
            <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() =>
                  sendMessage('请评估当前 Gram 矩阵正半定性与条件数。', 'mercer_gram_audit')
                }
                className="px-2 py-1 rounded bg-white border border-stone-200 hover:bg-stone-100 whitespace-nowrap text-stone-700"
              >
                Gram 谱诊断
              </button>
              <button
                onClick={() =>
                  sendMessage('评估离群点敏感度与当前松弛变量损失。', 'outlier_margin_audit')
                }
                className="px-2 py-1 rounded bg-white border border-stone-200 hover:bg-stone-100 whitespace-nowrap text-stone-700"
              >
                离群点审计
              </button>
              <button
                onClick={() =>
                  sendMessage('当前支持向量占比是否发生过拟合爆炸？', 'outlier_margin_audit')
                }
                className="px-2 py-1 rounded bg-white border border-stone-200 hover:bg-stone-100 whitespace-nowrap text-stone-700"
              >
                SV 爆炸排查
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 select-text text-xs leading-relaxed">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-lg whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-stone-900 text-stone-50 font-medium'
                        : 'bg-stone-100 text-stone-800 border border-stone-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-1.5 text-stone-400 text-[11px] p-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>正在调用 {llmConfig.selectedModel} 分析中...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-2.5 border-t border-stone-200 bg-stone-50 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="向随诊专家提问..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded focus:outline-none focus:border-stone-400 text-stone-800"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-1.5 bg-stone-900 text-stone-50 rounded hover:bg-stone-800 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <ModelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onSaveConfig={(newCfg) => setLlmConfig(newCfg)}
      />
    </>
  );
};
