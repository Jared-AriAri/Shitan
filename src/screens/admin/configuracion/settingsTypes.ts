export interface FundSettings {
    id: number;
    nombre_organizacion: string | null;
    institucion_bancaria: string | null;
    nombre_beneficiario: string | null;
    clabe: string | null;
    concepto_transferencia: string | null;
    actualizado_por: string | null;
    actualizado_en: string | null;
}

export interface SettingsUpdater {
    id: string;
    correo: string | null;
    nombre_completo: string | null;
    alias: string | null;
    avatar_url: string | null;
}

export interface SettingsForm {
    nombre_organizacion: string;
    institucion_bancaria: string;
    nombre_beneficiario: string;
    clabe: string;
    concepto_transferencia: string;
}

export interface FundSettingsWithUpdater
    extends FundSettings {
    actualizador: SettingsUpdater | null;
}