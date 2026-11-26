import type { Prisma } from '@prisma/client';
import type { PermisoIndividual } from '../entities/permiso-individual/permiso-individual.entity';
import type { AlcancePermiso } from '../enums/alcance-permiso.enum';
import type { ContextoAuditoria } from '../results/contexto-auditoria';
import type { FiltroPermisosIndividuales } from '../results/filtro-permisos-individuales';
import type { NuevoPermisoIndividual } from '../results/nuevo-permiso-individual';

/** Un permiso del listado junto con el correo de su beneficiario (BE-336). */
export interface PermisoListado {
  permiso: PermisoIndividual;
  correo_beneficiario: string;
}

/** Usuario `ADMINISTRATIVO` que puede recibir un permiso (BE-336). */
export interface BeneficiarioPermiso {
  id_usuario: string;
  correo_electronico: string;
}

/** Puerto de persistencia de los permisos explícitos de acceso individual (RF-04). */
export abstract class PermisosIndividualesRepository {
  /** UUID interno del estudiante con ese seudónimo, o null si no existe. */
  abstract buscarIdParticipante(
    tx: Prisma.TransactionClient,
    codigo: string,
  ): Promise<string | null>;

  /** Cierra (y audita) los permisos vencidos sin revocar de esa combinación. */
  abstract cerrarVencidos(
    tx: Prisma.TransactionClient,
    beneficiario: string,
    participante: string,
    alcance: AlcancePermiso,
    actor: ContextoAuditoria,
  ): Promise<void>;

  abstract otorgar(
    tx: Prisma.TransactionClient,
    permiso: NuevoPermisoIndividual,
  ): Promise<PermisoIndividual>;

  /** `ahora` es el reloj de la base, el mismo que usa la regla de vigencia. */
  abstract listar(
    tx: Prisma.TransactionClient,
    filtro: FiltroPermisosIndividuales,
  ): Promise<{ items: PermisoListado[]; total: number; ahora: Date }>;

  /** Usuarios `ADMINISTRATIVO` con cuenta `ACTIVA`, por correo ascendente. */
  abstract listarBeneficiarios(
    tx: Prisma.TransactionClient,
    pagina: { offset: number; limit: number },
  ): Promise<{ items: BeneficiarioPermiso[]; total: number }>;

  abstract buscarPorId(
    tx: Prisma.TransactionClient,
    id: string,
    bloquear: boolean,
  ): Promise<{ permiso: PermisoIndividual; id_participante: string } | null>;

  abstract revocar(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<PermisoIndividual>;

  /** Aplica la regla de vigencia de `fn_permiso_individual_vigente`. */
  abstract tieneVigente(
    tx: Prisma.TransactionClient,
    beneficiario: string,
    participante: { codigo: string } | { idSesion: string },
    alcance: AlcancePermiso,
  ): Promise<boolean>;
}
