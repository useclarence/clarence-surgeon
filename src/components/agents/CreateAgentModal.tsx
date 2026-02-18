'use client';

import { useCallback, useState } from 'react';
import { Modal } from '@/components/ui/Modal';

const SPECIALTY_PRESETS = ['Spine Surgery', 'Orthopedics', 'Neurosurgery', 'General Surgery', 'Cardiac', 'Urology', 'ENT'];

interface CreateAgentModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string, specialty?: string) => void;
}

export function CreateAgentModal({ open, onClose, onCreate }: CreateAgentModalProps) {
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!name.trim()) return;
            onCreate(name.trim(), specialty.trim() || undefined);
            setName('');
            setSpecialty('');
            onClose();
        },
        [name, specialty, onCreate, onClose]
    );

    return (
        <Modal open={open} onClose={onClose}>
            <form onSubmit={handleSubmit} className="bg-bg-panel p-10 max-w-lg w-full rounded-sm shadow-2xl border border-border/40">
                <h2 className="text-2xl font-serif text-text-primary mb-2 italic">Create Your Triage Assistant</h2>
                <p className="text-sm text-text-secondary mb-10 leading-relaxed max-w-md">
                    Step 1 of 2: Name your assistant and choose a specialty. Next, you&apos;ll run sample patient calls to test it.
                </p>

                <div className="space-y-10">
                    <div className="relative group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2 opacity-50">
                            Assistant Name <span className="text-accent-red opacity-100">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Spine Referral Triage Assistant"
                            className="w-full px-0 py-3 bg-transparent border-b border-border/60 text-base text-text-primary placeholder:text-text-secondary/20 focus:outline-none focus:border-accent-blue transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-4 opacity-50">
                            Specialty (Optional)
                        </label>
                        <input
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="e.g. Orthopedics, Neurosurgery"
                            className="w-full px-0 py-3 bg-transparent border-b border-border/60 text-base text-text-primary placeholder:text-text-secondary/20 focus:outline-none focus:border-accent-blue mb-6 transition-all"
                        />
                        <div className="flex flex-wrap gap-2">
                            {SPECIALTY_PRESETS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSpecialty(s)}
                                    className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all cursor-pointer ${specialty === s
                                            ? 'border-accent-blue bg-accent-blue text-white'
                                            : 'border-border/60 text-text-secondary hover:border-accent-blue/40 hover:text-text-primary'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-8 mt-16 pt-8 border-t border-border/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="px-8 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-accent-blue text-white hover:bg-accent-blue/90 transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Create
                    </button>
                </div>
            </form>
        </Modal>
    );
}
