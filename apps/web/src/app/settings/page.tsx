"use client";

import { useEffect, useState } from "react";
import { useSession, changePassword, authClient } from "@/lib/auth-client";
import Link from "next/link";

interface LinkedAccount {
  providerId: string;
  accountId: string;
}

export default function SettingsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const result = await authClient.listAccounts();
        const allAccounts = (result.data as LinkedAccount[]) ?? [];
        const socialAccounts = allAccounts.filter(
          (account) => account.providerId && account.providerId !== "credential"
        );
        setAccounts(socialAccounts);
      } catch {
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) throw new Error(error.message);

      setPasswordMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-400">Please sign in to view settings.</p>
        </div>
      </div>
    );
  }

  const user = session.user;
  const hasPasswordAccount = true;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold text-gray-100 mb-6">Settings</h1>

        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Account</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-gray-100">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-gray-100">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role</span>
                <span className="text-gray-100 capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Linked providers</h2>
            {accountsLoading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : accounts.length === 0 ? (
              <p className="text-gray-400 text-sm">No linked social accounts.</p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((account) => (
                  <li
                    key={`${account.providerId}-${account.accountId}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-100 capitalize">{account.providerId}</span>
                    <span className="text-xs text-gray-500">Connected</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasPasswordAccount && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Change password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordMessage && (
                  <p className="text-green-400 text-sm">{passwordMessage}</p>
                )}
                {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {passwordLoading ? "Updating..." : "Update password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
