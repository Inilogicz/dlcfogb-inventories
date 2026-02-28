export type AppRole = 'super_admin' | 'region_admin' | 'cluster_admin' | 'center_rep';

export interface Profile {
    id: string;
    full_name: string | null;
    role: AppRole;
    region_id: string | null;
    cluster_id: string | null;
    center_id: string | null;
    updated_at: string;
}

export interface Region {
    id: string;
    name: string;
    created_at: string;
}

export interface Cluster {
    id: string;
    name: string;
    region_id: string | null;
    created_at: string;
}

export interface Center {
    id: string;
    name: string;
    cluster_id: string;
    created_at: string;
}

export interface ServiceType {
    id: string;
    name: string;
    created_at: string;
}

export interface AttendanceSubmission {
    id: string;
    center_id: string | null;
    cluster_id: string | null;
    submission_level: 'center' | 'cluster' | 'general';
    service_type_id: string;
    service_date: string;
    adult_brothers: number;
    adult_sisters: number;
    youth_brothers: number;
    youth_sisters: number;
    children_brothers: number;
    children_sisters: number;
    visitors_brothers: number;
    visitors_sisters: number;
    grand_total: number;
    created_by: string;
    created_at: string;
}

export interface OfferingSubmission {
    id: string;
    center_id: string | null;
    cluster_id: string | null;
    submission_level: 'center' | 'cluster' | 'general';
    service_type_id: string;
    service_date: string;
    amount_100: number;
    amount_80: number;
    amount_20: number;
    created_by: string;
    created_at: string;
}

export interface InventoryItem {
    id: string;
    center_id: string;
    name: string;
    quantity: number;
    description: string | null;
    model: string | null;
    model_number: string | null;
    condition: string | null;
    image_url: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}
