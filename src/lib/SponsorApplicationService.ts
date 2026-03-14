
export interface SponsorApplication {
    institution: string;
    researcher: string;
    email: string;
    mission: string;
    walletAddress: string;
    submittedAt: number;
}

const STORAGE_KEY = "medvault_sponsor_applications";

export const SponsorApplicationService = {
    submitApplication(app: Omit<SponsorApplication, 'submittedAt'>) {
        const apps = this.getPendingApplications();
        const newApp: SponsorApplication = {
            ...app,
            submittedAt: Date.now()
        };
        
        // Prevent duplicates
        const filtered = apps.filter(a => a.walletAddress.toLowerCase() !== app.walletAddress.toLowerCase());
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, newApp]));
    },

    getPendingApplications(): SponsorApplication[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Error parsing sponsor applications", e);
            return [];
        }
    },

    removeApplication(walletAddress: string) {
        const apps = this.getPendingApplications();
        const filtered = apps.filter(a => a.walletAddress.toLowerCase() !== walletAddress.toLowerCase());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
};
