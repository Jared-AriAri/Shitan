export type ContributionType =
    | 'economica'
    | 'especie';

export type ContributionStatus =
    | 'pendiente'
    | 'aprobada'
    | 'rechazada'
    | 'cancelado';

export type ContributionFilter =
    | 'todas'
    | 'economica'
    | 'especie';

export type ContributionStatusFilter =
    | 'todos'
    | ContributionStatus;

export interface ContributionCause {
    id: string;
    titulo: string;
    slug: string;
    categoria: string;
}

export interface ContributionProfile {
    id: string;
    nombre_completo: string | null;
    alias: string | null;
    correo: string | null;
    telefono: string | null;
    avatar_url: string | null;
}

export interface ContributionItem {
    id: string;
    aportacion_id: string;
    meta_especie_id: string | null;
    nombre: string;
    cantidad: number;
    unidad: string;
    notas: string | null;
    creado_en: string | null;
}

export interface ContributionReceipt {
    id: string;
    aportacion_id: string;
    usuario_id: string;
    ruta_storage: string;
    nombre_archivo: string | null;
    tipo_mime: string | null;
    tamano_bytes: number | null;
    creado_en: string | null;
    url: string | null;
}

export interface ContributionRow {
    id: string;
    folio: number;
    causa_id: string;
    donante_id: string;
    tipo: ContributionType;
    monto: number | null;
    nombre_donante: string | null;
    alias_donante: string | null;
    correo_donante: string | null;
    telefono_donante: string | null;
    anonima: boolean;
    mensaje: string | null;
    referencia_transferencia: string | null;
    estado: ContributionStatus;
    revisada_por: string | null;
    revisada_en: string | null;
    motivo_rechazo: string | null;
    creada_en: string;
    actualizada_en: string;
    causa: ContributionCause | null;
    perfil: ContributionProfile | null;
    revisor: ContributionProfile | null;
    detalles: ContributionItem[];
    comprobantes: ContributionReceipt[];
}