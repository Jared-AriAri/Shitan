export type UserRole =
    | 'donante'
    | 'admin'
    | 'adminmaster';

export type UserRoleFilter =
    | 'todos'
    | UserRole;

export type UserStatusFilter =
    | 'todos'
    | 'activos'
    | 'inactivos';

export interface UserRow {
    id: string;
    correo: string | null;
    nombre_completo: string | null;
    alias: string | null;
    telefono: string | null;
    avatar_url: string | null;
    rol: UserRole;
    anonimo_por_defecto: boolean;
    activo: boolean;
    ultimo_acceso: string | null;
    creado_en: string;
    actualizado_en: string;
}