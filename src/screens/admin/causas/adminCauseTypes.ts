export type CauseStatus =
    | 'borrador'
    | 'esperando_aprobacion'
    | 'aprobado'
    | 'publicado';

export type CauseStatusFilter =
    | 'todos'
    | CauseStatus;

export interface CauseImage {
    id: string;
    causa_id: string;
    storage_path: string;
    public_url: string;
    nombre_archivo: string | null;
    mime_type: string | null;
    size_bytes: number | null;
    es_principal: boolean;
    orden: number;
    creado_en: string;
}

export interface CauseProduct {
    id: string;
    causa_id: string;
    nombre: string;
    descripcion: string | null;
    unidad: string;
    cantidad_objetivo: number;
    orden: number;
    creado_en: string;
}

export interface CauseCreator {
    id: string;
    correo: string | null;
    nombre_completo: string | null;
    alias: string | null;
    telefono: string | null;
    avatar_url: string | null;
}

export interface CauseRow {
    id: string;
    slug: string;
    titulo: string;
    resumen: string | null;
    historia: string | null;
    categoria: string;
    estado: CauseStatus;
    meta_economica: number | null;
    organizador: string | null;
    beneficiario: string | null;
    ubicacion: string | null;
    fecha_inicio: string | null;
    fecha_limite: string | null;
    fecha_completada: string | null;
    destacada: boolean;
    orden: number;
    creado_por: string | null;
    creado_en: string;
    actualizado_en: string;
    tipo_meta: 'economica' | 'especie';
    latitud: number | null;
    longitud: number | null;
    google_place_id: string | null;
    imagen_url: string | null;
    imagenes: CauseImage[];
    productos: CauseProduct[];
    creador: CauseCreator | null;
}