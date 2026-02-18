'use client';

import { useCallback, useState } from 'react';

interface DictationZoneProps {
    isRecording: boolean;
    isProcessing: boolean;
    interimText: string;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSendText: (text: string) => void;
    canSubmit?: boolean;
    onSubmit?: () => void;
}

export function DictationZone({
    isRecording,
    isProcessing,
    interimText,
    onStartRecording,
    onStopRecording,
    onSendText,
    canSubmit,
    onSubmit,
}: DictationZoneProps) {
    const [textInput, setTextInput] = useState('');

    const handleSubmitText = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!textInput.trim() || isProcessing) return;
            onSendText(textInput.trim());
            setTextInput('');
        },
        [textInput, isProcessing, onSendText]
    );

    const handleMicClick = useCallback(() => {
        if (isRecording) {
            onStopRecording();
        } else {
            onStartRecording();
        }
    }, [isRecording, onStartRecording, onStopRecording]);

    return (
        <div className="bg-bg-primary/95 backdrop-blur-md px-12 py-10 max-w-4xl mx-auto w-full">
            {/* Interim text — Architectural Floating Layer */}
            {interimText && (
                <div className="mb-6 px-6 py-4 rounded-sm bg-bg-panel shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-border/40 text-sm text-text-primary italic animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <span className="text-accent-blue opacity-40 mr-3 not-italic font-bold uppercase tracking-widest text-[10px]">Transcribing</span>
                    {interimText}
                    <span className="inline-block w-1 h-4 bg-accent-blue/40 ml-1.5 align-text-bottom animate-pulse" />
                </div>
            )}

            <div className="flex items-center gap-10">
                {/* Mic button — Precise Clinical Instrument */}
                <button
                    onClick={handleMicClick}
                    disabled={isProcessing}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed group shadow-sm ${
                        isRecording
                            ? 'bg-accent-red text-white'
                            : 'bg-accent-blue text-white hover:scale-105'
                    }`}
                >
                    {isRecording && (
                        <span className="absolute -inset-3 rounded-full border-2 border-accent-red/20 pulse-ring" />
                    )}
                    <svg className={`w-6 h-6 transition-transform duration-500 ${isRecording ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        {isRecording ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        )}
                    </svg>
                </button>

                {/* Text input — Ghost Input */}
                <form onSubmit={handleSubmitText} className="flex-1 flex flex-col gap-2">
                    <div className="relative group">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={isRecording ? 'Listening to clinical logic...' : 'Refine your policy or submit it as-is...'}
                            disabled={isRecording || isProcessing}
                            className="w-full px-0 py-4 bg-transparent border-b-2 border-border/60 text-lg text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-accent-blue transition-all disabled:opacity-30"
                        />
                        <button
                            type="submit"
                            disabled={!textInput.trim() || isRecording || isProcessing}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-blue opacity-0 group-focus-within:opacity-100 hover:opacity-70 transition-all disabled:hidden cursor-pointer"
                        >
                            Send
                        </button>
                    </div>
                </form>

                {/* Submit policy button */}
                {canSubmit && (
                    <button
                        onClick={onSubmit}
                        className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 bg-accent-green text-white text-xs font-semibold uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Submit
                    </button>
                )}
            </div>

            {!canSubmit && !isRecording && !textInput.trim() && (
                <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-40 font-semibold mt-3 ml-[104px]">
                    Voice Command Preferred
                </p>
            )}
        </div>
    );
}
