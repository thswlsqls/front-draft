"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fetchAdminDetail } from "@/lib/admin-api";
import { useToast } from "@/contexts/toast-context";
import type { AdminResponse } from "@/types/admin";

interface DetailDialogProps {
  adminId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); // HH:mm
  return `${date} ${time}`;
}

export function DetailDialog({
  adminId,
  open,
  onOpenChange,
}: DetailDialogProps) {
  const { showToast } = useToast();
  const [admin, setAdmin] = useState<AdminResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || adminId === null) {
      setAdmin(null);
      return;
    }
    setLoading(true);
    fetchAdminDetail(adminId)
      .then(setAdmin)
      .catch(() => {
        showToast("Failed to load account details.", "error");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, adminId, showToast, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Detail</DialogTitle>
          <DialogDescription>Administrator account information.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-[#3B82F6]" />
          </div>
        ) : admin ? (
          <dl className="space-y-3">
            {([
              ["ID", String(admin.id)],
              ["Email", admin.email],
              ["Username", admin.username],
            ] as const).map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-4">
                <dt className="w-24 shrink-0 text-sm font-bold text-gray-500">
                  {label}
                </dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}

            <div className="flex items-center gap-4">
              <dt className="w-24 shrink-0 text-sm font-bold text-gray-500">
                Role
              </dt>
              <dd>
                <Badge>{admin.role}</Badge>
              </dd>
            </div>

            <div className="flex items-center gap-4">
              <dt className="w-24 shrink-0 text-sm font-bold text-gray-500">
                Active
              </dt>
              <dd>
                <Badge variant={admin.isActive ? "success" : "muted"}>
                  {admin.isActive ? "Active" : "Inactive"}
                </Badge>
              </dd>
            </div>

            <div className="flex items-baseline gap-4">
              <dt className="w-24 shrink-0 text-sm font-bold text-gray-500">
                Created
              </dt>
              <dd className="font-mono text-sm">{formatDate(admin.createdAt)}</dd>
            </div>

            <div className="flex items-baseline gap-4">
              <dt className="w-24 shrink-0 text-sm font-bold text-gray-500">
                Last Login
              </dt>
              <dd className="font-mono text-sm">
                {formatDate(admin.lastLoginAt)}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="flex justify-end pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="brutal-border brutal-shadow-sm brutal-hover bg-white px-4 py-2 text-sm font-bold"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
