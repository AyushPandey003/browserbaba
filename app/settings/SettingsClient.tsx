'use client';

import { useState } from 'react';
import { ArrowLeft, User, Moon, Sun, Monitor, Bell, Shield, Database, Globe, Trash2, Download, Upload, LogOut, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import Image from 'next/image';
import { ManageProfile } from './ManageProfile';

interface SettingsClientProps {
  session: {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  };
}

export function SettingsClient({ session }: SettingsClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showManageProfile, setShowManageProfile] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      setIsSigningOut(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save settings to database
    setTimeout(() => {
      setSaving(false);
      // Show success message
    }, 1000);
  };

  return (
    <main className="flex-1 bg-background w-full max-w-full">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground flex-1">Settings</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-border">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-foreground">
                  {session.user.name || 'User'}
                </h2>
                <p className="text-muted-foreground text-sm">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowManageProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg transition-colors text-sm font-medium"
            >
              <User className="w-4 h-4" />
              Manage Profile
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground px-2">Appearance</h3>
          <div className="bg-card backdrop-blur-xl rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Theme</p>
                  <p className="text-muted-foreground text-sm">Choose your preferred theme</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'light'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'dark'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'system'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground px-2">Notifications</h3>
          <div className="bg-card backdrop-blur-xl rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Enable Notifications</p>
                  <p className="text-muted-foreground text-sm">Receive updates about your memories</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground px-2">Data Management</h3>
          <div className="bg-card backdrop-blur-xl rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Export Data</p>
                  <p className="text-muted-foreground text-sm">Download your memories and data</p>
                </div>
              </div>
              <div className="text-muted-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Import Data</p>
                  <p className="text-muted-foreground text-sm">Import memories from other sources</p>
                </div>
              </div>
              <div className="text-muted-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-red-500/10 transition-colors text-red-400">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Delete Account</p>
                  <p className="text-muted-foreground text-sm">Permanently delete your account and data</p>
                </div>
              </div>
              <div className="text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground px-2">Privacy & Security</h3>
          <div className="bg-card backdrop-blur-xl rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Privacy Settings</p>
                  <p className="text-muted-foreground text-sm">Manage your privacy preferences</p>
                </div>
              </div>
              <div className="text-muted-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Data Storage</p>
                  <p className="text-muted-foreground text-sm">View storage usage and manage data</p>
                </div>
              </div>
              <div className="text-muted-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground px-2">About</h3>
          <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-bold text-lg">BrowseBaba</p>
                <p className="text-muted-foreground text-sm">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your intelligent memory assistant for capturing, organizing, and searching web content.
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-4">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isSigningOut ? (
              <>
                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>
      {showManageProfile && (
        <ManageProfile
          session={session}
          onClose={() => setShowManageProfile(false)}
        />
      )}
    </main>
  );
}

