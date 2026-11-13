import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Palette,
  Sliders,
  Sparkles,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Layers,
  ArrowRight,
  Eye,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import {
  ORDER_LIFECYCLE_STAGES,
  PAYMENT_STAGES,
  COLD_CHAIN_STAGES,
  SERVICE_ENGINEER_STAGES,
  PREVENTIVE_MAINTENANCE_STAGES,
  StageColorDefinition,
} from '../utils/stageThemeColors';
import {
  THEME_PRESETS,
  ThemePalette,
  getActiveTheme,
  setActiveTheme,
  setActiveThemeById,
  saveCustomTheme,
  resetToFactoryTheme,
  generateShadeLadder,
  getContrastRatio,
  generateThemeCssBlock,
  onThemeChange,
  applyThemeToDocument,
  getAllThemes,
} from '../utils/themeSystem';

interface StageThemeColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeApplied?: (theme: ThemePalette) => void;
}

export const StageThemeColorModal: React.FC<StageThemeColorModalProps> = ({
  isOpen,
  onClose,
  onThemeApplied,
}) => {
  // Current active theme
  const [currentTheme, setCurrentTheme] = useState<ThemePalette>(getActiveTheme());
  // Active modal tab: 'presets' | 'customizer' | 'stages' | 'simulator' | 'export'
  const [activeTab, setActiveTab] = useState<'presets' | 'customizer' | 'stages' | 'simulator' | 'export'>('presets');
  
  // Customizer state (local working draft)
  const [draftTheme, setDraftTheme] = useState<ThemePalette>(getActiveTheme());
  const [selectedFoundationKey, setSelectedFoundationKey] = useState<'dominant' | 'surface' | 'lightPista' | 'softPista' | 'forest'>('forest');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [selectedShadeStep, setSelectedShadeStep] = useState<number | null>(null);
  
  // Stage matrix state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stageSearch, setStageSearch] = useState<string>('');
  const [interactiveStageKey, setInteractiveStageKey] = useState<string>('CONFIRMED');
  
  // Feedback states
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync on mount and listen to theme updates
  useEffect(() => {
    const unsub = onThemeChange((updated) => {
      setCurrentTheme(updated);
    });
    const active = getActiveTheme();
    setCurrentTheme(active);
    setDraftTheme(active);
    setIsDirty(false);
    return () => unsub();
  }, [isOpen]);

  // Escape key handler to save and close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleSaveAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, draftTheme]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, label?: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHex(text);
    showToast(label ? `Copied ${label} to clipboard!` : 'Copied to clipboard!');
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const getFoundationLabel = (key: 'dominant' | 'surface' | 'lightPista' | 'softPista' | 'forest'): string => {
    switch (key) {
      case 'dominant': return 'Canvas Background';
      case 'surface': return 'Card & Header Surface';
      case 'lightPista': return 'Accent & Active Pill';
      case 'softPista': return 'Sidebar & Soft Border';
      case 'forest': return 'Forest / Primary Brand';
    }
  };

  // Switch to a preset theme
  const handleSelectPreset = (preset: ThemePalette) => {
    setActiveTheme(preset);
    setCurrentTheme(preset);
    setDraftTheme(preset);
    setIsDirty(false);
    if (onThemeApplied) onThemeApplied(preset);
    showToast(`✓ Applied "${preset.name}" across software & mobile simulator!`);
  };

  // Apply & permanently save customizations
  const handleSaveAndClose = () => {
    const custom: ThemePalette = {
      ...draftTheme,
      id: draftTheme.id.startsWith('custom_') ? draftTheme.id : `custom_${Date.now()}`,
      name: draftTheme.name.includes('(Customized)') ? draftTheme.name : `${draftTheme.name.split('(')[0].trim()} (Customized)`,
      isCustom: true,
    };
    saveCustomTheme(custom);
    setCurrentTheme(custom);
    if (onThemeApplied) onThemeApplied(custom);
    setIsDirty(false);
    showToast('✓ Color shade customizations saved and applied!');
    onClose();
  };

  // Revert changes if discarded
  const handleCancelAndClose = () => {
    if (isDirty) {
      applyThemeToDocument(currentTheme);
      setDraftTheme(currentTheme);
      setIsDirty(false);
    }
    onClose();
  };

  // Apply draft customizations live without closing
  const handleApplyDraft = () => {
    const custom: ThemePalette = {
      ...draftTheme,
      id: draftTheme.id.startsWith('custom_') ? draftTheme.id : `custom_${Date.now()}`,
      name: draftTheme.name.includes('(Customized)') ? draftTheme.name : `${draftTheme.name.split('(')[0].trim()} (Customized)`,
      isCustom: true,
    };
    saveCustomTheme(custom);
    setCurrentTheme(custom);
    if (onThemeApplied) onThemeApplied(custom);
    setIsDirty(false);
    showToast('✓ Custom color palette applied and saved!');
  };

  // Reset to factory defaults
  const handleResetDefault = () => {
    const defaultTheme = resetToFactoryTheme();
    setCurrentTheme(defaultTheme);
    setDraftTheme(defaultTheme);
    setIsDirty(false);
    if (onThemeApplied) onThemeApplied(defaultTheme);
    showToast('✓ Reset to Default Pista & Forest theme!');
  };

  // User selects a shade step directly from the ladder
  const handleSelectShadeStep = (stepHex: string, stepNumber: number) => {
    setSelectedShadeStep(stepNumber);
    const updated: ThemePalette = {
      ...draftTheme,
      id: draftTheme.id.startsWith('custom_') ? draftTheme.id : `custom_${Date.now()}`,
      name: draftTheme.name.includes('(Customized)') ? draftTheme.name : `${draftTheme.name.split('(')[0].trim()} (Customized)`,
      isCustom: true,
      brand: {
        ...draftTheme.brand,
        [selectedFoundationKey]: stepHex,
      },
    };
    setDraftTheme(updated);
    setCurrentTheme(updated);
    setIsDirty(true);
    // Real-time live application AND permanent save
    saveCustomTheme(updated);
    if (onThemeApplied) onThemeApplied(updated);
    showToast(`✓ Shade ${stepNumber} (${stepHex}) saved & applied to ${getFoundationLabel(selectedFoundationKey)}!`);
  };

  // User explicitly assigns shade to a designated role
  const handleAssignShadeToRole = (
    roleKey: 'dominant' | 'surface' | 'lightPista' | 'softPista' | 'forest',
    stepHex: string,
    stepNumber?: number
  ) => {
    const updated: ThemePalette = {
      ...draftTheme,
      id: draftTheme.id.startsWith('custom_') ? draftTheme.id : `custom_${Date.now()}`,
      name: draftTheme.name.includes('(Customized)') ? draftTheme.name : `${draftTheme.name.split('(')[0].trim()} (Customized)`,
      isCustom: true,
      brand: {
        ...draftTheme.brand,
        [roleKey]: stepHex,
      },
    };
    setDraftTheme(updated);
    setCurrentTheme(updated);
    setIsDirty(true);
    saveCustomTheme(updated);
    if (onThemeApplied) onThemeApplied(updated);
    showToast(`✓ Assigned & saved ${stepHex} for ${getFoundationLabel(roleKey)}!`);
  };

  // Color modification helper
  const handleUpdateBrandColor = (
    key: 'dominant' | 'surface' | 'lightPista' | 'softPista' | 'forest',
    val: string
  ) => {
    const updated: ThemePalette = {
      ...draftTheme,
      id: draftTheme.id.startsWith('custom_') ? draftTheme.id : `custom_${Date.now()}`,
      name: draftTheme.name.includes('(Customized)') ? draftTheme.name : `${draftTheme.name.split('(')[0].trim()} (Customized)`,
      isCustom: true,
      brand: {
        ...draftTheme.brand,
        [key]: val,
      },
    };
    setDraftTheme(updated);
    setCurrentTheme(updated);
    setIsDirty(true);
    saveCustomTheme(updated);
    if (onThemeApplied) onThemeApplied(updated);
  };

  const handleUpdateSemanticColor = (
    statusKey: 'success' | 'warning' | 'error' | 'info' | 'neutral',
    field: 'bgHex' | 'textHex' | 'indicatorHex' | 'borderHex',
    val: string
  ) => {
    const updated: ThemePalette = {
      ...draftTheme,
      semantic: {
        ...draftTheme.semantic,
        [statusKey]: {
          ...draftTheme.semantic[statusKey],
          [field]: val,
        },
      },
    };
    setDraftTheme(updated);
    setIsDirty(true);
    applyThemeToDocument(updated);
  };

  // Filter stages
  const categories = [
    { id: 'ALL', label: 'All Stages' },
    { id: 'ORDER', label: 'Order Lifecycle (8)' },
    { id: 'PAYMENT', label: 'Payments & Settlement (5)' },
    { id: 'COLD_CHAIN', label: 'Cold-Chain (3)' },
    { id: 'SERVICE', label: 'Service Desk & FSE (6)' },
    { id: 'MAINTENANCE', label: 'Maintenance (4)' },
  ];

  const allStages: StageColorDefinition[] = [
    ...ORDER_LIFECYCLE_STAGES,
    ...PAYMENT_STAGES,
    ...COLD_CHAIN_STAGES,
    ...SERVICE_ENGINEER_STAGES,
    ...PREVENTIVE_MAINTENANCE_STAGES,
  ];

  const getFilteredStages = (): StageColorDefinition[] => {
    let list: StageColorDefinition[] = [];
    switch (selectedCategory) {
      case 'ORDER':
        list = ORDER_LIFECYCLE_STAGES;
        break;
      case 'PAYMENT':
        list = PAYMENT_STAGES;
        break;
      case 'COLD_CHAIN':
        list = COLD_CHAIN_STAGES;
        break;
      case 'SERVICE':
        list = SERVICE_ENGINEER_STAGES;
        break;
      case 'MAINTENANCE':
        list = PREVENTIVE_MAINTENANCE_STAGES;
        break;
      default:
        list = allStages;
    }

    if (stageSearch.trim()) {
      const q = stageSearch.toLowerCase().trim();
      return list.filter(
        s =>
          s.stageName.toLowerCase().includes(q) ||
          s.stageKey.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const filteredStages = getFilteredStages();
  const currentInteractiveStage =
    ORDER_LIFECYCLE_STAGES.find((s) => s.stageKey === interactiveStageKey) || ORDER_LIFECYCLE_STAGES[2];

  // Selected foundation color for shade ladder
  const activeFoundationHex = draftTheme.brand[selectedFoundationKey];
  const shadeLadder = generateShadeLadder(activeFoundationHex);
  const contrastWithCanvas = getContrastRatio(draftTheme.brand.forest, draftTheme.brand.dominant);

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleSaveAndClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[94vh] border transition-colors duration-300 cursor-default"
        style={{
          backgroundColor: currentTheme.brand.dominant,
          borderColor: currentTheme.brand.lightPista,
          color: currentTheme.brand.forest,
        }}
      >
        {/* ================================================================= */}
        {/* Top Header Banner */}
        {/* ================================================================= */}
        <div 
          className="px-6 py-4 flex items-center justify-between border-b flex-shrink-0 text-white transition-colors duration-300"
          style={{
            backgroundColor: currentTheme.brand.forest,
            borderColor: currentTheme.brand.forest,
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-md border"
              style={{
                backgroundColor: currentTheme.brand.lightPista,
                color: currentTheme.brand.forest,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  A2Z Stage & Workflow Color System
                </h2>
                <span 
                  className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full tracking-wider border"
                  style={{
                    backgroundColor: currentTheme.brand.lightPista,
                    color: currentTheme.brand.forest,
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  Harmonized Palette
                </span>
              </div>
              <p className="text-xs opacity-90 text-white/80">
                Active Theme: <strong>{currentTheme.name}</strong> &bull; Harmonized multi-palette engine & stage workflow colors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch Dropdown */}
            <div className="relative hidden sm:block">
              <select
                value={currentTheme.id}
                onChange={(e) => {
                  const applied = setActiveThemeById(e.target.value);
                  setCurrentTheme(applied);
                  setDraftTheme(applied);
                  setIsDirty(false);
                  if (onThemeApplied) onThemeApplied(applied);
                  showToast(`✓ Switched to "${applied.name}"!`);
                }}
                className="appearance-none px-3 py-1.5 pr-8 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer"
                title="Change Color Theme"
              >
                {getAllThemes().map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-900 bg-white">
                    {t.name} {t.isCustom ? '(Custom)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Explicit Done & Save Button */}
            <button
              onClick={handleSaveAndClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs border border-white/20"
              title="Save changes and close color console"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>

            <button
              onClick={handleSaveAndClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Save & Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div 
            className="px-4 py-2 border-b text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200"
            style={{
              backgroundColor: currentTheme.brand.lightPista,
              color: currentTheme.brand.forest,
              borderColor: currentTheme.brand.lightPista,
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-xs underline cursor-pointer opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* Tab Navigation Bar */}
        {/* ================================================================= */}
        <div 
          className="px-6 py-2.5 border-b flex items-center gap-2 overflow-x-auto flex-shrink-0"
          style={{
            backgroundColor: currentTheme.brand.surface,
            borderColor: currentTheme.brand.lightPista,
          }}
        >
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'presets'
                ? 'shadow-xs font-black'
                : 'opacity-70 hover:opacity-100 hover:bg-white/40'
            }`}
            style={{
              backgroundColor: activeTab === 'presets' ? currentTheme.brand.forest : 'transparent',
              color: activeTab === 'presets' ? currentTheme.brand.dominant : currentTheme.brand.forest,
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme Presets ({getAllThemes().length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customizer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'customizer'
                ? 'shadow-xs font-black'
                : 'opacity-70 hover:opacity-100 hover:bg-white/40'
            }`}
            style={{
              backgroundColor: activeTab === 'customizer' ? currentTheme.brand.forest : 'transparent',
              color: activeTab === 'customizer' ? currentTheme.brand.dominant : currentTheme.brand.forest,
            }}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize & Edit Color Shades</span>
          </button>

          <button
            onClick={() => setActiveTab('stages')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'stages'
                ? 'shadow-xs font-black'
                : 'opacity-70 hover:opacity-100 hover:bg-white/40'
            }`}
            style={{
              backgroundColor: activeTab === 'stages' ? currentTheme.brand.forest : 'transparent',
              color: activeTab === 'stages' ? currentTheme.brand.dominant : currentTheme.brand.forest,
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stage & Workflow Matrix (26)</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'shadow-xs font-black'
                : 'opacity-70 hover:opacity-100 hover:bg-white/40'
            }`}
            style={{
              backgroundColor: activeTab === 'simulator' ? currentTheme.brand.forest : 'transparent',
              color: activeTab === 'simulator' ? currentTheme.brand.dominant : currentTheme.brand.forest,
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Stage Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'export'
                ? 'shadow-xs font-black'
                : 'opacity-70 hover:opacity-100 hover:bg-white/40'
            }`}
            style={{
              backgroundColor: activeTab === 'export' ? currentTheme.brand.forest : 'transparent',
              color: activeTab === 'export' ? currentTheme.brand.dominant : currentTheme.brand.forest,
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSS Variables & Tokens</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* Modal Body */}
        {/* ================================================================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* =============================================================== */}
          {/* TAB 1: THEME PRESETS (7 CLINICAL PALETTES) */}
          {/* =============================================================== */}
          {activeTab === 'presets' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Available Healthcare & Clinical Color Theme Selections
                  </h3>
                  <p className="text-xs opacity-75 mt-0.5">
                    Select any theme below to instantly transform both the ERP/CRM software and the Customer Mobile App.
                  </p>
                </div>
                <button
                  onClick={handleResetDefault}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 hover:bg-black/5 transition cursor-pointer self-start sm:self-auto"
                  style={{ borderColor: currentTheme.brand.lightPista }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Pista & Forest
                </button>
              </div>

              {/* Grid of Preset Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAllThemes().map((preset) => {
                  const isActive = currentTheme.id === preset.id;
                  const contrast = getContrastRatio(preset.brand.forest, preset.brand.dominant);

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`rounded-2xl p-4.5 border transition shadow-xs flex flex-col justify-between space-y-3.5 cursor-pointer relative overflow-hidden ${
                        isActive ? 'ring-2 shadow-md' : 'hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: preset.brand.surface,
                        borderColor: isActive ? preset.brand.forest : preset.brand.lightPista,
                      }}
                    >
                      {/* Top Bar with Name & Status */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-white/70" style={{ color: preset.brand.forest }}>
                              {preset.category.replace('_', ' ')}
                            </span>
                            <h4 className="text-sm font-black mt-1" style={{ color: preset.brand.forest }}>
                              {preset.name}
                            </h4>
                          </div>

                          {isActive ? (
                            <span 
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-xs"
                              style={{
                                backgroundColor: preset.brand.forest,
                                color: preset.brand.dominant,
                              }}
                            >
                              <Check className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPreset(preset);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border hover:bg-black/5 transition cursor-pointer"
                              style={{
                                borderColor: preset.brand.lightPista,
                                color: preset.brand.forest,
                              }}
                            >
                              Apply
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] leading-snug mt-1.5 opacity-80" style={{ color: preset.typography.textSecondary }}>
                          {preset.tagline}
                        </p>
                      </div>

                      {/* 5 Brand Swatches Bar */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                          Brand Foundation Swatches
                        </span>
                        <div className="grid grid-cols-5 h-7 rounded-xl overflow-hidden border shadow-inner" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                          <div style={{ backgroundColor: preset.brand.dominant }} title={`Canvas: ${preset.brand.dominant}`} />
                          <div style={{ backgroundColor: preset.brand.surface }} title={`Surface: ${preset.brand.surface}`} />
                          <div style={{ backgroundColor: preset.brand.lightPista }} title={`Pill: ${preset.brand.lightPista}`} />
                          <div style={{ backgroundColor: preset.brand.softPista }} title={`Sidebar: ${preset.brand.softPista}`} />
                          <div style={{ backgroundColor: preset.brand.forest }} title={`Forest: ${preset.brand.forest}`} />
                        </div>
                      </div>

                      {/* Semantic Status Dots & Contrast Score */}
                      <div className="pt-2 border-t flex items-center justify-between text-[10px]" style={{ borderColor: preset.brand.lightPista }}>
                        <div className="flex items-center gap-1.5">
                          <span className="opacity-70">Semantic:</span>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.semantic.success.indicatorHex }} title="Success" />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.semantic.warning.indicatorHex }} title="Warning" />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.semantic.error.indicatorHex }} title="Error" />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.semantic.info.indicatorHex }} title="Info" />
                        </div>

                        <span className="font-mono font-bold" style={{ color: preset.brand.forest }}>
                          {contrast.toFixed(1)}:1 (AAA)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: HARMONIZED PALETTE CUSTOMIZER & EDIT COLOR SHADES */}
          {/* =============================================================== */}
          {activeTab === 'customizer' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: currentTheme.brand.lightPista }}>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    Harmonized Palette Customizer (Edit Color Shades & Tokens)
                  </h3>
                  <p className="text-xs opacity-75 mt-0.5">
                    Modify individual color shades, generate harmonic tint/shade ladders, and preview live before saving.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyDraft}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 transition cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: draftTheme.brand.forest }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save & Apply
                  </button>
                  <button
                    onClick={handleSaveAndClose}
                    className="px-4 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 transition cursor-pointer hover:bg-black/5 shadow-2xs"
                    style={{ 
                      borderColor: draftTheme.brand.lightPista,
                      color: draftTheme.brand.forest,
                      backgroundColor: draftTheme.brand.surface,
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Done & Close
                  </button>
                </div>
              </div>

              {/* 1. Core Brand Foundations Inputs */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider mb-2.5">
                  1. Edit Brand Foundation Shades (5 Core Roles)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Dominant Canvas */}
                  <div 
                    onClick={() => setSelectedFoundationKey('dominant')}
                    className={`p-3 rounded-2xl border transition space-y-2 cursor-pointer ${
                      selectedFoundationKey === 'dominant' ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: draftTheme.brand.surface,
                      borderColor: draftTheme.brand.lightPista,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border">
                        Canvas
                      </span>
                      <code className="text-[10px] font-mono font-bold">{draftTheme.brand.dominant}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.brand.dominant}
                        onChange={(e) => handleUpdateBrandColor('dominant', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 shadow-xs"
                      />
                      <input
                        type="text"
                        value={draftTheme.brand.dominant}
                        onChange={(e) => handleUpdateBrandColor('dominant', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-2 py-1 rounded-lg border bg-white"
                      />
                    </div>
                    <span className="text-[9px] opacity-70 block">Main screen background</span>
                  </div>

                  {/* Surface Card */}
                  <div 
                    onClick={() => setSelectedFoundationKey('surface')}
                    className={`p-3 rounded-2xl border transition space-y-2 cursor-pointer ${
                      selectedFoundationKey === 'surface' ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: draftTheme.brand.surface,
                      borderColor: draftTheme.brand.lightPista,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border">
                        Surface
                      </span>
                      <code className="text-[10px] font-mono font-bold">{draftTheme.brand.surface}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.brand.surface}
                        onChange={(e) => handleUpdateBrandColor('surface', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 shadow-xs"
                      />
                      <input
                        type="text"
                        value={draftTheme.brand.surface}
                        onChange={(e) => handleUpdateBrandColor('surface', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-2 py-1 rounded-lg border bg-white"
                      />
                    </div>
                    <span className="text-[9px] opacity-70 block">Card & header surfaces</span>
                  </div>

                  {/* Light Pista / Pill */}
                  <div 
                    onClick={() => setSelectedFoundationKey('lightPista')}
                    className={`p-3 rounded-2xl border transition space-y-2 cursor-pointer ${
                      selectedFoundationKey === 'lightPista' ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: draftTheme.brand.surface,
                      borderColor: draftTheme.brand.lightPista,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border">
                        Accent / Pill
                      </span>
                      <code className="text-[10px] font-mono font-bold">{draftTheme.brand.lightPista}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.brand.lightPista}
                        onChange={(e) => handleUpdateBrandColor('lightPista', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 shadow-xs"
                      />
                      <input
                        type="text"
                        value={draftTheme.brand.lightPista}
                        onChange={(e) => handleUpdateBrandColor('lightPista', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-2 py-1 rounded-lg border bg-white"
                      />
                    </div>
                    <span className="text-[9px] opacity-70 block">Active pills & borders</span>
                  </div>

                  {/* Soft Pista / Sidebar */}
                  <div 
                    onClick={() => setSelectedFoundationKey('softPista')}
                    className={`p-3 rounded-2xl border transition space-y-2 cursor-pointer ${
                      selectedFoundationKey === 'softPista' ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: draftTheme.brand.surface,
                      borderColor: draftTheme.brand.lightPista,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border">
                        Sidebar
                      </span>
                      <code className="text-[10px] font-mono font-bold">{draftTheme.brand.softPista}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.brand.softPista}
                        onChange={(e) => handleUpdateBrandColor('softPista', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 shadow-xs"
                      />
                      <input
                        type="text"
                        value={draftTheme.brand.softPista}
                        onChange={(e) => handleUpdateBrandColor('softPista', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-2 py-1 rounded-lg border bg-white"
                      />
                    </div>
                    <span className="text-[9px] opacity-70 block">Sidebar navigation background</span>
                  </div>

                  {/* Forest Primary */}
                  <div 
                    onClick={() => setSelectedFoundationKey('forest')}
                    className={`p-3 rounded-2xl border transition space-y-2 cursor-pointer ${
                      selectedFoundationKey === 'forest' ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: draftTheme.brand.surface,
                      borderColor: draftTheme.brand.lightPista,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border">
                        Forest / Primary
                      </span>
                      <code className="text-[10px] font-mono font-bold">{draftTheme.brand.forest}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme.brand.forest}
                        onChange={(e) => handleUpdateBrandColor('forest', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-black/10 shadow-xs"
                      />
                      <input
                        type="text"
                        value={draftTheme.brand.forest}
                        onChange={(e) => handleUpdateBrandColor('forest', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-2 py-1 rounded-lg border bg-white"
                      />
                    </div>
                    <span className="text-[9px] opacity-70 block">Buttons & high contrast text</span>
                  </div>
                </div>
              </div>

              {/* 2. Harmonic Tint & Shade Ladder Generator */}
              <div 
                className="p-4 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: draftTheme.brand.surface,
                  borderColor: draftTheme.brand.lightPista,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Harmonic Tint & Shade Ladder ({selectedFoundationKey.toUpperCase()}: {activeFoundationHex})
                    </h4>
                    <p className="text-[11px] opacity-75">
                      Click any generated shade step below to copy its HEX or assign it directly.
                    </p>
                  </div>

                  <span className="text-[11px] font-mono font-bold">
                    WCAG: {contrastWithCanvas.toFixed(1)}:1 Ratio
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                  {shadeLadder.map((step) => {
                    const isActive = activeFoundationHex.toUpperCase() === step.hex.toUpperCase();
                    return (
                      <div
                        key={step.step}
                        onClick={() => handleSelectShadeStep(step.hex, step.step)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between h-24 transition shadow-2xs cursor-pointer ${
                          isActive
                            ? 'ring-3 ring-emerald-500 scale-105 shadow-md font-bold'
                            : 'hover:scale-105 hover:shadow-sm'
                        }`}
                        style={{
                          backgroundColor: step.hex,
                          color: step.isLight ? '#1A2C17' : '#FFFFFF',
                          borderColor: isActive ? '#10B981' : 'rgba(0,0,0,0.15)',
                        }}
                        title={`Click to select Shade ${step.step} (${step.hex}) for ${getFoundationLabel(selectedFoundationKey)}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-black">{step.step}</span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>

                        <code className="text-[9px] font-mono font-bold">{step.hex}</code>

                        {isActive ? (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-700 text-white flex items-center gap-0.5 shadow-xs">
                            <Check className="w-2.5 h-2.5" /> Active
                          </span>
                        ) : (
                          <span className="text-[8px] opacity-80 uppercase font-bold hover:underline">
                            Select Shade
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quick 1-Click Role Assignment Buttons */}
                <div className="pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs" style={{ borderColor: draftTheme.brand.lightPista }}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold opacity-80">
                      Assign Shade ({activeFoundationHex}) to:
                    </span>
                    <button
                      onClick={() => handleAssignShadeToRole('lightPista', activeFoundationHex)}
                      className="px-2 py-1 bg-white hover:bg-black/5 rounded-lg border text-[10px] font-bold transition cursor-pointer"
                      style={{ borderColor: draftTheme.brand.lightPista }}
                    >
                      Accent / Pill
                    </button>
                    <button
                      onClick={() => handleAssignShadeToRole('surface', activeFoundationHex)}
                      className="px-2 py-1 bg-white hover:bg-black/5 rounded-lg border text-[10px] font-bold transition cursor-pointer"
                      style={{ borderColor: draftTheme.brand.lightPista }}
                    >
                      Surface Card
                    </button>
                    <button
                      onClick={() => handleAssignShadeToRole('forest', activeFoundationHex)}
                      className="px-2 py-1 bg-white hover:bg-black/5 rounded-lg border text-[10px] font-bold transition cursor-pointer"
                      style={{ borderColor: draftTheme.brand.lightPista }}
                    >
                      Forest / Primary
                    </button>
                    <button
                      onClick={() => handleAssignShadeToRole('dominant', activeFoundationHex)}
                      className="px-2 py-1 bg-white hover:bg-black/5 rounded-lg border text-[10px] font-bold transition cursor-pointer"
                      style={{ borderColor: draftTheme.brand.lightPista }}
                    >
                      Canvas
                    </button>
                    <button
                      onClick={() => handleAssignShadeToRole('softPista', activeFoundationHex)}
                      className="px-2 py-1 bg-white hover:bg-black/5 rounded-lg border text-[10px] font-bold transition cursor-pointer"
                      style={{ borderColor: draftTheme.brand.lightPista }}
                    >
                      Sidebar
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveAndClose}
                      className="px-3 py-1 rounded-lg text-white text-[10px] font-black transition flex items-center gap-1 cursor-pointer shadow-xs hover:opacity-95"
                      style={{ backgroundColor: draftTheme.brand.forest }}
                    >
                      <Check className="w-3 h-3" />
                      Done & Save Shade
                    </button>
                    <button
                      onClick={() => handleCopy(activeFoundationHex, 'Shade HEX')}
                      className="px-2.5 py-1 rounded-lg border bg-white hover:bg-black/5 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: draftTheme.brand.lightPista }}
                    >
                      <Copy className="w-3 h-3" />
                      Copy HEX
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Semantic UI Colors Customizer */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider">
                  3. Customize Semantic Workflow Status Tokens
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {(['success', 'warning', 'error', 'info', 'neutral'] as const).map((key) => {
                    const token = draftTheme.semantic[key];
                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-2xl border space-y-2.5"
                        style={{
                          backgroundColor: token.bgHex,
                          borderColor: `${token.indicatorHex}50`,
                          color: token.textHex,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {token.label.split('/')[0]}
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: token.indicatorHex }} />
                        </div>

                        {/* Background Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase opacity-80 block">Background</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={token.bgHex}
                              onChange={(e) => handleUpdateSemanticColor(key, 'bgHex', e.target.value)}
                              className="w-6 h-6 rounded-md cursor-pointer border"
                            />
                            <input
                              type="text"
                              value={token.bgHex}
                              onChange={(e) => handleUpdateSemanticColor(key, 'bgHex', e.target.value)}
                              className="w-full text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border"
                            />
                          </div>
                        </div>

                        {/* Text Color Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase opacity-80 block">Text</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={token.textHex}
                              onChange={(e) => handleUpdateSemanticColor(key, 'textHex', e.target.value)}
                              className="w-6 h-6 rounded-md cursor-pointer border"
                            />
                            <input
                              type="text"
                              value={token.textHex}
                              onChange={(e) => handleUpdateSemanticColor(key, 'textHex', e.target.value)}
                              className="w-full text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border"
                            />
                          </div>
                        </div>

                        {/* Indicator Dot Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase opacity-80 block">Dot / Border</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={token.indicatorHex}
                              onChange={(e) => {
                                handleUpdateSemanticColor(key, 'indicatorHex', e.target.value);
                                handleUpdateSemanticColor(key, 'borderHex', e.target.value);
                              }}
                              className="w-6 h-6 rounded-md cursor-pointer border"
                            />
                            <input
                              type="text"
                              value={token.indicatorHex}
                              onChange={(e) => {
                                handleUpdateSemanticColor(key, 'indicatorHex', e.target.value);
                                handleUpdateSemanticColor(key, 'borderHex', e.target.value);
                              }}
                              className="w-full text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: WORKFLOW & STAGE MATRIX (26 STAGES) */}
          {/* =============================================================== */}
          {activeTab === 'stages' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Complete Diagnostic Workflow Stage Matrix ({filteredStages.length} Stages)
                  </h3>
                  <p className="text-xs opacity-75 mt-0.5">
                    Covers Order Lifecycles, Payments, Cold-Chain Telemetry, Service Desk, and Equipment PM.
                  </p>
                </div>

                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="Filter stages by name or key..."
                  value={stageSearch}
                  onChange={(e) => setStageSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs border bg-white"
                  style={{ borderColor: currentTheme.brand.lightPista }}
                />
              </div>

              {/* Category Filter Pills */}
              <div 
                className="flex items-center gap-1.5 p-1 rounded-2xl overflow-x-auto"
                style={{ backgroundColor: currentTheme.brand.surface }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'font-black shadow-xs'
                        : 'opacity-70 hover:opacity-100 hover:bg-white/40'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === cat.id ? currentTheme.brand.forest : 'transparent',
                      color: selectedCategory === cat.id ? currentTheme.brand.dominant : currentTheme.brand.forest,
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Stage Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredStages.map((stage) => {
                  const isSelected = stage.stageKey === interactiveStageKey;
                  return (
                    <div
                      key={stage.stageKey}
                      onClick={() => setInteractiveStageKey(stage.stageKey)}
                      className={`p-4 rounded-2xl border transition shadow-2xs space-y-2.5 cursor-pointer ${
                        isSelected ? 'ring-2' : 'hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: currentTheme.brand.surface,
                        borderColor: isSelected ? currentTheme.brand.forest : currentTheme.brand.lightPista,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-lg border flex items-center gap-1.5"
                              style={{
                                backgroundColor: stage.badge.bgHex,
                                color: stage.badge.textHex,
                                borderColor: stage.badge.borderHex,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.badge.dotHex }} />
                              {stage.stageName}
                            </span>
                            <span className="text-[9px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-black/5">
                              {stage.category}
                            </span>
                          </div>
                          <code className="text-[10px] font-mono font-bold block opacity-75">
                            Key: {stage.stageKey}
                          </code>
                        </div>

                        {/* Swatch Preview */}
                        <div
                          className="w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shadow-2xs"
                          style={{
                            backgroundColor: stage.badge.bgHex,
                            borderColor: stage.badge.borderHex,
                            color: stage.badge.textHex,
                          }}
                        >
                          ✓
                        </div>
                      </div>

                      <p className="text-[11px] leading-relaxed opacity-85">
                        {stage.description}
                      </p>

                      <div className="pt-2 border-t flex items-center justify-between text-[10px] font-mono" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <span>
                          BG: <strong>{stage.badge.bgHex}</strong> &bull; TX: <strong>{stage.badge.textHex}</strong>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(`BG: ${stage.badge.bgHex}, Text: ${stage.badge.textHex}, Border: ${stage.badge.borderHex}`, stage.stageName);
                          }}
                          className="px-2 py-0.5 rounded hover:bg-black/10 transition cursor-pointer font-bold"
                        >
                          Copy CSS
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: INTERACTIVE STAGE FLOW SIMULATOR */}
          {/* =============================================================== */}
          {activeTab === 'simulator' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Interactive Diagnostic Order Lifecycle Simulator
                </h3>
                <p className="text-xs opacity-75 mt-0.5">
                  Click through the sequential milestones to inspect live UI transformation and badge contracts.
                </p>
              </div>

              {/* Stepper Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {ORDER_LIFECYCLE_STAGES.map((s, idx) => {
                  const isActive = s.stageKey === interactiveStageKey;
                  return (
                    <button
                      key={s.stageKey}
                      onClick={() => setInteractiveStageKey(s.stageKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        isActive ? 'shadow-xs font-black' : 'border opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: isActive ? currentTheme.brand.forest : currentTheme.brand.surface,
                        color: isActive ? currentTheme.brand.dominant : currentTheme.brand.forest,
                        borderColor: currentTheme.brand.lightPista,
                      }}
                    >
                      <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center bg-white/20">
                        {idx + 1}
                      </span>
                      <span>{s.stageName.split('/')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Preview Card */}
              <div 
                className="p-5 rounded-3xl border shadow-md space-y-4"
                style={{
                  backgroundColor: currentTheme.brand.surface,
                  borderColor: currentTheme.brand.lightPista,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: currentTheme.brand.lightPista }}>
                  <div>
                    <div className="text-[10px] font-mono opacity-70 uppercase font-bold">Live Order Payload</div>
                    <h4 className="text-sm font-black">
                      Apollo Diagnostic & Research Hub &bull; PO-9281-BIOCHEM
                    </h4>
                  </div>

                  <span
                    className="px-3 py-1 text-xs font-black uppercase rounded-xl border flex items-center gap-1.5 shadow-xs"
                    style={{
                      backgroundColor: currentInteractiveStage.badge.bgHex,
                      color: currentInteractiveStage.badge.textHex,
                      borderColor: currentInteractiveStage.badge.borderHex,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentInteractiveStage.badge.dotHex }} />
                    {currentInteractiveStage.stageName}
                  </span>
                </div>

                <p className="text-xs leading-relaxed opacity-85">
                  {currentInteractiveStage.description}
                </p>

                {/* Simulated Order Items */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-white border text-xs" style={{ borderColor: currentTheme.brand.lightPista }}>
                    <div className="text-[9px] opacity-70 uppercase font-bold">Reagent</div>
                    <div className="font-bold mt-0.5">cobas Troponin T Kit</div>
                    <div className="text-[10px] font-mono mt-0.5 opacity-80">Lot: TP-9921 &bull; 2°C - 8°C</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border text-xs" style={{ borderColor: currentTheme.brand.lightPista }}>
                    <div className="text-[9px] opacity-70 uppercase font-bold">Settlement</div>
                    <div className="font-bold mt-0.5">Credit Facility Line</div>
                    <div className="text-[10px] font-mono mt-0.5 opacity-80">30 Days Terms Approved</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border text-xs" style={{ borderColor: currentTheme.brand.lightPista }}>
                    <div className="text-[9px] opacity-70 uppercase font-bold">Telemetry</div>
                    <div className="font-bold mt-0.5">IoT Cold Chain Active</div>
                    <div className="text-[10px] font-mono mt-0.5 opacity-80">4.2°C Stabilized (Pass)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 5: CSS & TOKEN EXPORT */}
          {/* =============================================================== */}
          {activeTab === 'export' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Download className="w-4 h-4" />
                    CSS Variables & Token Export for Application
                  </h3>
                  <p className="text-xs opacity-75 mt-0.5">
                    Copy the standard CSS root token block to apply across stylesheets.
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(generateThemeCssBlock(currentTheme), 'CSS Root Variables')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  style={{ backgroundColor: currentTheme.brand.forest }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Exact :root Block
                </button>
              </div>

              <pre 
                className="p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[360px] border leading-relaxed bg-black/90 text-emerald-400 shadow-inner"
              >
                {generateThemeCssBlock(currentTheme)}
              </pre>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* Modal Footer */}
        {/* ================================================================= */}
        <div 
          className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs flex-shrink-0"
          style={{
            backgroundColor: currentTheme.brand.surface,
            borderColor: currentTheme.brand.lightPista,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentTheme.brand.forest }} />
            <span>
              Theme Status: <strong>{currentTheme.name}</strong> ({currentTheme.brand.forest} &bull; {currentTheme.brand.lightPista})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleCancelAndClose}
                className="px-3 py-1.5 rounded-xl font-bold border hover:bg-black/5 transition cursor-pointer text-xs"
                style={{ borderColor: currentTheme.brand.lightPista }}
              >
                Discard Changes
              </button>
            )}

            <button
              onClick={() => {
                const nextIdx = (THEME_PRESETS.findIndex(t => t.id === currentTheme.id) + 1) % THEME_PRESETS.length;
                handleSelectPreset(THEME_PRESETS[nextIdx]);
              }}
              className="px-3 py-1.5 rounded-xl font-bold border hover:bg-black/5 transition cursor-pointer flex items-center gap-1 text-xs"
              style={{ borderColor: currentTheme.brand.lightPista }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Cycle Theme Preset
            </button>

            <button
              onClick={handleSaveAndClose}
              className="px-6 py-2 text-white font-black rounded-xl transition cursor-pointer shadow-md hover:opacity-95 flex items-center gap-1.5 text-xs"
              style={{ backgroundColor: draftTheme.brand.forest }}
            >
              <Check className="w-4 h-4" />
              Save & Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
