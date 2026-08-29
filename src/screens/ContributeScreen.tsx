import { useState, useRef } from 'react';
import { Screen, ContributionType, SubmissionData } from '../types';
import { CAUSES } from '../data';

interface ContributeScreenProps {
  causeId: string;
  navigate: (to: Screen, causeId?: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onSuccess: (data: SubmissionData) => void;
}

const quickAmounts = [500, 1000, 2500];

export default function ContributeScreen({ causeId, navigate, showToast, onSuccess }: ContributeScreenProps) {
  const cause = CAUSES.find((c) => c.id === causeId);
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ContributionType>('economica');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState(false);
  const [itemDesc, setItemDesc] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!cause) return null;

  function handleAmountChip(val: number) {
    setAmount(String(val));
    setCustomAmount(false);
  }

  function handleCustomAmount() {
    setCustomAmount(true);
    setAmount('');
  }

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFileName(files[0].name);
    setUploadState('uploading');
    setTimeout(() => setUploadState('done'), 1400);
  }

  function canProceedStep1() {
    if (type === 'economica') return Number(amount) >= 1;
    return itemDesc.trim().length > 0 && quantity >= 1;
  }

  function canProceedStep2() {
    return name.trim().length > 0 && email.includes('@');
  }

  async function handleSubmit() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const id = 'SHT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    onSuccess({
      causeTitle: cause!.title,
      type,
      amount: type === 'economica' ? Number(amount) : undefined,
      item: type === 'especie' ? itemDesc : undefined,
      quantity: type === 'especie' ? quantity : undefined,
      donorName: anonymous ? 'Aportador Anónimo' : name,
      anonymous,
      submissionId: id,
      submittedAt: new Date().toISOString(),
    });
  }

  const stepLabels = ['Aporte', 'Identidad', 'Comprobante'];

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="px-4 pt-3 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={[
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                      done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground',
                    ].join(' ')}
                  >
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : num}
                  </div>
                  <span className={`text-[11px] font-medium truncate ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-px ${done ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Cause reference */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60">
          <div
            className="w-10 h-10 rounded-lg bg-surface overflow-hidden shrink-0"
          >
            <img src={cause.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Para la causa</p>
            <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {cause.title}
            </p>
          </div>
        </div>

        {/* Step 1: Contribution type + amount */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-up">
            {/* Type selector */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">
                Tipo de aporte
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['economica', 'especie'] as ContributionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={[
                      'py-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95',
                      type === t
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border text-muted-foreground hover:border-foreground/30',
                    ].join(' ')}
                  >
                    {t === 'economica' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">💳</span>
                        <span>Económico</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">📦</span>
                        <span>En especie</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {type === 'economica' && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">
                  Monto
                </label>
                {/* Quick chips */}
                <div className="flex gap-2 mb-3">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAmountChip(val)}
                      className={[
                        'flex-1 h-10 rounded-lg border text-xs font-semibold transition-all active:scale-95',
                        amount === String(val) && !customAmount
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-foreground/30',
                      ].join(' ')}
                    >
                      ${val.toLocaleString()}
                    </button>
                  ))}
                  <button
                    onClick={handleCustomAmount}
                    className={[
                      'flex-1 h-10 rounded-lg border text-xs font-semibold transition-all active:scale-95',
                      customAmount
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-foreground/30',
                    ].join(' ')}
                  >
                    Otro
                  </button>
                </div>
                {/* Currency input */}
                <div
                  className="flex items-center gap-2 rounded-xl border bg-card px-4 h-14 transition-all focus-within:border-primary"
                  style={{ borderColor: 'rgba(51,65,85,0.8)' }}
                >
                  <span className="text-xs text-muted-foreground font-semibold shrink-0">$ MXN</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setCustomAmount(true); }}
                    placeholder="0"
                    className="flex-1 bg-transparent font-financial text-xl font-bold text-foreground outline-none placeholder-muted-foreground/40"
                    min="1"
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}

            {type === 'especie' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">
                    Descripción del artículo
                  </label>
                  <input
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Ej: Despensas, cobijas, ropa..."
                    className="w-full h-12 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder-muted-foreground/40 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                      className="w-10 h-10 rounded-full bg-surface border border-border text-foreground text-lg font-bold flex items-center justify-center active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="font-financial text-2xl font-bold text-foreground w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((v) => v + 1)}
                      className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold flex items-center justify-center active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Identity */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">
                Nombre completo o alias
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre o un alias"
                className="w-full h-12 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder-muted-foreground/40 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">
                Correo electrónico
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="tu@correo.com"
                className="w-full h-12 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder-muted-foreground/40 focus:border-primary transition-colors"
                inputMode="email"
              />
            </div>

            {/* Privacy toggle */}
            <div
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-foreground">Ocultar mi nombre en el Ledger público</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  El administrador puede ver tu identidad de forma privada, pero el público solo verá &quot;Aportador Anónimo&quot;.
                </p>
              </div>
              <button
                onClick={() => setAnonymous((v) => !v)}
                className={[
                  'w-11 h-6 rounded-full transition-all shrink-0 relative',
                  anonymous ? 'bg-primary' : 'bg-surface border border-border',
                ].join(' ')}
                aria-pressed={anonymous}
                role="switch"
              >
                <span
                  className={[
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                    anonymous ? 'left-5.5' : 'left-0.5',
                  ].join(' ')}
                  style={{ left: anonymous ? 'calc(100% - 22px)' : '2px' }}
                />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Proof upload */}
        {step === 3 && (
          <div className="space-y-4 animate-slide-up">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Adjunta una captura o foto de tu comprobante de transferencia o entrega de artículos.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {uploadState === 'idle' && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 13V4M10 4L7 7M10 4L13 7" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 14V16C3 16.55 3.45 17 4 17H16C16.55 17 17 16.55 17 16V14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Seleccionar archivo</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Imagen o PDF</p>
                </div>
              </button>
            )}

            {uploadState === 'uploading' && (
              <div className="w-full h-24 rounded-xl border border-border bg-card flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Subiendo comprobante...</span>
              </div>
            )}

            {uploadState === 'done' && (
              <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9L7 12L14 5" stroke="#10B981" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{fileName || 'comprobante.jpg'}</p>
                  <p className="text-xs text-emerald mt-0.5">Subido correctamente</p>
                </div>
                <button
                  onClick={() => { setUploadState('idle'); setFileName(''); }}
                  className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}

            <div className="p-3 rounded-lg bg-surface border border-border/50">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tu aporte aparecerá públicamente en el Ledger solo después de ser verificado por el equipo de Shitan Trust. El proceso toma 24–48 horas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div
        className="flex-none px-4 py-3 border-t border-border/50 bg-background"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((v) => v - 1)}
              className="h-12 px-5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all active:scale-95"
            >
              Atrás
            </button>
          )}
          <button
            onClick={() => {
              if (step < 3) {
                if (step === 1 && !canProceedStep1()) {
                  showToast('Ingresa un monto o artículo válido', 'warning');
                  return;
                }
                if (step === 2 && !canProceedStep2()) {
                  showToast('Ingresa nombre y correo válidos', 'warning');
                  return;
                }
                setStep((v) => v + 1);
              } else {
                if (uploadState !== 'done') {
                  showToast('Adjunta el comprobante para continuar', 'warning');
                  return;
                }
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="flex-1 h-12 rounded-xl text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            }}
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando...</span>
              </div>
            ) : step === 3 ? 'Registrar y enviar comprobante' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
