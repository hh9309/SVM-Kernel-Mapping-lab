import React, { useState } from 'react';
import { LLMConfig, SupportedLLM, saveStoredLLMConfig } from '../utils/llmService';
import { X, Key, Cpu, Check, Eye, EyeOff, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSaveConfig: (newConfig: LLMConfig) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [selectedModel, setSelectedModel] = useState<SupportedLLM>(config.selectedModel);
  const [apiKey, setApiKey] = useState<string>(config.apiKey);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(config.customBaseUrl || '');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LLMConfig = {
      selectedModel,
      apiKey: apiKey.trim(),
      customBaseUrl: customBaseUrl.trim() || undefined,
    };
    saveStoredLLMConfig(updated);
    onSaveConfig(updated);
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-stone-300 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-stone-800 text-amber-300">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">大模型随诊引擎设置</h3>
              <p className="text-[11px] text-stone-400">配置纯前端浏览器直连调用密钥与服务</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4 text-xs">
          {/* Step 2: Choose from 2 Models */}
          <div className="space-y-1.5">
            <label className="font-semibold text-stone-800 flex items-center justify-between">
              <span>2. 选择大模型 (Select Model)</span>
              <span className="text-[10px] text-stone-400 font-normal">支持双旗舰推理引擎</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: gemini 3 flash */}
              <button
                type="button"
                onClick={() => setSelectedModel('gemini 3 flash')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedModel === 'gemini 3 flash'
                    ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 shadow-2xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-900">gemini 3 flash</span>
                  {selectedModel === 'gemini 3 flash' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  )}
                </div>
                <div className="text-[10px] text-stone-500 leading-normal">
                  Google 极速学术推理模型，高维数学与凸优化解析首选。
                </div>
              </button>

              {/* Option 2: deepseek-v4-pro */}
              <button
                type="button"
                onClick={() => setSelectedModel('deepseek-v4-pro')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedModel === 'deepseek-v4-pro'
                    ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 shadow-2xs'
                    : 'border-stone-200 hover:border-stone-300 text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-900">deepseek-v4-pro</span>
                  {selectedModel === 'deepseek-v4-pro' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  )}
                </div>
                <div className="text-[10px] text-stone-500 leading-normal">
                  深度求索通用大模型，逻辑链条详尽，严谨支持多轮问答。
                </div>
              </button>
            </div>
          </div>

          {/* Step 1: Input API-Key */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stone-600" />
                <span>1. 手工输入 API-Key</span>
              </label>
              <span className="text-[10px] text-stone-400">
                {selectedModel === 'gemini 3 flash' ? 'Google AI Studio Key' : 'DeepSeek Platform Key'}
              </span>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  selectedModel === 'gemini 3 flash'
                    ? '输入您的 Gemini API-Key (以 AIza... 开头)'
                    : '输入您的 DeepSeek API-Key (以 sk-... 开头)'
                }
                className="w-full px-3 py-2 pr-9 border border-stone-300 rounded text-xs focus:outline-none focus:border-stone-700 font-mono bg-stone-50 focus:bg-white text-stone-800"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>GitHub 静态部署安全说明：</strong> 本项目部署至 GitHub 后为纯客户端环境，API-Key 仅加密保存在您当前浏览器的 <code className="font-mono bg-amber-100 px-1 rounded">localStorage</code> 中，由浏览器直接向对应大模型官方服务器发起鉴权，绝不上传第三方中间服务器。
              </span>
            </div>
          </div>

          {/* Optional: Custom API Base URL for Proxy */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-stone-500 hover:text-stone-800 underline"
            >
              {showAdvanced ? '收起自定义 API 反代地址' : '高级：配置自定义中转 / 代理地址 (可选)'}
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-1">
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder={
                    selectedModel === 'gemini 3 flash'
                      ? '默认直连 Google 官方端点，亦可填自定义反代'
                      : '默认: https://api.deepseek.com'
                  }
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs font-mono text-stone-700 bg-stone-50"
                />
              </div>
            )}
          </div>

          {/* Step 3: Confirm Button */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">
              当前配置：<strong className="font-mono text-stone-800">{selectedModel}</strong>
              {apiKey.trim() ? (
                <span className="text-emerald-700 ml-1.5 font-sans">(Key 已录入)</span>
              ) : (
                <span className="text-rose-600 ml-1.5 font-sans">(尚未填写 Key)</span>
              )}
            </span>

            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {justSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>{justSaved ? '已保存设置' : '3. 确认大模型'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
