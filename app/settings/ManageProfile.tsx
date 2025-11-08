'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, AtSign, Save, X } from 'lucide-react';
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "../api/uploadthing/core";
import { useRouter } from 'next/navigation';

interface ManageProfileProps {
  session: {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  };
  onClose: () => void;
}

export function ManageProfile({ session, onClose }: ManageProfileProps) {
  const router = useRouter();
  const [name, setName] = useState(session.user.name || '');
  const [email, setEmail] = useState(session.user.email || '');
  const [avatar, setAvatar] = useState(session.user.image || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, image: avatar }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
      // Refresh the page to reflect changes
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      // Handle error state in UI
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-[#101922] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md m-4">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Manage Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-linear-to-br from-primary/20 to-primary/40 border-2 border-white/10">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="User Avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
            <UploadButton<OurFileRouter, 'imageUploader'>
              endpoint="imageUploader"
              onUploadBegin={() => setUploading(true)}
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  setAvatar(res[0].url);
                }
                setUploading(false);
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
                setUploading(false);
              }}
              className="ut-button:bg-primary ut-button:text-black ut-button:rounded-lg ut-button:font-bold ut-button:hover:bg-primary/80 ut-button:transition-colors ut-button:flex ut-button:items-center ut-button:gap-2"
            />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                disabled
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
        <div className="p-6 bg-white/5 rounded-b-2xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-transparent border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/80 transition-colors flex items-center disabled:opacity-50"
          >
            {saving ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
