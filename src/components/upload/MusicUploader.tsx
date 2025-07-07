import React from 'react';

export interface UploadCompleteData {
  trackId: string;
}

interface MusicUploaderProps {
  onComplete?: (data: UploadCompleteData) => void;
}

export default function MusicUploader({ onComplete }: MusicUploaderProps) {
  return (
    <div onClick={() => onComplete?.({ trackId: '1' })}>
      MusicUploader placeholder
    </div>
  );
}
