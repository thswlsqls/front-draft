"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import type { AdminResponse } from "@/types/admin";

interface AccountsTableProps {
  accounts: AdminResponse[];
  loading: boolean;
  onView: (admin: AdminResponse) => void;
  onEdit: (admin: AdminResponse) => void;
  onDelete: (admin: AdminResponse) => void;
  onCreate: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); // HH:mm
  return `${date} ${time}`;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-200">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AccountsTable({
  accounts,
  loading,
  onView,
  onEdit,
  onDelete,
  onCreate,
}: AccountsTableProps) {
  const { user } = useAuth();
  const isSelf = (admin: AdminResponse) => user?.id === admin.id;

  return (
    <div className="overflow-x-auto bg-white brutal-border brutal-shadow">
      <table className="w-full" aria-label="Admin accounts table">
        <thead>
          <tr className="border-b-2 border-black bg-[#F5F5F5] text-left text-sm font-bold">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Active</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Last Login</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : accounts.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center text-gray-500">
                <p className="text-base font-bold">No admin accounts found.</p>
                <p className="mt-1 text-sm">
                  Create the first admin account.
                </p>
                <button
                  onClick={onCreate}
                  className="brutal-border brutal-shadow-sm brutal-hover mt-4 inline-flex items-center gap-2 bg-[#3B82F6] px-4 py-2 text-sm font-bold text-white"
                >
                  <Plus className="size-4" />
                  Create Account
                </button>
              </td>
            </tr>
          ) : (
            accounts.map((admin) => (
              <tr
                key={admin.id}
                className="border-b border-gray-200 transition-colors hover:bg-[#F5F5F5]"
              >
                <td className="px-4 py-3 text-sm font-mono">{admin.id}</td>
                <td className="px-4 py-3 text-sm">{admin.email}</td>
                <td className="px-4 py-3 text-sm font-bold">{admin.username}</td>
                <td className="px-4 py-3">
                  <Badge>{admin.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={admin.isActive ? "success" : "muted"}>
                    {admin.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {formatDate(admin.createdAt)}
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {formatDate(admin.lastLoginAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(admin)}
                      className="p-1.5 transition-colors hover:bg-[#F5F5F5]"
                      aria-label={`View ${admin.username}`}
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      onClick={() => onEdit(admin)}
                      className="p-1.5 transition-colors hover:bg-[#F5F5F5]"
                      aria-label={`Edit ${admin.username}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => onDelete(admin)}
                      disabled={isSelf(admin)}
                      className={`p-1.5 text-[#EF4444] transition-colors hover:bg-red-50 ${
                        isSelf(admin)
                          ? "cursor-not-allowed opacity-30"
                          : ""
                      }`}
                      aria-label={`Delete ${admin.username}`}
                      aria-disabled={isSelf(admin)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
