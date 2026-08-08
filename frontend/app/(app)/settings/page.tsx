'use client';

import { useState } from 'react';
import { AlertTriangle, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppShell } from '@/components/app/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';
import { AcademicRollover } from './academic-rollover';

type ImportFieldKey =
  | 'serial_no'
  | 'student_code'
  | 'name'
  | 'class_name'
  | 'expected_fee'
  | 'payment_period'
  | 'joined_date'
  | 'billing_start_period'
  | 'billing_end_period'
  | 'school_name'
  | 'date_of_birth'
  | 'gender'
  | 'contact_no'
  | 'father_phone'
  | 'mother_phone'
  | 'whatsapp_no'
  | 'father_name'
  | 'mother_name'
  | 'father_occupation'
  | 'mother_occupation'
  | 'hobbies'
  | 'address'
  | 'student_email';

type StudentImportMapping = Record<ImportFieldKey, string>;

type ImportPreview = {
  headers: string[];
  suggested_mapping: Partial<Record<ImportFieldKey, string | null>>;
  sample_rows: Array<Record<string, string | null>>;
  required_fields: ImportFieldKey[];
};

type DatabaseResetResult = {
  students_deleted: number;
  payments_deleted: number;
  billing_periods_deleted: number;
  fee_records_deleted: number;
  receipt_sequence_reset: boolean;
  billing_cycle_reset_to_default: boolean;
};

type RandomBillField = {
  id: string;
  label: string;
  value: string;
};

