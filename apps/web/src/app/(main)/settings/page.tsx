'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  Bell,
  Lock,
  Trash2,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-section text-charcoal">Settings</h1>
          <p className="text-body text-charcoal/60 mt-2">
            Manage your account preferences and security settings
          </p>
        </div>

        <div className="grid gap-6">
          {/* Appearance */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal">Theme</p>
                  <p className="text-caption text-charcoal/60">Select your preferred theme</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="cream" size="sm">Light</Button>
                  <Button variant="ghost" size="sm" disabled>Dark</Button>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-parchment">
                <div>
                  <p className="text-body font-medium text-charcoal">Language</p>
                  <p className="text-caption text-charcoal/60">Select your preferred language</p>
                </div>
                <span className="text-caption text-charcoal/60">English</span>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal">Email Notifications</p>
                  <p className="text-caption text-charcoal/60">Receive email updates about your reviews</p>
                </div>
                <div className="w-12 h-6 bg-mysteria rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-parchment">
                <div>
                  <p className="text-body font-medium text-charcoal">Review Completion</p>
                  <p className="text-caption text-charcoal/60">Get notified when AI review is complete</p>
                </div>
                <div className="w-12 h-6 bg-mysteria rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="card-super">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal">Change Password</p>
                  <p className="text-caption text-charcoal/60">Update your account password</p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-parchment">
                <div>
                  <p className="text-body font-medium text-charcoal">Two-Factor Authentication</p>
                  <p className="text-caption text-charcoal/60">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="card-super border-red-200">
            <CardHeader>
              <CardTitle className="text-body-heading flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body font-medium text-charcoal">Sign Out</p>
                  <p className="text-caption text-charcoal/60">Sign out from your account</p>
                </div>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-red-100">
                <div>
                  <p className="text-body font-medium text-red-600">Delete Account</p>
                  <p className="text-caption text-charcoal/60">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                  Delete
                </Button>
              </div>

              {showDeleteConfirm && (
                <div className="p-4 bg-red-50 rounded-card border border-red-200">
                  <p className="text-body text-red-600 mb-4">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        // Delete account logic
                        setShowDeleteConfirm(false);
                      }}
                    >
                      Yes, Delete Account
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
