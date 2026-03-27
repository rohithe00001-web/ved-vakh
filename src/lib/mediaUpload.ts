import { supabase } from '@/integrations/supabase/client';

export async function uploadChatMedia(
  userId: string,
  file: File,
  mediaType: 'image' | 'voice' | 'video'
): Promise<{ url?: string; path?: string; error?: string }> {
  const ext = file.name.split('.').pop() || (mediaType === 'voice' ? 'webm' : 'bin');
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from('chat-media')
      .upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', {
        message: error.message,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        mediaType,
      });
      return { error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(path);

    return { url: urlData.publicUrl, path };
  } catch (err) {
    console.error('Upload exception:', err);
    return { error: err instanceof Error ? err.message : 'Unexpected upload error' };
  }
}
