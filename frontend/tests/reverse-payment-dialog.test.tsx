import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReversePaymentDialog } from '@/components/app/reverse-payment-dialog';
import { Toaster } from '@/components/ui/toaster';

describe('ReversePaymentDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits a full reversal without a caller-supplied amount', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'reversal-id' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <Toaster>
          <ReversePaymentDialog
            open
            onOpenChange={() => undefined}
            onSuccess={() => undefined}
            payment={{ id: 'payment-id', receipt_no: 'REC-1', amount: '500.00', mode: 'cash' }}
          />
        </Toaster>
      </QueryClientProvider>
    );

    expect(screen.queryByText(/partial amount/i)).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/duplicate payment/i), {
      target: { value: 'Duplicate receipt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reverse Payment' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/payments/payment-id/reverse',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reason: 'Duplicate receipt' }),
      })
    );
  });
});
