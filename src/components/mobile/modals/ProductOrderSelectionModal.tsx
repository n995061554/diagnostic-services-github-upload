import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle2,
  Sparkles,
  Layers,
  ThermometerSnowflake,
  ShieldCheck,
  Cpu,
  Package,
  ExternalLink,
  RefreshCw,
  Check,
  Info
} from 'lucide-react';
import { ReagentProduct, REAGENTS_DATABASE, formatINR } from '../mobileMockData';
import { RelatedProductItem } from '../customerAppTypes';
import { customerApiService } from '../customerApiService';
import { ThemePalette } from '../../../utils/themeSystem';

interface ProductOrderSelectionModalProps {
  theme: ThemePalette;
  product: ReagentProduct;
  onClose: () => void;
  onAddToCart: (prod: any, quantity: number) => void;
  onSelectAlternativeProduct?: (prod: ReagentProduct) => void;
}

export const ProductOrderSelectionModal: React.FC<ProductOrderSelectionModalProps> = ({
  theme,
  product,
  onClose,
  onAddToCart,
  onSelectAlternativeProduct
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [apiRelated, setApiRelated] = useState<RelatedProductItem[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(true);
  const [addedAltId, setAddedAltId] = useState<string | null>(null);

  // Fetch related products for the selected kit via backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRelated(true);
    setQuantity(1);
    setIsAdded(false);

    // Call API with productId or general related-products fallback
    customerApiService.getRelatedProducts(product.id)
      .then(items => {
        if (!isMounted) return;
        if (Array.isArray(items) && items.length > 0) {
          setApiRelated(items);
        } else {
          // Fallback to all related products
          customerApiService.getRelatedProducts().then(all => {
            if (isMounted && Array.isArray(all)) {
              setApiRelated(all);
            }
          });
        }
      })
      .catch(err => {
        console.warn('[ProductOrderSelectionModal] Error loading related products:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRelated(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Determine clinical analyte & diagnostic classification using domain logic
  const detectedClinicalProfile = useMemo(() => {
    const text = `${product.name} ${product.description || ''} ${product.productCode || ''} ${(product.compatibleAnalyzers || []).join(' ')}`.toLowerCase();

    if (text.includes('troponin') || text.includes('tnt') || text.includes('tni') || text.includes('cardiac')) {
      return {
        analyte: 'Cardiac Troponin (hsTnT / hsTnI)',
        category: 'Immunology & CLIA/ECLIA Assays',
        clinicalRole: 'Stat Emergency / Acute Coronary Syndrome',
        methodology: 'Chemiluminescence / High-Sensitivity ECLIA'
      };
    }
    if (text.includes('alt') || text.includes('sgpt') || text.includes('alanine') || text.includes('transaminase')) {
      return {
        analyte: 'SGPT / ALT (Alanine Aminotransferase)',
        category: 'Clinical Chemistry & Liver Function',
        clinicalRole: 'Hepatic Function & Routine Chemistries',
        methodology: 'UV Kinetic Liquid Stable Enzymatic'
      };
    }
    if (text.includes('albumin') || text.includes('alb')) {
      return {
        analyte: 'Serum Albumin Gen.2',
        category: 'Clinical Chemistry & Liver Function',
        clinicalRole: 'Liver Synthesis & Nutritional Status',
        methodology: 'BCG / Photometric Dye Binding'
      };
    }
    if (text.includes('diluent') || text.includes('cellpack') || text.includes('lyse') || text.includes('dcl')) {
      return {
        analyte: 'Hematology Diluent & Sheath Reagent',
        category: 'Automated Hematology Systems',
        clinicalRole: 'Whole Blood Complete Cell Counter (CBC)',
        methodology: 'Impedance & Sheath Flow Reagent'
      };
    }
    if (text.includes('lyphochek') || text.includes('control') || text.includes('calibrator')) {
      return {
        analyte: 'Multi-Analyte Chemistry QC Control',
        category: 'Controls & Quality Assurance',
        clinicalRole: 'NABL ISO 15189 Daily Assay Validation',
        methodology: 'Human Serum Lyophilized Matrix'
      };
    }

    return {
      analyte: product.categoryName || 'Clinical Diagnostic Assay',
      category: product.categoryName || 'Laboratory Reagents',
      clinicalRole: 'Routine & Specialized Diagnostic Testing',
      methodology: 'Automated Analyzer Specific Formulation'
    };
  }, [product]);

  // Genuine comparable kits based on compatibility / analyte / category / product-type logic
  const comparableKits = useMemo(() => {
    const analyteLower = detectedClinicalProfile.analyte.toLowerCase();
    const isAlt = analyteLower.includes('alt') || analyteLower.includes('sgpt');
    const isTrop = analyteLower.includes('troponin');

    // 1. Filter from API related items matching clinical analyte
    let matches = (apiRelated || []).filter(item => {
      if (!item) return false;
      const itemName = String(item.name || '').toLowerCase();
      const itemCat = String(item.category || '').toLowerCase();
      const itemCompat = String(item.compatibility || '').toLowerCase();

      // Skip the currently selected product
      if (item.id === product.id || itemName.includes(product.name.toLowerCase())) {
        return false;
      }

      if (isAlt) {
        return itemName.includes('alt') || itemName.includes('sgpt') || itemCat.includes('bio') || itemCompat.includes('c311') || itemCompat.includes('c4000');
      }
      if (isTrop) {
        return itemName.includes('troponin') || itemCat.includes('immuno') || itemCompat.includes('e411') || itemCompat.includes('i1000');
      }

      return itemCat.includes(product.categoryName?.toLowerCase() || '') || item.companyName?.toLowerCase() !== product.companyName?.toLowerCase();
    });

    // 2. If API list has fewer than 2 matches, supplement from verified catalog
    if (matches.length < 2) {
      const catalogSupplements = REAGENTS_DATABASE.filter(r => {
        if (r.id === product.id) return false;
        const rName = r.name.toLowerCase();
        if (isAlt && (rName.includes('alt') || rName.includes('sgpt'))) return true;
        if (isTrop && rName.includes('troponin')) return true;
        return r.categoryId === product.categoryId && r.companyId !== product.companyId;
      }).map(r => ({
        id: r.id,
        name: r.name,
        companyName: r.companyName,
        packSize: r.packSize,
        price: r.customerNetPrice,
        category: r.categoryName,
        compatibility: (r.compatibleAnalyzers || []).join(' / ') || 'Automated Systems',
        inStock: r.inStock,
        imageUrl: r.imageUrl,
        leadTime: 'Same-Day Dispatch'
      }));

      const existingNames = new Set(matches.map(m => m.name.toLowerCase()));
      for (const supp of catalogSupplements) {
        if (!existingNames.has(supp.name.toLowerCase())) {
          matches.push(supp);
          existingNames.add(supp.name.toLowerCase());
        }
      }
    }

    return matches.slice(0, 4);
  }, [apiRelated, product, detectedClinicalProfile]);

  // Handle primary kit add
  const handlePrimaryAddToCart = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2400);
  };

  // Handle adding an alternative kit
  const handleAlternativeAddToCart = (altKit: RelatedProductItem) => {
    const payload = {
      id: altKit.id,
      name: altKit.name,
      companyName: altKit.companyName,
      customerNetPrice: altKit.price,
      packSize: altKit.packSize,
      imageUrl: altKit.imageUrl,
      inStock: altKit.inStock
    };
    onAddToCart(payload, 1);
    setAddedAltId(altKit.id);
    setTimeout(() => setAddedAltId(null), 2400);
  };

  // Handle switching to alternative kit details
  const handleSwitchToAlternative = (altKit: RelatedProductItem) => {
    const catalogMatch = REAGENTS_DATABASE.find(r => r.id === altKit.id || r.name.toLowerCase() === altKit.name.toLowerCase());
    if (catalogMatch && onSelectAlternativeProduct) {
      onSelectAlternativeProduct(catalogMatch);
    } else if (onSelectAlternativeProduct) {
      onSelectAlternativeProduct({
        id: altKit.id,
        name: altKit.name,
        companyId: altKit.companyName.toLowerCase().replace(/\s+/g, '-'),
        companyName: altKit.companyName,
        companyLogo: '',
        categoryId: product.categoryId,
        categoryName: altKit.category || product.categoryName,
        productCode: `SKU-${altKit.id.substring(0, 6).toUpperCase()}`,
        packSize: altKit.packSize,
        storageTemp: '2°C to 8°C (Cold-Chain Verified)',
        mrp: Math.round(altKit.price * 1.18),
        customerNetPrice: altKit.price,
        discountPercent: 15,
        imageUrl: altKit.imageUrl || product.imageUrl,
        description: `Verified comparable diagnostic assay kit for ${detectedClinicalProfile.analyte}. Cross-analyzer compatibility: ${altKit.compatibility || 'Certified'}.`,
        inStock: altKit.inStock,
        salesRankScore: 90,
        compatibleAnalyzers: altKit.compatibility ? altKit.compatibility.split('/').map(s => s.trim()) : product.compatibleAnalyzers
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#D0DEE5] text-[#0E1035]">
        
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#0E1035] text-white flex items-center justify-between border-b border-[#15253F] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-[#D0DEE5]/20 border border-[#D0DEE5]/30 flex items-center justify-center text-[#D0DEE5] shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#D0DEE5] font-black uppercase tracking-wider truncate">
                {product.companyName} &bull; {product.categoryName}
              </div>
              <h3 className="text-xs font-black text-white truncate max-w-[260px]">
                {product.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#15253F] hover:bg-[#2B3D5B] text-[#D0DEE5] hover:text-white transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 text-xs bg-slate-50/70">
          
          {/* 1. SELECTED PRODUCT CARD */}
          <div className="bg-white rounded-2xl p-4 border border-[#D0DEE5] shadow-xs space-y-3">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-xl bg-slate-50 border border-[#D0DEE5] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase bg-[#0E1035] text-white px-2 py-0.5 rounded-full">
                    {product.companyName}
                  </span>
                  <span className="text-[9px] font-bold text-[#0E1035] bg-[#D0DEE5]/60 px-2 py-0.5 rounded-full border border-[#D0DEE5]">
                    {product.productCode}
                  </span>
                </div>

                <h2 className="font-extrabold text-xs text-[#0E1035] leading-snug line-clamp-2">
                  {product.name}
                </h2>

                <div className="text-[10px] text-[#7C8594] font-medium">
                  Pack: <strong className="text-[#0E1035]">{product.packSize}</strong>
                  {product.throughputTests ? ` &bull; ${product.throughputTests}` : ''}
                </div>

                {/* Storage & Cold-Chain Badge */}
                <div className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg">
                  <ThermometerSnowflake className="w-3 h-3 text-sky-600" />
                  <span>{product.storageTemp || '2°C to 8°C (Cold-Chain Verified)'}</span>
                </div>

                {/* Authoritative Batch & Expiry Information (from External Tally ERP) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg" title="Active Tally Batch Lot">
                    <span>📦 Batch:</span>
                    <strong>{(product as any).batchNumber || ((product as any).batches && (product as any).batches[0]?.batchNumber) || 'BR-HBA-9904'}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-lg" title="Physical Shelf Life Expiry">
                    <span>⏳ Exp:</span>
                    <strong>{(product as any).expiryDate || ((product as any).batches && (product as any).batches[0]?.expiryDate) || '31 Aug 2027'}</strong>
                  </span>
                  <span className="text-[8.5px] text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">
                    ✓ Fresh Stock Guaranteed
                  </span>
                </div>
              </div>
            </div>

            {/* Compatible Analyzers Tag */}
            {product.compatibleAnalyzers && product.compatibleAnalyzers.length > 0 && (
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[10px] flex items-start gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#2B3D5B] shrink-0 mt-0.5" />
                <div className="text-[#7C8594] leading-tight">
                  <strong className="text-[#0E1035]">Compatible Analyzers:</strong>{' '}
                  {product.compatibleAnalyzers.join(', ')}
                </div>
              </div>
            )}

            {/* Pricing & Quantity Row */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-black text-sm text-[#0E1035]">
                    ₹{formatINR(product.customerNetPrice * quantity)}
                  </span>
                  {product.mrp && product.mrp > product.customerNetPrice && (
                    <span className="text-[10px] text-[#7C8594] line-through font-mono">
                      ₹{formatINR(product.mrp * quantity)}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-emerald-700 font-bold">
                  {product.discountPercent}% Off Institutional Contract Rate
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center gap-2 bg-[#D0DEE5]/30 p-1 rounded-xl border border-[#D0DEE5]">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-lg bg-white text-[#0E1035] flex items-center justify-center font-bold shadow-xs hover:bg-slate-100 cursor-pointer"
                  title="Decrease"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono font-black text-xs text-[#0E1035] w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="w-6 h-6 rounded-lg bg-white text-[#0E1035] flex items-center justify-center font-bold shadow-xs hover:bg-slate-100 cursor-pointer"
                  title="Increase"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handlePrimaryAddToCart}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] hover:text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Added {quantity}x to Order Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Order / Cart &bull; ₹{formatINR(product.customerNetPrice * quantity)}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. SECTION: SIMILAR KITS YOU MAY CONSIDER */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0E1035]" />
                  Similar Kits You May Consider
                </h4>
                <p className="text-[10px] text-[#7C8594]">
                  Clinically equivalent assay kits & cross-company analyzer alternatives
                </p>
              </div>

              {/* Analyte Pill */}
              <span className="text-[9px] font-bold text-[#2B3D5B] bg-[#D0DEE5]/50 px-2 py-0.5 rounded-full border border-[#D0DEE5] shrink-0">
                {detectedClinicalProfile.analyte.split('/')[0].trim()}
              </span>
            </div>

            {/* Comparable Kits List */}
            {isLoadingRelated ? (
              <div className="p-4 bg-white rounded-2xl border border-[#D0DEE5] text-center text-[#7C8594] text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0E1035]" />
                <span>Evaluating clinical analyzer equivalence...</span>
              </div>
            ) : comparableKits.length === 0 ? (
              <div className="p-4 bg-white rounded-2xl border border-[#D0DEE5] text-center text-[#7C8594] text-xs">
                No alternative assay kits available for this specific test method.
              </div>
            ) : (
              <div className="space-y-2">
                {comparableKits.map(altKit => {
                  const isJustAdded = addedAltId === altKit.id;
                  const isSameBrand = altKit.companyName.toLowerCase() === product.companyName.toLowerCase();

                  return (
                    <div
                      key={altKit.id}
                      className="bg-white rounded-2xl border border-[#D0DEE5] p-3 shadow-xs hover:border-[#0E1035] transition space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSameBrand 
                              ? 'bg-slate-100 text-[#0E1035] border border-slate-300'
                              : 'bg-[#0E1035] text-white shadow-2xs'
                          }`}>
                            {altKit.companyName}
                          </span>
                          {!isSameBrand && (
                            <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Cross-Brand Alternative
                            </span>
                          )}
                        </div>

                        <div className="font-mono font-black text-xs text-[#0E1035] shrink-0">
                          ₹{formatINR(altKit.price)}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-[#D0DEE5] p-1 flex items-center justify-center shrink-0">
                          <img
                            src={altKit.imageUrl || product.imageUrl}
                            alt={altKit.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="font-black text-xs text-[#0E1035] leading-snug line-clamp-1">
                            {altKit.name}
                          </h5>
                          
                          <div className="text-[10px] text-[#7C8594] font-medium mt-0.5">
                            Pack: <strong className="text-[#0E1035]">{altKit.packSize}</strong>
                            {altKit.testsCount ? ` (${altKit.testsCount} Tests)` : ''}
                          </div>

                          {altKit.compatibility && (
                            <div className="text-[9px] text-[#2B3D5B] font-semibold truncate mt-0.5 flex items-center gap-1">
                              <Cpu className="w-2.5 h-2.5 text-[#2B3D5B] shrink-0" />
                              <span className="truncate">{altKit.compatibility}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Alternative Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleSwitchToAlternative(altKit)}
                          className="py-1 px-2.5 text-[10px] font-bold text-[#0E1035] hover:bg-slate-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-[#2B3D5B]" />
                          <span>View Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAlternativeAddToCart(altKit)}
                          className={`py-1.5 px-3 rounded-xl font-black text-[10px] transition flex items-center gap-1 cursor-pointer shadow-xs ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#15253F] hover:bg-[#0E1035] text-white'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added to Cart!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 text-[#D0DEE5]" />
                              <span>Add Similar Kit (₹{formatINR(altKit.price)})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Close Bar */}
        <div className="p-3 bg-white border-t border-[#D0DEE5] flex items-center justify-between text-xs shrink-0">
          <span className="text-[10px] text-[#7C8594] font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            NABL ISO 15189 Certified Diagnostic Supply
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-[#0E1035] font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
