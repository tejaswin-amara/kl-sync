'use client';
import { useState, useRef } from 'react';
import { Camera, FileText, Loader2, Upload, X } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { GlassCard } from '@/components/ui/glass-card';

export function OcrTool() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setText('');
        setProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractText = async () => {
    if (!image) return;
    try {
      setLoading(true);
      setProgress(10);
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt((m.progress * 100).toString()));
          }
        }
      });
      const { data: { text } } = await worker.recognize(image);
      setText(text);
      await worker.terminate();
    } catch (e) {
      console.error(e);
      setText('Failed to extract text. Please try a clearer image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="flex flex-col h-full lg:col-span-2" glowIntensity="low">
      <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-zinc-950/30">
        <Camera className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-zinc-100">Offline OCR Text Extractor</h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">Client-Side</span>
      </div>
      <div className="p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-sm text-zinc-400">Upload notes, assignments, or circulars to instantly extract text directly in your browser without hitting any limits.</p>
          
          <div className="relative border-2 border-dashed border-white/10 hover:border-blue-500/30 bg-zinc-950/30 rounded-xl overflow-hidden transition-colors flex-1 min-h-[200px] flex items-center justify-center">
            {image ? (
              <>
                <img src={image} alt="Uploaded" className="w-full h-full object-contain max-h-[300px]" />
                <button 
                  onClick={() => { setImage(null); setText(''); }}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 hover:bg-red-500/80 text-white rounded-lg transition-colors backdrop-blur"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center p-6" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-300">Click to upload an image</p>
                <p className="text-xs text-zinc-500 mt-1">PNG, JPG, or WEBP</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageUpload}
            />
          </div>

          <button
            onClick={extractText}
            disabled={!image || loading}
            className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Extracting ({progress}%)</>
            ) : (
              <><FileText className="w-4 h-4" /> Extract Text</>
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Extracted Text</label>
          <div className="flex-1 min-h-[200px] relative">
            <textarea
              readOnly
              value={text}
              placeholder="Extracted text will appear here..."
              className="w-full h-full absolute inset-0 bg-zinc-950/50 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none resize-none custom-scrollbar"
            />
          </div>
          {text && (
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              className="mt-3 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 rounded-xl text-xs font-medium text-zinc-100 self-end transition-colors"
            >
              Copy to Clipboard
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