const RESET_CONFIRMATION_TEXT = 'DELETE ALL DATA';
const IMPORT_FIELD_META: Array<{ key: ImportFieldKey; label: string; hint: string }> = [
  { key: 'serial_no', label: 'Serial No', hint: 'Map the source serial / row number column.' },
  { key: 'student_code', label: 'Roll No', hint: 'Student roll number or student code.' },
  { key: 'name', label: 'Student Name', hint: 'Full student name.' },
  { key: 'class_name', label: 'Class', hint: 'Class or standard.' },
  { key: 'school_name', label: 'School', hint: 'School name.' },
  { key: 'date_of_birth', label: 'D.O.B', hint: 'Date of birth.' },
  { key: 'joined_date', label: 'D.O.Join', hint: 'Student joining/admission date.' },
  { key: 'gender', label: 'Sex', hint: 'Male or Female.' },
  { key: 'contact_no', label: 'Contact No', hint: 'Student contact number.' },
  { key: 'father_phone', label: 'Father Phone', hint: 'Father phone number.' },
  { key: 'mother_phone', label: 'Mother Phone', hint: 'Mother phone number.' },
  { key: 'whatsapp_no', label: 'WhatsApp No', hint: 'WhatsApp number.' },
  { key: 'father_name', label: 'Father Name', hint: 'Father full name.' },
  { key: 'mother_name', label: 'Mother Name', hint: 'Mother full name.' },
  { key: 'father_occupation', label: 'Father Occupation', hint: 'Father occupation.' },
  { key: 'mother_occupation', label: 'Mother Occupation', hint: 'Mother occupation.' },
  { key: 'hobbies', label: 'Hobbies', hint: 'Student hobbies.' },
  { key: 'address', label: 'Address', hint: 'Full address.' },
  { key: 'student_email', label: 'Email', hint: 'Student email address.' },
  { key: 'expected_fee', label: 'Fee', hint: 'Single-month fee amount.' },
  { key: 'payment_period', label: 'Period', hint: 'Monthly, Quarterly, Half Yearly.' },
  { key: 'billing_start_period', label: 'Batch Start', hint: 'Billing start month (e.g. 6 for June).' },
  { key: 'billing_end_period', label: 'Batch End', hint: 'Billing end month (e.g. 5 for May).' },
];
function createRandomBillField(): RandomBillField {
  return {
    id: Math.random().toString(36).slice(2, 10),
    label: '',
    value: ''
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [randomBillOpen, setRandomBillOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'create_only'>('upsert');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMapping, setImportMapping] = useState<StudentImportMapping>({
    serial_no: '',
    student_code: '',
    name: '',
    class_name: '',
    expected_fee: '',
    payment_period: '',
    joined_date: '',
    billing_start_period: '',
    billing_end_period: '',
    school_name: '',
    date_of_birth: '',
    gender: '',
    contact_no: '',
    father_phone: '',
    mother_phone: '',
    whatsapp_no: '',
    father_name: '',
    mother_name: '',
    father_occupation: '',
    mother_occupation: '',
    hobbies: '',
    address: '',
    student_email: '',
  });
  const [importBatch, setImportBatch] = useState('');
  const [resetText, setResetText] = useState('');
  const [randomBillFileName, setRandomBillFileName] = useState('');
  const [randomBillFields, setRandomBillFields] = useState<RandomBillField[]>(() => [
    { id: 'bill-no', label: 'Bill No', value: '' },
    { id: 'student', label: 'Student', value: '' },
    { id: 'amount', label: 'Amount', value: '' }
  ]);
  const importStudents = useMutation({
    mutationFn: async () => {
      if (!importFile) throw new Error('Please choose an .xlsx file');
      if (!importBatch.trim()) throw new Error('Please enter the batch value');
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('mapping_json', JSON.stringify(importMapping));
      fd.append('batch', importBatch.trim());

      const res = await fetch(`/api/backend/students/import?mode=${encodeURIComponent(importMode)}`, {
        method: 'POST',
        body: fd,
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail ? JSON.stringify(data.detail) : 'Import failed');
      return data as { created: number; updated: number; fee_updated: number };
    },
    onSuccess: (data) => {
      toast({
        title: 'Import completed',
        description: `Created: ${data.created}, Updated: ${data.updated}, Fee updated: ${data.fee_updated}`
      });
      setImportOpen(false);
      setImportFile(null);
      setImportPreview(null);
      setImportBatch('');
      setImportMapping({
        serial_no: '',
        student_code: '',
        name: '',
        class_name: '',
        expected_fee: '',
        payment_period: '',
        joined_date: '',
        billing_start_period: '',
        billing_end_period: '',
        school_name: '',
        date_of_birth: '',
        gender: '',
        contact_no: '',
        father_phone: '',
        mother_phone: '',
        whatsapp_no: '',
        father_name: '',
        mother_name: '',
        father_occupation: '',
        mother_occupation: '',
        hobbies: '',
        address: '',
        student_email: '',
      });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast({ title: 'Import failed', description: String(e) })
  });

  const previewImport = useMutation({
    mutationFn: async () => {
      if (!importFile) throw new Error('Please choose an .xlsx file');
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await fetch('/api/backend/students/import/preview', {
        method: 'POST',
        body: fd,
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail ? JSON.stringify(data.detail) : 'Preview failed');
      return data as ImportPreview;
    },
    onSuccess: (data) => {
      setImportPreview(data);
      // Auto-map from backend suggestions
      const sm = data.suggested_mapping;
      setImportMapping({
        serial_no: sm.serial_no ?? '',
        student_code: sm.student_code ?? '',
        name: sm.name ?? '',
        class_name: sm.class_name ?? '',
        expected_fee: sm.expected_fee ?? '',
        payment_period: sm.payment_period ?? '',
        joined_date: sm.joined_date ?? '',
        billing_start_period: sm.billing_start_period ?? '',
        billing_end_period: sm.billing_end_period ?? '',
        school_name: sm.school_name ?? '',
        date_of_birth: sm.date_of_birth ?? '',
        gender: sm.gender ?? '',
        contact_no: sm.contact_no ?? '',
        father_phone: sm.father_phone ?? '',
        mother_phone: sm.mother_phone ?? '',
        whatsapp_no: sm.whatsapp_no ?? '',
        father_name: sm.father_name ?? '',
        mother_name: sm.mother_name ?? '',
        father_occupation: sm.father_occupation ?? '',
        mother_occupation: sm.mother_occupation ?? '',
        hobbies: sm.hobbies ?? '',
        address: sm.address ?? '',
        student_email: sm.student_email ?? '',
      });
    },
    onError: (e) => toast({ title: 'Preview failed', description: String(e) })
  });

  const resetDatabase = useMutation({
    mutationFn: () =>
      apiFetch<DatabaseResetResult>('/settings/database/reset', {
        method: 'POST',
        body: JSON.stringify({ confirmation_text: resetText })
      }),
    onSuccess: (data) => {
      toast({
        title: 'Operational data deleted',
        description: `Students: ${data.students_deleted}, Payments: ${data.payments_deleted}, Billing periods: ${data.billing_periods_deleted}`
      });
      setResetOpen(false);
      setResetText('');
      qc.invalidateQueries();
    },
    onError: (e) => toast({ title: 'Delete failed', description: String(e) })
  });
  const generateRandomBill = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/backend/settings/random-bill.pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: randomBillFileName.trim() || null,
          fields: randomBillFields.map((field) => ({
            label: field.label.trim(),
            value: field.value.trim()
          }))
        })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.detail ? JSON.stringify(error.detail) : 'Bill generation failed');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${randomBillFileName.trim() || 'random-bill'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    },
    onSuccess: () => {
      toast({ title: 'Bill generated', description: 'The bill PDF has been downloaded.' });
      setRandomBillOpen(false);
      setRandomBillFileName('');
      setRandomBillFields([
        { id: 'bill-no', label: 'Bill No', value: '' },
        { id: 'student', label: 'Student', value: '' },
        { id: 'amount', label: 'Amount', value: '' }
      ]);
    },
    onError: (e) => toast({ title: 'Bill generation failed', description: String(e) })
  });

  const isImportReady =
    importPreview !== null &&
    IMPORT_FIELD_META.every((field) => importMapping[field.key].trim() !== '') &&
    /^\d{4}\s*-\s*\d{4}$/.test(importBatch.trim());
  const isRandomBillReady =
    randomBillFields.length > 0 &&
    randomBillFields.every((field) => field.label.trim() !== '' && field.value.trim() !== '');

  return (
    <AppShell title="Admin Settings" subtitle="Manage student imports and maintenance.">
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Student Import */}
        <Card className="shadow-none">
          <CardContent className="p-4 space-y-3">
            <CardTitle>Student Import</CardTitle>
            <p className="text-xs text-gray-500">Import students from Excel with column mapping.</p>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" />
              Upload Excel
            </Button>
          </CardContent>
        </Card>

        {/* Random Bill */}
        <Card className="shadow-none">
          <CardContent className="p-4 space-y-3">
            <CardTitle>Bill Generator</CardTitle>
            <p className="text-xs text-gray-500">Create a custom bill PDF with manual fields.</p>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setRandomBillOpen(true)}>
              <FileText className="h-3.5 w-3.5" />
              Create Bill
            </Button>
          </CardContent>
        </Card>

        {/* Academic Rollover */}
        <AcademicRollover />

        {/* Danger Zone */}
        <Card className="shadow-none border-red-100">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-700">Danger Zone</p>
              <p className="text-xs text-gray-500">Delete all students, fees, payments data</p>
            </div>
            <Button variant="destructive" size="sm" className="rounded-lg shrink-0" onClick={() => setResetOpen(true)}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Reset
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Dialog */}
      <Dialog
        open={importOpen}
        onOpenChange={(v) => {
          setImportOpen(v);
          if (!v) {
            setImportFile(null);
            setImportMode('upsert');
            setImportPreview(null);
            setImportBatch('');
            setImportMapping({
              serial_no: '',
              student_code: '',
              name: '',
              class_name: '',
              expected_fee: '',
              payment_period: '',
              joined_date: '',
              billing_start_period: '',
              billing_end_period: '',
              school_name: '',
              date_of_birth: '',
              gender: '',
              contact_no: '',
              father_phone: '',
              mother_phone: '',
              whatsapp_no: '',
              father_name: '',
              mother_name: '',
              father_occupation: '',
              mother_occupation: '',
              hobbies: '',
              address: '',
              student_email: '',
            });
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Import Students (Excel)</DialogTitle>
          </DialogHeader>
          <DialogBody className="max-h-[78vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Upload an <span className="font-medium text-gray-900">.xlsx</span>, load its headers, map the required fields,
                enter the academic <span className="font-medium text-gray-900">batch</span>, then import into the database.
                Student billing will follow each row's mapped <span className="font-medium text-gray-900">Start Period</span> and <span className="font-medium text-gray-900">End Period</span>.
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-gray-800">Mode</div>
                <select
                  className="h-12 w-full rounded-2xl border border-[rgba(151,164,187,0.14)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-gray-900 outline-none"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as 'upsert' | 'create_only')}
                >
                  <option value="upsert">Upsert (create or update)</option>
                  <option value="create_only">Create only (error if exists)</option>
                </select>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-gray-800">Excel file</div>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="block w-full rounded-2xl border border-[rgba(151,164,187,0.16)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm text-[var(--text)] file:mr-4 file:rounded-xl file:border-0 file:bg-[#2f6fed] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#255ed1]"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportPreview(null);
                  }}
                />
              </div>

              <div className="rounded-2xl border border-[rgba(151,164,187,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Column Mapping</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Load the file headers first, then confirm which source column maps to each required app field.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => previewImport.mutate()}
                    disabled={previewImport.isPending || !importFile}
                  >
                    {previewImport.isPending ? <Spinner className="mr-2" /> : null}
                    Load Headers
                  </Button>
                </div>

                {importPreview ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {IMPORT_FIELD_META.map((field) => (
                        <div key={field.key}>
                          <div className="mb-2 text-sm font-medium text-gray-800">{field.label}</div>
                          <select
                            className="h-12 w-full rounded-2xl border border-[rgba(151,164,187,0.14)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-gray-900 outline-none"
                            value={importMapping[field.key]}
                            onChange={(e) =>
                              setImportMapping((current) => ({
                                ...current,
                                [field.key]: e.target.value
                              }))
                            }
                          >
                            <option value="">Select a column</option>
                            {importPreview.headers.map((header) => (
                              <option key={`${field.key}-${header}`} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                          <div className="mt-1 text-xs text-gray-600">{field.hint}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-medium text-gray-800">Batch</div>
                      <Input
                        value={importBatch}
                        onChange={(e) => setImportBatch(e.target.value)}
                        placeholder="2026-2027"
                      />
                      <div className="mt-1 text-xs text-gray-600">
                        Enter the academic batch for all imported rows, for example <span className="text-gray-900">2026-2027</span>. Each student's
                        mapped <span className="text-gray-900">Start Period</span> and <span className="text-gray-900">End Period</span> will control that student's billing range.
                      </div>
                    </div>

                    {importPreview.sample_rows.length ? (
                      <div>
                        <div className="mb-2 text-sm font-medium text-gray-800">Sample Preview</div>
                        <div className="max-h-72 overflow-auto rounded-2xl border border-[rgba(151,164,187,0.12)]">
                          <table className="min-w-full text-left text-sm text-gray-800">
                            <thead className="bg-[rgba(255,255,255,0.03)] text-xs uppercase tracking-[0.18em] text-gray-600">
                              <tr>
                                {importPreview.headers.map((header) => (
                                  <th key={header} className="px-3 py-3 font-medium">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {importPreview.sample_rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-t border-[rgba(151,164,187,0.08)]">
                                  {importPreview.headers.map((header) => (
                                    <td key={`${rowIndex}-${header}`} className="px-3 py-3 text-gray-600">
                                      {row[header] ?? '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => importStudents.mutate()} disabled={importStudents.isPending || !isImportReady}>
              {importStudents.isPending ? <Spinner className="mr-2" /> : null}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={randomBillOpen}
        onOpenChange={(v) => {
          setRandomBillOpen(v);
          if (!v) {
            setRandomBillFileName('');
            setRandomBillFields([
              { id: 'bill-no', label: 'Bill No', value: '' },
              { id: 'student', label: 'Student', value: '' },
              { id: 'amount', label: 'Amount', value: '' }
            ]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Random Bill Generator</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="text-sm text-gray-600">
              Add the exact bill fields you want. You can create new label/value rows and the PDF will use those rows directly.
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-gray-800">File Name</div>
              <Input value={randomBillFileName} onChange={(e) => setRandomBillFileName(e.target.value)} placeholder="random-bill" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-800">Bill Fields</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRandomBillFields((current) => [...current, createRandomBillField()])}
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>
              {randomBillFields.map((field) => (
                <div key={field.id} className="grid gap-3 md:grid-cols-[0.42fr_0.48fr_auto]">
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      setRandomBillFields((current) =>
                        current.map((item) => (item.id === field.id ? { ...item, label: e.target.value } : item))
                      )
                    }
                    placeholder="Label"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) =>
                      setRandomBillFields((current) =>
                        current.map((item) => (item.id === field.id ? { ...item, value: e.target.value } : item))
                      )
                    }
                    placeholder="Value"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRandomBillFields((current) =>
                        current.length === 1 ? [createRandomBillField()] : current.filter((item) => item.id !== field.id)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRandomBillOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => generateRandomBill.mutate()} disabled={generateRandomBill.isPending || !isRandomBillReady}>
              {generateRandomBill.isPending ? <Spinner className="mr-2" /> : null}
              Generate & Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetOpen}
        onOpenChange={(v) => {
          setResetOpen(v);
          if (!v) {
            setResetText('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entire Operational Dataset</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <div className="rounded-2xl border border-[rgba(255,108,127,0.24)] bg-[rgba(217,58,86,0.08)] p-4 text-sm text-red-700">
                This action permanently removes students, fees, payments, and billing periods. It cannot be undone.
              </div>
              <div className="text-sm text-gray-600">
                To confirm, type <span className="font-semibold text-gray-900">{RESET_CONFIRMATION_TEXT}</span>.
              </div>
              <Input
                value={resetText}
                onChange={(e) => setResetText(e.target.value)}
                placeholder={RESET_CONFIRMATION_TEXT}
                autoComplete="off"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => resetDatabase.mutate()}
              disabled={resetDatabase.isPending || resetText.trim() !== RESET_CONFIRMATION_TEXT}
            >
              {resetDatabase.isPending ? <Spinner className="mr-2" /> : null}
              Delete Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
