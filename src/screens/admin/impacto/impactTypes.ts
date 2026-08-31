export interface ImpactCause {
    id: string;
    titulo: string;
    slug: string;
    categoria: string;
    estado: string;
}

export interface ImpactProfile {
    id: string;
    correo: string | null;
    nombre_completo: string | null;
    alias: string | null;
    telefono: string | null;
    avatar_url: string | null;
}

export interface ImpactFile {
    id: string;
    evidencia_id: string;
    tipo: string;
    ruta_storage: string;
    nombre_archivo: string | null;
    orden: number;
    creado_en: string;
    url: string | null;
}

export interface ImpactRow {
    id: string;
    causa_id: string;
    titulo: string;
    descripcion: string | null;
    fecha_entrega: string | null;
    monto_utilizado: number | null;
    publica: boolean;
    verificada: boolean;
    verificada_por: string | null;
    verificada_en: string | null;
    creada_por: string | null;
    creado_en: string;
    causa: ImpactCause | null;
    creador: ImpactProfile | null;
    verificador: ImpactProfile | null;
    archivos: ImpactFile[];
}

export type ImpactVerificationFilter =
    | 'todos'
    | 'verificados'
    | 'pendientes';

export type ImpactVisibilityFilter =
    | 'todas'
    | 'publicas'
    | 'privadas';