'use client';

import { useState, useMemo } from 'react';
import { ArrowRight, Check, GraduationCap, Plus, Trash2, X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';

// --- Types ---

type AcademicYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

type FeeStructure = {
  id: string;
  name: string;
};

type ClassMapping = {
  id: string;
  from_class: string;
  to_class: string;
};

type RolloverResult = {
  promoted: number;
  completed: number;
  arrears_created: number;
  errors: string[];
};

// --- Defaults ---

const DEFAULT_CLASS_MAPPINGS: Omit<ClassMapping, 'id'>[] = [
  { from_class: 'I', to_class: 'II' },
  { from_class: 'II', to_class: 'III' },
  { from_class: 'III', to_class: 'IV' },
  { from_class: 'IV', to_class: 'V' },
  { from_class: 'V', to_class: 'VI' },
  { from_class: 'VI', to_class: 'VII' },
  { from_class: 'VII', to_class: 'VIII' },
  { from_class: 'VIII', to_class: 'IX' },
  { from_class: 'IX', to_class: 'X' },
  { from_class: 'X', to_class: 'XI' },
  { from_class: 'XI', to_class: 'XII' },
];

const DEFAULT_FINAL_YEAR_CLASSES = ['X', 'XII'];

const ROLLOVER_CONFIRMATION_TEXT = 'PROMOTE';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// --- Step Indicator ---

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#2f6fed] text-white'
                  : isCompleted
                    ? 'bg-[rgba(47,111,237,0.2)] text-[#5b9aff]'
                    : 'bg-[rgba(255,255,255,0.06)] text-[#91a1bc]'
              }`}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
            </div>
            <span
              className={`hidden text-xs sm:inline ${
                isActive ? 'font-medium text-white' : 'text-[#91a1bc]'
              }`}
            >
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className="mx-1 h-px w-4 bg-[rgba(151,164,187,0.2)] sm:w-8" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Main Component ---

export function AcademicRollover() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1 state
  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [newBatch, setNewBatch] = useState('');

  // Step 2 state
  const [classMappings, setClassMappings] = useState<ClassMapping[]>(() =>
    DEFAULT_CLASS_MAPPINGS.map((m) => ({ ...m, id: uid() }))
  );
  const [finalYearClasses, setFinalYearClasses] = useState<string[]>(DEFAULT_FINAL_YEAR_CLASSES);
  const [newFinalClass, setNewFinalClass] = useState('');

  // Step 3 state
  const [codePattern] = useState('auto');
  const [updateFees, setUpdateFees] = useState(false);
  const [feeStructureId, setFeeStructureId] = useState('');
  const [carryForwardArrears, setCarryForwardArrears] = useState(true);

  // Step 4 state
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState<RolloverResult | null>(null);

  // Data fetching
  const { data: academicYears = [], isLoading: loadingYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic'),
    enabled: open,
  });

  const { data: feeStructures = [], isLoading: loadingFees } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => apiFetch<FeeStructure[]>('/fees/structures'),
    enabled: open && updateFees,
  });

  // Mutation
  const rolloverMutation = useMutation({
    mutationFn: () =>
      apiFetch<RolloverResult>('/utils/academic-rollover', {
        method: 'POST',
        body: JSON.stringify({
          from_academic_year_id: fromYearId,
          to_academic_year_id: toYearId,
          class_mappings: classMappings.map(({ from_class, to_class }) => ({ from_class, to_class })),
          new_batch: newBatch.trim(),
          code_pattern: codePattern,
          update_fees: updateFees,
          fee_structure_id: updateFees && feeStructureId ? feeStructureId : null,
          final_year_classes: finalYearClasses,
          carry_forward_arrears: carryForwardArrears,
        }),
      }),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: 'Rollover completed', description: `${data.promoted} students promoted successfully.` });
    },
    onError: (e) => toast({ title: 'Rollover failed', description: String(e) }),
  });

  // Derived
  const fromYear = academicYears.find((y) => y.id === fromYearId);
  const toYear = academicYears.find((y) => y.id === toYearId);

  const step1Valid = fromYearId && toYearId && fromYearId !== toYearId && newBatch.trim().length > 0;
  const step2Valid = classMappings.length > 0 && classMappings.every((m) => m.from_class.trim() && m.to_class.trim());
  const step3Valid = true;

  const codePreview = useMemo(() => {
    return [
      { class: 'VI', roll: 1, code: '0601' },
      { class: 'VI', roll: 2, code: '0602' },
      { class: 'IX', roll: 15, code: '0915' },
    ];
  }, []);

  function resetWizard() {
    setStep(1);
    setFromYearId('');
    setToYearId('');
    setNewBatch('');
    setClassMappings(DEFAULT_CLASS_MAPPINGS.map((m) => ({ ...m, id: uid() })));
    setFinalYearClasses(DEFAULT_FINAL_YEAR_CLASSES);
    setNewFinalClass('');
    setUpdateFees(false);
    setFeeStructureId('');
    setCarryForwardArrears(true);
    setConfirmText('');
    setResult(null);
  }

  function handleOpen() {
    resetWizard();
    setOpen(true);
  }

  function addMapping() {
    setClassMappings((prev) => [...prev, { id: uid(), from_class: '', to_class: '' }]);
  }

  function removeMapping(id: string) {
    setClassMappings((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMapping(id: string, field: 'from_class' | 'to_class', value: string) {
    setClassMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  function addFinalYearClass() {
    const cls = newFinalClass.trim();
    if (cls && !finalYearClasses.includes(cls)) {
      setFinalYearClasses((prev) => [...prev, cls]);
    }
    setNewFinalClass('');
  }

  function removeFinalYearClass(cls: string) {
    setFinalYearClasses((prev) => prev.filter((c) => c !== cls));
  }

  // --- Step Renderers ---

  function renderStep1() {
    return (
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-medium text-[#dbe6ff]">From Academic Year</div>
          <Select value={fromYearId} onChange={(e) => setFromYearId(e.target.value)} disabled={loadingYears}>
            <option value="">Select source year</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name} {y.is_current ? '(Current)' : ''}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-[#dbe6ff]">To Academic Year</div>
          <Select value={toYearId} onChange={(e) => setToYearId(e.target.value)} disabled={loadingYears}>
            <option value="">Select target year</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name} {y.is_current ? '(Current)' : ''}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-[#dbe6ff]">New Batch</div>
          <Input
            value={newBatch}
            onChange={(e) => setNewBatch(e.target.value)}
            placeholder="2026-2027"
          />
          <div className="mt-1 text-xs text-[#91a1bc]">
            The batch label assigned to all promoted students.
          </div>
        </div>

        {loadingYears && (
          <div className="flex items-center gap-2 text-sm text-[#91a1bc]">
            <Spinner /> Loading academic years...
          </div>
        )}
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-[#dbe6ff]">Class Promotions</div>
            <Button type="button" variant="outline" size="sm" onClick={addMapping}>
              <Plus className="h-3.5 w-3.5" />
              Add Mapping
            </Button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {classMappings.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={m.from_class}
                  onChange={(e) => updateMapping(m.id, 'from_class', e.target.value)}
                  placeholder="From (e.g. VI)"
                />
                <ArrowRight className="h-4 w-4 shrink-0 text-[#91a1bc]" />
                <Input
                  className="flex-1"
                  value={m.to_class}
                  onChange={(e) => updateMapping(m.id, 'to_class', e.target.value)}
                  placeholder="To (e.g. VII)"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMapping(m.id)}
                  disabled={classMappings.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-[#dbe6ff]">Final Year Classes</div>
          <div className="text-xs text-[#91a1bc] mb-2">
            Students in these classes will be marked as &lsquo;completed&rsquo; instead of promoted.
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {finalYearClasses.map((cls) => (
              <Badge key={cls} variant="accent" className="gap-1 pr-1">
                {cls}
                <button
                  type="button"
                  className="ml-1 rounded-sm p-0.5 hover:bg-[rgba(255,255,255,0.1)]"
                  onClick={() => removeFinalYearClass(cls)}
                  aria-label={`Remove ${cls}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newFinalClass}
              onChange={(e) => setNewFinalClass(e.target.value)}
              placeholder="Add class (e.g. X)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFinalYearClass();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addFinalYearClass}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-medium text-[#dbe6ff]">Student Code Pattern</div>
          <div className="theme-subtle-surface rounded-[14px] px-4 py-3 text-sm text-[#91a1bc]">
            <div className="mb-2">
              Student codes will be generated as <span className="text-white font-medium">ClassNo + SerialNo</span> (e.g., 0601 = Class 6, Roll 1)
            </div>
            <div className="space-y-1 text-xs">
              {codePreview.map((p) => (
                <div key={p.code}>
                  Class {p.class}, Roll {p.roll} → <span className="font-mono text-white">{p.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={updateFees}
              onChange={(e) => setUpdateFees(e.target.checked)}
              className="h-4 w-4 rounded border-[rgba(151,164,187,0.3)] bg-[rgba(255,255,255,0.04)] text-[#2f6fed] focus:ring-[#2f6fed]"
            />
            <span className="text-sm text-[#dbe6ff]">Update fees from fee structure</span>
          </label>

          {updateFees && (
            <div className="ml-7">
              <Select value={feeStructureId} onChange={(e) => setFeeStructureId(e.target.value)} disabled={loadingFees}>
                <option value="">Select fee structure</option>
                {feeStructures.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name}
                  </option>
                ))}
              </Select>
              {loadingFees && (
                <div className="mt-1 flex items-center gap-2 text-xs text-[#91a1bc]">
                  <Spinner /> Loading fee structures...
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={carryForwardArrears}
              onChange={(e) => setCarryForwardArrears(e.target.checked)}
              className="h-4 w-4 rounded border-[rgba(151,164,187,0.3)] bg-[rgba(255,255,255,0.04)] text-[#2f6fed] focus:ring-[#2f6fed]"
            />
            <span className="text-sm text-[#dbe6ff]">Carry forward pending arrears</span>
          </label>
        </div>
      </div>
    );
  }

  function renderStep4() {
    if (result) {
      return (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-[rgba(47,111,237,0.3)] bg-[rgba(47,111,237,0.08)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Check className="h-4 w-4 text-[#5b9aff]" />
              Rollover Completed
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] bg-[rgba(255,255,255,0.04)] p-3 text-center">
              <div className="text-2xl font-bold text-white">{result.promoted}</div>
              <div className="text-xs text-[#91a1bc]">Promoted</div>
            </div>
            <div className="rounded-[14px] bg-[rgba(255,255,255,0.04)] p-3 text-center">
              <div className="text-2xl font-bold text-white">{result.completed}</div>
              <div className="text-xs text-[#91a1bc]">Completed</div>
            </div>
            <div className="rounded-[14px] bg-[rgba(255,255,255,0.04)] p-3 text-center">
              <div className="text-2xl font-bold text-white">{result.arrears_created}</div>
              <div className="text-xs text-[#91a1bc]">Arrears</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-[14px] border border-[rgba(255,108,127,0.24)] bg-[rgba(217,58,86,0.08)] p-3">
              <div className="mb-1 text-xs font-semibold text-[#ff8a9c]">Errors ({result.errors.length})</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {result.errors.map((err, i) => (
                  <div key={i} className="text-xs text-[#ffd9df]">{err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-[14px] border border-[rgba(151,164,187,0.12)] bg-[rgba(255,255,255,0.03)] p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">From</span>
            <span className="text-white font-medium">{fromYear?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">To</span>
            <span className="text-white font-medium">{toYear?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">New Batch</span>
            <span className="text-white font-medium">{newBatch || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">Classes Promoted</span>
            <span className="text-white font-medium">{classMappings.length} mappings</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">Final Year Classes</span>
            <span className="text-white font-medium">{finalYearClasses.join(', ') || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">Code Pattern</span>
            <span className="text-white font-medium">Auto (ClassNo + Serial)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">Update Fees</span>
            <span className="text-white font-medium">{updateFees ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#91a1bc]">Carry Forward Arrears</span>
            <span className="text-white font-medium">{carryForwardArrears ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Confirmation */}
        <div className="rounded-[14px] border border-[rgba(255,108,127,0.24)] bg-[rgba(217,58,86,0.08)] p-4">
          <div className="text-sm text-[#ffd9df]">
            This will promote all students according to the mappings above.
            This action cannot be easily undone.
          </div>
          <div className="mt-3 text-sm text-[#91a1bc]">
            Type <span className="font-semibold text-white">{ROLLOVER_CONFIRMATION_TEXT}</span> to confirm.
          </div>
          <Input
            className="mt-2"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={ROLLOVER_CONFIRMATION_TEXT}
            autoComplete="off"
          />
        </div>
      </div>
    );
  }

  // --- Render ---

  const steps = ['Years', 'Mappings', 'Options', 'Execute'];

  return (
    <>
      <Card className="shadow-none">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#5b9aff]" />
              <h3 className="theme-heading text-base font-semibold">Academic Year Rollover</h3>
            </div>
            <div className="text-sm text-[#91a1bc]">
              Promote students to the next academic year, reassign classes, update codes, and optionally carry forward arrears.
            </div>
          </div>
          <div className="theme-subtle-surface rounded-[18px] px-4 py-3 text-sm text-[#91a1bc]">
            Use this at the start of a new academic year to bulk-promote students and generate fresh billing data.
          </div>
          <Button variant="outline" className="h-10 rounded-xl" onClick={handleOpen}>
            <GraduationCap className="h-4 w-4" />
            Start Rollover Wizard
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetWizard();
          setOpen(v);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Academic Year Rollover</DialogTitle>
          </DialogHeader>

          <div className="border-b border-[var(--panel-line)] px-5 py-3">
            <StepIndicator currentStep={step} steps={steps} />
          </div>

          <DialogBody className="max-h-[60vh] overflow-y-auto">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </DialogBody>

          <DialogFooter>
            {result ? (
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                    Back
                  </Button>
                )}
                {step < 4 && (
                  <Button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={
                      (step === 1 && !step1Valid) ||
                      (step === 2 && !step2Valid) ||
                      (step === 3 && !step3Valid)
                    }
                  >
                    Next
                  </Button>
                )}
                {step === 4 && !result && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => rolloverMutation.mutate()}
                    disabled={
                      rolloverMutation.isPending ||
                      confirmText.trim() !== ROLLOVER_CONFIRMATION_TEXT
                    }
                  >
                    {rolloverMutation.isPending ? <Spinner className="mr-2" /> : null}
                    Execute Rollover
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
