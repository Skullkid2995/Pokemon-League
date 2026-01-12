'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Lock, Upload, X, FileText, Users } from 'lucide-react';

interface SettingsContentProps {
  user: {
    id: string;
    name: string;
    nickname: string | null;
    email: string | null;
    avatar_url?: string | null; // Optional until migration is run
  };
  userRole?: 'super_admin' | 'player' | null;
}

export default function SettingsContent({ user, userRole }: SettingsContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for avatars)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('game-results') // Reusing existing bucket, or create 'avatars' bucket
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('game-results')
        .getPublicUrl(fileName);

      // Update user record - handle case where column might not exist
      const updateData: any = { avatar_url: publicUrl };
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        // If column doesn't exist, show helpful message
        if (updateError.message.includes('avatar_url') || updateError.code === '42703') {
          throw new Error('Please run migration 010_add_avatar_url_to_users.sql first');
        }
        throw updateError;
      }

      setSuccess('Avatar updated successfully');
      setTimeout(() => {
        setSuccess(null);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError('Error uploading avatar: ' + (err.message || 'Unknown error'));
      setAvatarPreview(user.avatar_url || null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.message.includes('avatar_url') || updateError.code === '42703') {
          setError('The avatar_url column does not exist. Run the migration first.');
          setLoading(false);
          return;
        }
        throw updateError;
      }

      setAvatarPreview(null);
      setSuccess('Avatar removed successfully');
      setTimeout(() => {
        setSuccess(null);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError('Error removing avatar: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* My Profile Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">My Profile</h2>
        </div>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-4xl font-bold text-primary">
                  {(user.nickname || user.name)[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avatar</p>
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
                  </Button>
                  {avatarPreview && (
                    <Button
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar || loading}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Max 2MB. Formats: JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* User Info Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
              <p className="text-base font-semibold">{user.name}</p>
            </div>
            {user.nickname && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nickname</p>
                <p className="text-base font-semibold">{user.nickname}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
              <p className="text-base">{user.email}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Change Password</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Update your password to keep your account secure.
        </p>
        <Link href="/change-password">
          <Button variant="outline">
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </Link>
      </Card>

      {/* Admin Section - Only for Super Admin */}
      {userRole === 'super_admin' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Admin Tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/users">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                <Users className="h-8 w-8" />
                <span className="font-semibold">Users</span>
                <span className="text-sm text-muted-foreground">Manage users</span>
              </Button>
            </Link>
            <Link href="/audit-logs">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
                <FileText className="h-8 w-8" />
                <span className="font-semibold">Audit Log</span>
                <span className="text-sm text-muted-foreground">View activity logs</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

