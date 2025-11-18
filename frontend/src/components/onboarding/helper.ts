import { apiService } from "@/services/api";


export const onCreateServer = async (name: string, description: string, icon: string): Promise<void> => {
    try {
        const response = await apiService.createServer({ name, description, icon });
        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
}