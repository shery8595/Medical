import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EncryptedDataContextType {
    revealedScores: Record<string, number>;
    setRevealedScore: (engineAddress: string, trialId: string, score: number) => void;
    getRevealedScore: (engineAddress: string, trialId: string) => number | null;
}

const EncryptedDataContext = createContext<EncryptedDataContextType | undefined>(undefined);

export function EncryptedDataProvider({ children }: { children: ReactNode }) {
    const [revealedScores, setRevealedScores] = useState<Record<string, number>>({});

    const setRevealedScore = (engineAddress: string, trialId: string, score: number) => {
        const key = `${engineAddress.toLowerCase()}_${trialId}`;
        setRevealedScores(prev => ({
            ...prev,
            [key]: score
        }));
    };

    const getRevealedScore = (engineAddress: string, trialId: string) => {
        const key = `${engineAddress.toLowerCase()}_${trialId}`;
        return revealedScores[key] ?? null;
    };

    return (
        <EncryptedDataContext.Provider value={{ revealedScores, setRevealedScore, getRevealedScore }}>
            {children}
        </EncryptedDataContext.Provider>
    );
}

export function useEncryptedData() {
    const context = useContext(EncryptedDataContext);
    if (context === undefined) {
        throw new Error('useEncryptedData must be used within an EncryptedDataProvider');
    }
    return context;
}
