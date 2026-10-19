'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type InvitationLinkDialogProps = {
  link: string | null;
  onClose: () => void;
};

export function InvitationLinkDialog({ link, onClose }: InvitationLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [link]);

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <Dialog open={!!link} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share invitation link</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Send this private link to the user. It is time-limited and stops working after their password is set.
          </p>
          <Input value={link ?? ''} readOnly aria-label="Invitation link" />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
          <Button onClick={copyLink} disabled={!link}>
            <Copy className="mr-1.5 h-4 w-4" />
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
