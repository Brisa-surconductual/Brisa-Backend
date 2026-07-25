
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model consentimientos
 * This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.
 * This model or at least one of its fields has comments in the database, and requires an additional setup for migrations: Read more: https://pris.ly/d/database-comments
 */
export type consentimientos = $Result.DefaultSelection<Prisma.$consentimientosPayload>
/**
 * Model linea_base
 * This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.
 * This model or at least one of its fields has comments in the database, and requires an additional setup for migrations: Read more: https://pris.ly/d/database-comments
 */
export type linea_base = $Result.DefaultSelection<Prisma.$linea_basePayload>
/**
 * Model linea_base_historial
 * This model or at least one of its fields has comments in the database, and requires an additional setup for migrations: Read more: https://pris.ly/d/database-comments
 */
export type linea_base_historial = $Result.DefaultSelection<Prisma.$linea_base_historialPayload>
/**
 * Model sesiones
 * This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.
 * This model or at least one of its fields has comments in the database, and requires an additional setup for migrations: Read more: https://pris.ly/d/database-comments
 */
export type sesiones = $Result.DefaultSelection<Prisma.$sesionesPayload>
/**
 * Model solicitudes_recuperacion
 * This model or at least one of its fields has comments in the database, and requires an additional setup for migrations: Read more: https://pris.ly/d/database-comments
 */
export type solicitudes_recuperacion = $Result.DefaultSelection<Prisma.$solicitudes_recuperacionPayload>
/**
 * Model usuarios
 * This table contains check constraints and requires additional setup for migrations. Visit https://pris.ly/d/check-constraints for more info.
 * This model or at least one of its fields has comments in the database, and requires an additional setup for migrations: Read more: https://pris.ly/d/database-comments
 * This model contains an expression index which requires additional setup for migrations. Visit https://pris.ly/d/expression-indexes for more info.
 */
export type usuarios = $Result.DefaultSelection<Prisma.$usuariosPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const estado_aplicacion_enum: {
  ACTIVA: 'ACTIVA',
  SEGUNDO_PLANO: 'SEGUNDO_PLANO'
};

export type estado_aplicacion_enum = (typeof estado_aplicacion_enum)[keyof typeof estado_aplicacion_enum]


export const estado_codigo_enum: {
  ACTIVO: 'ACTIVO',
  USADO: 'USADO',
  EXPIRADO: 'EXPIRADO'
};

export type estado_codigo_enum = (typeof estado_codigo_enum)[keyof typeof estado_codigo_enum]


export const estado_cuenta_enum: {
  PENDIENTE_ACTIVACION: 'PENDIENTE_ACTIVACION',
  ACTIVA: 'ACTIVA',
  INACTIVA: 'INACTIVA'
};

export type estado_cuenta_enum = (typeof estado_cuenta_enum)[keyof typeof estado_cuenta_enum]


export const estado_registro_enum: {
  PENDIENTE_CONSENTIMIENTO: 'PENDIENTE_CONSENTIMIENTO',
  PENDIENTE_REVISION: 'PENDIENTE_REVISION',
  REGISTRO_COMPLETO: 'REGISTRO_COMPLETO'
};

export type estado_registro_enum = (typeof estado_registro_enum)[keyof typeof estado_registro_enum]


export const motivo_cierre_enum: {
  VOLUNTARIO: 'VOLUNTARIO',
  INACTIVIDAD: 'INACTIVIDAD',
  SEGUNDO_PLANO: 'SEGUNDO_PLANO'
};

export type motivo_cierre_enum = (typeof motivo_cierre_enum)[keyof typeof motivo_cierre_enum]


export const motivo_consumo_enum: {
  ESTRES: 'ESTRES',
  PRESION_SOCIAL: 'PRESION_SOCIAL',
  CURIOSIDAD: 'CURIOSIDAD',
  ANSIEDAD: 'ANSIEDAD',
  HABITO: 'HABITO',
  OTRO: 'OTRO'
};

export type motivo_consumo_enum = (typeof motivo_consumo_enum)[keyof typeof motivo_consumo_enum]


export const nivel_academico_enum: {
  PREGRADO: 'PREGRADO',
  POSGRADO: 'POSGRADO'
};

export type nivel_academico_enum = (typeof nivel_academico_enum)[keyof typeof nivel_academico_enum]


export const rol_enum: {
  ESTUDIANTE: 'ESTUDIANTE',
  ADMINISTRATIVO: 'ADMINISTRATIVO'
};

export type rol_enum = (typeof rol_enum)[keyof typeof rol_enum]

}

export type estado_aplicacion_enum = $Enums.estado_aplicacion_enum

export const estado_aplicacion_enum: typeof $Enums.estado_aplicacion_enum

export type estado_codigo_enum = $Enums.estado_codigo_enum

export const estado_codigo_enum: typeof $Enums.estado_codigo_enum

export type estado_cuenta_enum = $Enums.estado_cuenta_enum

export const estado_cuenta_enum: typeof $Enums.estado_cuenta_enum

export type estado_registro_enum = $Enums.estado_registro_enum

export const estado_registro_enum: typeof $Enums.estado_registro_enum

export type motivo_cierre_enum = $Enums.motivo_cierre_enum

export const motivo_cierre_enum: typeof $Enums.motivo_cierre_enum

export type motivo_consumo_enum = $Enums.motivo_consumo_enum

export const motivo_consumo_enum: typeof $Enums.motivo_consumo_enum

export type nivel_academico_enum = $Enums.nivel_academico_enum

export const nivel_academico_enum: typeof $Enums.nivel_academico_enum

export type rol_enum = $Enums.rol_enum

export const rol_enum: typeof $Enums.rol_enum

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Consentimientos
 * const consentimientos = await prisma.consentimientos.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Consentimientos
   * const consentimientos = await prisma.consentimientos.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.consentimientos`: Exposes CRUD operations for the **consentimientos** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Consentimientos
    * const consentimientos = await prisma.consentimientos.findMany()
    * ```
    */
  get consentimientos(): Prisma.consentimientosDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.linea_base`: Exposes CRUD operations for the **linea_base** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Linea_bases
    * const linea_bases = await prisma.linea_base.findMany()
    * ```
    */
  get linea_base(): Prisma.linea_baseDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.linea_base_historial`: Exposes CRUD operations for the **linea_base_historial** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Linea_base_historials
    * const linea_base_historials = await prisma.linea_base_historial.findMany()
    * ```
    */
  get linea_base_historial(): Prisma.linea_base_historialDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sesiones`: Exposes CRUD operations for the **sesiones** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sesiones
    * const sesiones = await prisma.sesiones.findMany()
    * ```
    */
  get sesiones(): Prisma.sesionesDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.solicitudes_recuperacion`: Exposes CRUD operations for the **solicitudes_recuperacion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Solicitudes_recuperacions
    * const solicitudes_recuperacions = await prisma.solicitudes_recuperacion.findMany()
    * ```
    */
  get solicitudes_recuperacion(): Prisma.solicitudes_recuperacionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.usuarios`: Exposes CRUD operations for the **usuarios** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Usuarios
    * const usuarios = await prisma.usuarios.findMany()
    * ```
    */
  get usuarios(): Prisma.usuariosDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    consentimientos: 'consentimientos',
    linea_base: 'linea_base',
    linea_base_historial: 'linea_base_historial',
    sesiones: 'sesiones',
    solicitudes_recuperacion: 'solicitudes_recuperacion',
    usuarios: 'usuarios'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "consentimientos" | "linea_base" | "linea_base_historial" | "sesiones" | "solicitudes_recuperacion" | "usuarios"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      consentimientos: {
        payload: Prisma.$consentimientosPayload<ExtArgs>
        fields: Prisma.consentimientosFieldRefs
        operations: {
          findUnique: {
            args: Prisma.consentimientosFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.consentimientosFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>
          }
          findFirst: {
            args: Prisma.consentimientosFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.consentimientosFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>
          }
          findMany: {
            args: Prisma.consentimientosFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>[]
          }
          create: {
            args: Prisma.consentimientosCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>
          }
          createMany: {
            args: Prisma.consentimientosCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.consentimientosCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>[]
          }
          delete: {
            args: Prisma.consentimientosDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>
          }
          update: {
            args: Prisma.consentimientosUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>
          }
          deleteMany: {
            args: Prisma.consentimientosDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.consentimientosUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.consentimientosUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>[]
          }
          upsert: {
            args: Prisma.consentimientosUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$consentimientosPayload>
          }
          aggregate: {
            args: Prisma.ConsentimientosAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConsentimientos>
          }
          groupBy: {
            args: Prisma.consentimientosGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConsentimientosGroupByOutputType>[]
          }
          count: {
            args: Prisma.consentimientosCountArgs<ExtArgs>
            result: $Utils.Optional<ConsentimientosCountAggregateOutputType> | number
          }
        }
      }
      linea_base: {
        payload: Prisma.$linea_basePayload<ExtArgs>
        fields: Prisma.linea_baseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.linea_baseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.linea_baseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>
          }
          findFirst: {
            args: Prisma.linea_baseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.linea_baseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>
          }
          findMany: {
            args: Prisma.linea_baseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>[]
          }
          create: {
            args: Prisma.linea_baseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>
          }
          createMany: {
            args: Prisma.linea_baseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.linea_baseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>[]
          }
          delete: {
            args: Prisma.linea_baseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>
          }
          update: {
            args: Prisma.linea_baseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>
          }
          deleteMany: {
            args: Prisma.linea_baseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.linea_baseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.linea_baseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>[]
          }
          upsert: {
            args: Prisma.linea_baseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_basePayload>
          }
          aggregate: {
            args: Prisma.Linea_baseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLinea_base>
          }
          groupBy: {
            args: Prisma.linea_baseGroupByArgs<ExtArgs>
            result: $Utils.Optional<Linea_baseGroupByOutputType>[]
          }
          count: {
            args: Prisma.linea_baseCountArgs<ExtArgs>
            result: $Utils.Optional<Linea_baseCountAggregateOutputType> | number
          }
        }
      }
      linea_base_historial: {
        payload: Prisma.$linea_base_historialPayload<ExtArgs>
        fields: Prisma.linea_base_historialFieldRefs
        operations: {
          findUnique: {
            args: Prisma.linea_base_historialFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.linea_base_historialFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>
          }
          findFirst: {
            args: Prisma.linea_base_historialFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.linea_base_historialFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>
          }
          findMany: {
            args: Prisma.linea_base_historialFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>[]
          }
          create: {
            args: Prisma.linea_base_historialCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>
          }
          createMany: {
            args: Prisma.linea_base_historialCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.linea_base_historialCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>[]
          }
          delete: {
            args: Prisma.linea_base_historialDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>
          }
          update: {
            args: Prisma.linea_base_historialUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>
          }
          deleteMany: {
            args: Prisma.linea_base_historialDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.linea_base_historialUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.linea_base_historialUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>[]
          }
          upsert: {
            args: Prisma.linea_base_historialUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$linea_base_historialPayload>
          }
          aggregate: {
            args: Prisma.Linea_base_historialAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLinea_base_historial>
          }
          groupBy: {
            args: Prisma.linea_base_historialGroupByArgs<ExtArgs>
            result: $Utils.Optional<Linea_base_historialGroupByOutputType>[]
          }
          count: {
            args: Prisma.linea_base_historialCountArgs<ExtArgs>
            result: $Utils.Optional<Linea_base_historialCountAggregateOutputType> | number
          }
        }
      }
      sesiones: {
        payload: Prisma.$sesionesPayload<ExtArgs>
        fields: Prisma.sesionesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sesionesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sesionesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>
          }
          findFirst: {
            args: Prisma.sesionesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sesionesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>
          }
          findMany: {
            args: Prisma.sesionesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>[]
          }
          create: {
            args: Prisma.sesionesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>
          }
          createMany: {
            args: Prisma.sesionesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sesionesCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>[]
          }
          delete: {
            args: Prisma.sesionesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>
          }
          update: {
            args: Prisma.sesionesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>
          }
          deleteMany: {
            args: Prisma.sesionesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sesionesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sesionesUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>[]
          }
          upsert: {
            args: Prisma.sesionesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sesionesPayload>
          }
          aggregate: {
            args: Prisma.SesionesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSesiones>
          }
          groupBy: {
            args: Prisma.sesionesGroupByArgs<ExtArgs>
            result: $Utils.Optional<SesionesGroupByOutputType>[]
          }
          count: {
            args: Prisma.sesionesCountArgs<ExtArgs>
            result: $Utils.Optional<SesionesCountAggregateOutputType> | number
          }
        }
      }
      solicitudes_recuperacion: {
        payload: Prisma.$solicitudes_recuperacionPayload<ExtArgs>
        fields: Prisma.solicitudes_recuperacionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.solicitudes_recuperacionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.solicitudes_recuperacionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>
          }
          findFirst: {
            args: Prisma.solicitudes_recuperacionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.solicitudes_recuperacionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>
          }
          findMany: {
            args: Prisma.solicitudes_recuperacionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>[]
          }
          create: {
            args: Prisma.solicitudes_recuperacionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>
          }
          createMany: {
            args: Prisma.solicitudes_recuperacionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.solicitudes_recuperacionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>[]
          }
          delete: {
            args: Prisma.solicitudes_recuperacionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>
          }
          update: {
            args: Prisma.solicitudes_recuperacionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>
          }
          deleteMany: {
            args: Prisma.solicitudes_recuperacionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.solicitudes_recuperacionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.solicitudes_recuperacionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>[]
          }
          upsert: {
            args: Prisma.solicitudes_recuperacionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$solicitudes_recuperacionPayload>
          }
          aggregate: {
            args: Prisma.Solicitudes_recuperacionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSolicitudes_recuperacion>
          }
          groupBy: {
            args: Prisma.solicitudes_recuperacionGroupByArgs<ExtArgs>
            result: $Utils.Optional<Solicitudes_recuperacionGroupByOutputType>[]
          }
          count: {
            args: Prisma.solicitudes_recuperacionCountArgs<ExtArgs>
            result: $Utils.Optional<Solicitudes_recuperacionCountAggregateOutputType> | number
          }
        }
      }
      usuarios: {
        payload: Prisma.$usuariosPayload<ExtArgs>
        fields: Prisma.usuariosFieldRefs
        operations: {
          findUnique: {
            args: Prisma.usuariosFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.usuariosFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>
          }
          findFirst: {
            args: Prisma.usuariosFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.usuariosFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>
          }
          findMany: {
            args: Prisma.usuariosFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>[]
          }
          create: {
            args: Prisma.usuariosCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>
          }
          createMany: {
            args: Prisma.usuariosCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.usuariosCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>[]
          }
          delete: {
            args: Prisma.usuariosDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>
          }
          update: {
            args: Prisma.usuariosUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>
          }
          deleteMany: {
            args: Prisma.usuariosDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.usuariosUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.usuariosUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>[]
          }
          upsert: {
            args: Prisma.usuariosUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$usuariosPayload>
          }
          aggregate: {
            args: Prisma.UsuariosAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUsuarios>
          }
          groupBy: {
            args: Prisma.usuariosGroupByArgs<ExtArgs>
            result: $Utils.Optional<UsuariosGroupByOutputType>[]
          }
          count: {
            args: Prisma.usuariosCountArgs<ExtArgs>
            result: $Utils.Optional<UsuariosCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    consentimientos?: consentimientosOmit
    linea_base?: linea_baseOmit
    linea_base_historial?: linea_base_historialOmit
    sesiones?: sesionesOmit
    solicitudes_recuperacion?: solicitudes_recuperacionOmit
    usuarios?: usuariosOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ConsentimientosCountOutputType
   */

  export type ConsentimientosCountOutputType = {
    usuarios: number
  }

  export type ConsentimientosCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | ConsentimientosCountOutputTypeCountUsuariosArgs
  }

  // Custom InputTypes
  /**
   * ConsentimientosCountOutputType without action
   */
  export type ConsentimientosCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsentimientosCountOutputType
     */
    select?: ConsentimientosCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConsentimientosCountOutputType without action
   */
  export type ConsentimientosCountOutputTypeCountUsuariosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: usuariosWhereInput
  }


  /**
   * Count Type Linea_baseCountOutputType
   */

  export type Linea_baseCountOutputType = {
    linea_base_historial: number
  }

  export type Linea_baseCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    linea_base_historial?: boolean | Linea_baseCountOutputTypeCountLinea_base_historialArgs
  }

  // Custom InputTypes
  /**
   * Linea_baseCountOutputType without action
   */
  export type Linea_baseCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Linea_baseCountOutputType
     */
    select?: Linea_baseCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * Linea_baseCountOutputType without action
   */
  export type Linea_baseCountOutputTypeCountLinea_base_historialArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: linea_base_historialWhereInput
  }


  /**
   * Count Type UsuariosCountOutputType
   */

  export type UsuariosCountOutputType = {
    linea_base_historial: number
    sesiones: number
    solicitudes_recuperacion: number
  }

  export type UsuariosCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    linea_base_historial?: boolean | UsuariosCountOutputTypeCountLinea_base_historialArgs
    sesiones?: boolean | UsuariosCountOutputTypeCountSesionesArgs
    solicitudes_recuperacion?: boolean | UsuariosCountOutputTypeCountSolicitudes_recuperacionArgs
  }

  // Custom InputTypes
  /**
   * UsuariosCountOutputType without action
   */
  export type UsuariosCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsuariosCountOutputType
     */
    select?: UsuariosCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UsuariosCountOutputType without action
   */
  export type UsuariosCountOutputTypeCountLinea_base_historialArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: linea_base_historialWhereInput
  }

  /**
   * UsuariosCountOutputType without action
   */
  export type UsuariosCountOutputTypeCountSesionesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sesionesWhereInput
  }

  /**
   * UsuariosCountOutputType without action
   */
  export type UsuariosCountOutputTypeCountSolicitudes_recuperacionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: solicitudes_recuperacionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model consentimientos
   */

  export type AggregateConsentimientos = {
    _count: ConsentimientosCountAggregateOutputType | null
    _min: ConsentimientosMinAggregateOutputType | null
    _max: ConsentimientosMaxAggregateOutputType | null
  }

  export type ConsentimientosMinAggregateOutputType = {
    id_consentimiento: string | null
    version_consentimiento: string | null
    vigente: boolean | null
    fecha_invalidacion: Date | null
    motivo_invalidacion: string | null
    url_contenido: string | null
    titulo: string | null
  }

  export type ConsentimientosMaxAggregateOutputType = {
    id_consentimiento: string | null
    version_consentimiento: string | null
    vigente: boolean | null
    fecha_invalidacion: Date | null
    motivo_invalidacion: string | null
    url_contenido: string | null
    titulo: string | null
  }

  export type ConsentimientosCountAggregateOutputType = {
    id_consentimiento: number
    version_consentimiento: number
    vigente: number
    fecha_invalidacion: number
    motivo_invalidacion: number
    url_contenido: number
    titulo: number
    _all: number
  }


  export type ConsentimientosMinAggregateInputType = {
    id_consentimiento?: true
    version_consentimiento?: true
    vigente?: true
    fecha_invalidacion?: true
    motivo_invalidacion?: true
    url_contenido?: true
    titulo?: true
  }

  export type ConsentimientosMaxAggregateInputType = {
    id_consentimiento?: true
    version_consentimiento?: true
    vigente?: true
    fecha_invalidacion?: true
    motivo_invalidacion?: true
    url_contenido?: true
    titulo?: true
  }

  export type ConsentimientosCountAggregateInputType = {
    id_consentimiento?: true
    version_consentimiento?: true
    vigente?: true
    fecha_invalidacion?: true
    motivo_invalidacion?: true
    url_contenido?: true
    titulo?: true
    _all?: true
  }

  export type ConsentimientosAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which consentimientos to aggregate.
     */
    where?: consentimientosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of consentimientos to fetch.
     */
    orderBy?: consentimientosOrderByWithRelationInput | consentimientosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: consentimientosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` consentimientos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` consentimientos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned consentimientos
    **/
    _count?: true | ConsentimientosCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConsentimientosMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConsentimientosMaxAggregateInputType
  }

  export type GetConsentimientosAggregateType<T extends ConsentimientosAggregateArgs> = {
        [P in keyof T & keyof AggregateConsentimientos]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConsentimientos[P]>
      : GetScalarType<T[P], AggregateConsentimientos[P]>
  }




  export type consentimientosGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: consentimientosWhereInput
    orderBy?: consentimientosOrderByWithAggregationInput | consentimientosOrderByWithAggregationInput[]
    by: ConsentimientosScalarFieldEnum[] | ConsentimientosScalarFieldEnum
    having?: consentimientosScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConsentimientosCountAggregateInputType | true
    _min?: ConsentimientosMinAggregateInputType
    _max?: ConsentimientosMaxAggregateInputType
  }

  export type ConsentimientosGroupByOutputType = {
    id_consentimiento: string
    version_consentimiento: string
    vigente: boolean
    fecha_invalidacion: Date | null
    motivo_invalidacion: string | null
    url_contenido: string
    titulo: string
    _count: ConsentimientosCountAggregateOutputType | null
    _min: ConsentimientosMinAggregateOutputType | null
    _max: ConsentimientosMaxAggregateOutputType | null
  }

  type GetConsentimientosGroupByPayload<T extends consentimientosGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConsentimientosGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConsentimientosGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConsentimientosGroupByOutputType[P]>
            : GetScalarType<T[P], ConsentimientosGroupByOutputType[P]>
        }
      >
    >


  export type consentimientosSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_consentimiento?: boolean
    version_consentimiento?: boolean
    vigente?: boolean
    fecha_invalidacion?: boolean
    motivo_invalidacion?: boolean
    url_contenido?: boolean
    titulo?: boolean
    usuarios?: boolean | consentimientos$usuariosArgs<ExtArgs>
    _count?: boolean | ConsentimientosCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["consentimientos"]>

  export type consentimientosSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_consentimiento?: boolean
    version_consentimiento?: boolean
    vigente?: boolean
    fecha_invalidacion?: boolean
    motivo_invalidacion?: boolean
    url_contenido?: boolean
    titulo?: boolean
  }, ExtArgs["result"]["consentimientos"]>

  export type consentimientosSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_consentimiento?: boolean
    version_consentimiento?: boolean
    vigente?: boolean
    fecha_invalidacion?: boolean
    motivo_invalidacion?: boolean
    url_contenido?: boolean
    titulo?: boolean
  }, ExtArgs["result"]["consentimientos"]>

  export type consentimientosSelectScalar = {
    id_consentimiento?: boolean
    version_consentimiento?: boolean
    vigente?: boolean
    fecha_invalidacion?: boolean
    motivo_invalidacion?: boolean
    url_contenido?: boolean
    titulo?: boolean
  }

  export type consentimientosOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id_consentimiento" | "version_consentimiento" | "vigente" | "fecha_invalidacion" | "motivo_invalidacion" | "url_contenido" | "titulo", ExtArgs["result"]["consentimientos"]>
  export type consentimientosInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | consentimientos$usuariosArgs<ExtArgs>
    _count?: boolean | ConsentimientosCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type consentimientosIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type consentimientosIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $consentimientosPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "consentimientos"
    objects: {
      usuarios: Prisma.$usuariosPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id_consentimiento: string
      version_consentimiento: string
      vigente: boolean
      fecha_invalidacion: Date | null
      motivo_invalidacion: string | null
      url_contenido: string
      titulo: string
    }, ExtArgs["result"]["consentimientos"]>
    composites: {}
  }

  type consentimientosGetPayload<S extends boolean | null | undefined | consentimientosDefaultArgs> = $Result.GetResult<Prisma.$consentimientosPayload, S>

  type consentimientosCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<consentimientosFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConsentimientosCountAggregateInputType | true
    }

  export interface consentimientosDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['consentimientos'], meta: { name: 'consentimientos' } }
    /**
     * Find zero or one Consentimientos that matches the filter.
     * @param {consentimientosFindUniqueArgs} args - Arguments to find a Consentimientos
     * @example
     * // Get one Consentimientos
     * const consentimientos = await prisma.consentimientos.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends consentimientosFindUniqueArgs>(args: SelectSubset<T, consentimientosFindUniqueArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Consentimientos that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {consentimientosFindUniqueOrThrowArgs} args - Arguments to find a Consentimientos
     * @example
     * // Get one Consentimientos
     * const consentimientos = await prisma.consentimientos.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends consentimientosFindUniqueOrThrowArgs>(args: SelectSubset<T, consentimientosFindUniqueOrThrowArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Consentimientos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {consentimientosFindFirstArgs} args - Arguments to find a Consentimientos
     * @example
     * // Get one Consentimientos
     * const consentimientos = await prisma.consentimientos.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends consentimientosFindFirstArgs>(args?: SelectSubset<T, consentimientosFindFirstArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Consentimientos that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {consentimientosFindFirstOrThrowArgs} args - Arguments to find a Consentimientos
     * @example
     * // Get one Consentimientos
     * const consentimientos = await prisma.consentimientos.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends consentimientosFindFirstOrThrowArgs>(args?: SelectSubset<T, consentimientosFindFirstOrThrowArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Consentimientos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {consentimientosFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Consentimientos
     * const consentimientos = await prisma.consentimientos.findMany()
     * 
     * // Get first 10 Consentimientos
     * const consentimientos = await prisma.consentimientos.findMany({ take: 10 })
     * 
     * // Only select the `id_consentimiento`
     * const consentimientosWithId_consentimientoOnly = await prisma.consentimientos.findMany({ select: { id_consentimiento: true } })
     * 
     */
    findMany<T extends consentimientosFindManyArgs>(args?: SelectSubset<T, consentimientosFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Consentimientos.
     * @param {consentimientosCreateArgs} args - Arguments to create a Consentimientos.
     * @example
     * // Create one Consentimientos
     * const Consentimientos = await prisma.consentimientos.create({
     *   data: {
     *     // ... data to create a Consentimientos
     *   }
     * })
     * 
     */
    create<T extends consentimientosCreateArgs>(args: SelectSubset<T, consentimientosCreateArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Consentimientos.
     * @param {consentimientosCreateManyArgs} args - Arguments to create many Consentimientos.
     * @example
     * // Create many Consentimientos
     * const consentimientos = await prisma.consentimientos.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends consentimientosCreateManyArgs>(args?: SelectSubset<T, consentimientosCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Consentimientos and returns the data saved in the database.
     * @param {consentimientosCreateManyAndReturnArgs} args - Arguments to create many Consentimientos.
     * @example
     * // Create many Consentimientos
     * const consentimientos = await prisma.consentimientos.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Consentimientos and only return the `id_consentimiento`
     * const consentimientosWithId_consentimientoOnly = await prisma.consentimientos.createManyAndReturn({
     *   select: { id_consentimiento: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends consentimientosCreateManyAndReturnArgs>(args?: SelectSubset<T, consentimientosCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Consentimientos.
     * @param {consentimientosDeleteArgs} args - Arguments to delete one Consentimientos.
     * @example
     * // Delete one Consentimientos
     * const Consentimientos = await prisma.consentimientos.delete({
     *   where: {
     *     // ... filter to delete one Consentimientos
     *   }
     * })
     * 
     */
    delete<T extends consentimientosDeleteArgs>(args: SelectSubset<T, consentimientosDeleteArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Consentimientos.
     * @param {consentimientosUpdateArgs} args - Arguments to update one Consentimientos.
     * @example
     * // Update one Consentimientos
     * const consentimientos = await prisma.consentimientos.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends consentimientosUpdateArgs>(args: SelectSubset<T, consentimientosUpdateArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Consentimientos.
     * @param {consentimientosDeleteManyArgs} args - Arguments to filter Consentimientos to delete.
     * @example
     * // Delete a few Consentimientos
     * const { count } = await prisma.consentimientos.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends consentimientosDeleteManyArgs>(args?: SelectSubset<T, consentimientosDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Consentimientos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {consentimientosUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Consentimientos
     * const consentimientos = await prisma.consentimientos.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends consentimientosUpdateManyArgs>(args: SelectSubset<T, consentimientosUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Consentimientos and returns the data updated in the database.
     * @param {consentimientosUpdateManyAndReturnArgs} args - Arguments to update many Consentimientos.
     * @example
     * // Update many Consentimientos
     * const consentimientos = await prisma.consentimientos.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Consentimientos and only return the `id_consentimiento`
     * const consentimientosWithId_consentimientoOnly = await prisma.consentimientos.updateManyAndReturn({
     *   select: { id_consentimiento: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends consentimientosUpdateManyAndReturnArgs>(args: SelectSubset<T, consentimientosUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Consentimientos.
     * @param {consentimientosUpsertArgs} args - Arguments to update or create a Consentimientos.
     * @example
     * // Update or create a Consentimientos
     * const consentimientos = await prisma.consentimientos.upsert({
     *   create: {
     *     // ... data to create a Consentimientos
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Consentimientos we want to update
     *   }
     * })
     */
    upsert<T extends consentimientosUpsertArgs>(args: SelectSubset<T, consentimientosUpsertArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Consentimientos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {consentimientosCountArgs} args - Arguments to filter Consentimientos to count.
     * @example
     * // Count the number of Consentimientos
     * const count = await prisma.consentimientos.count({
     *   where: {
     *     // ... the filter for the Consentimientos we want to count
     *   }
     * })
    **/
    count<T extends consentimientosCountArgs>(
      args?: Subset<T, consentimientosCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConsentimientosCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Consentimientos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsentimientosAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConsentimientosAggregateArgs>(args: Subset<T, ConsentimientosAggregateArgs>): Prisma.PrismaPromise<GetConsentimientosAggregateType<T>>

    /**
     * Group by Consentimientos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {consentimientosGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends consentimientosGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: consentimientosGroupByArgs['orderBy'] }
        : { orderBy?: consentimientosGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, consentimientosGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConsentimientosGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the consentimientos model
   */
  readonly fields: consentimientosFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for consentimientos.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__consentimientosClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    usuarios<T extends consentimientos$usuariosArgs<ExtArgs> = {}>(args?: Subset<T, consentimientos$usuariosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the consentimientos model
   */
  interface consentimientosFieldRefs {
    readonly id_consentimiento: FieldRef<"consentimientos", 'String'>
    readonly version_consentimiento: FieldRef<"consentimientos", 'String'>
    readonly vigente: FieldRef<"consentimientos", 'Boolean'>
    readonly fecha_invalidacion: FieldRef<"consentimientos", 'DateTime'>
    readonly motivo_invalidacion: FieldRef<"consentimientos", 'String'>
    readonly url_contenido: FieldRef<"consentimientos", 'String'>
    readonly titulo: FieldRef<"consentimientos", 'String'>
  }
    

  // Custom InputTypes
  /**
   * consentimientos findUnique
   */
  export type consentimientosFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * Filter, which consentimientos to fetch.
     */
    where: consentimientosWhereUniqueInput
  }

  /**
   * consentimientos findUniqueOrThrow
   */
  export type consentimientosFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * Filter, which consentimientos to fetch.
     */
    where: consentimientosWhereUniqueInput
  }

  /**
   * consentimientos findFirst
   */
  export type consentimientosFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * Filter, which consentimientos to fetch.
     */
    where?: consentimientosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of consentimientos to fetch.
     */
    orderBy?: consentimientosOrderByWithRelationInput | consentimientosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for consentimientos.
     */
    cursor?: consentimientosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` consentimientos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` consentimientos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of consentimientos.
     */
    distinct?: ConsentimientosScalarFieldEnum | ConsentimientosScalarFieldEnum[]
  }

  /**
   * consentimientos findFirstOrThrow
   */
  export type consentimientosFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * Filter, which consentimientos to fetch.
     */
    where?: consentimientosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of consentimientos to fetch.
     */
    orderBy?: consentimientosOrderByWithRelationInput | consentimientosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for consentimientos.
     */
    cursor?: consentimientosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` consentimientos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` consentimientos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of consentimientos.
     */
    distinct?: ConsentimientosScalarFieldEnum | ConsentimientosScalarFieldEnum[]
  }

  /**
   * consentimientos findMany
   */
  export type consentimientosFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * Filter, which consentimientos to fetch.
     */
    where?: consentimientosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of consentimientos to fetch.
     */
    orderBy?: consentimientosOrderByWithRelationInput | consentimientosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing consentimientos.
     */
    cursor?: consentimientosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` consentimientos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` consentimientos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of consentimientos.
     */
    distinct?: ConsentimientosScalarFieldEnum | ConsentimientosScalarFieldEnum[]
  }

  /**
   * consentimientos create
   */
  export type consentimientosCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * The data needed to create a consentimientos.
     */
    data: XOR<consentimientosCreateInput, consentimientosUncheckedCreateInput>
  }

  /**
   * consentimientos createMany
   */
  export type consentimientosCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many consentimientos.
     */
    data: consentimientosCreateManyInput | consentimientosCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * consentimientos createManyAndReturn
   */
  export type consentimientosCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * The data used to create many consentimientos.
     */
    data: consentimientosCreateManyInput | consentimientosCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * consentimientos update
   */
  export type consentimientosUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * The data needed to update a consentimientos.
     */
    data: XOR<consentimientosUpdateInput, consentimientosUncheckedUpdateInput>
    /**
     * Choose, which consentimientos to update.
     */
    where: consentimientosWhereUniqueInput
  }

  /**
   * consentimientos updateMany
   */
  export type consentimientosUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update consentimientos.
     */
    data: XOR<consentimientosUpdateManyMutationInput, consentimientosUncheckedUpdateManyInput>
    /**
     * Filter which consentimientos to update
     */
    where?: consentimientosWhereInput
    /**
     * Limit how many consentimientos to update.
     */
    limit?: number
  }

  /**
   * consentimientos updateManyAndReturn
   */
  export type consentimientosUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * The data used to update consentimientos.
     */
    data: XOR<consentimientosUpdateManyMutationInput, consentimientosUncheckedUpdateManyInput>
    /**
     * Filter which consentimientos to update
     */
    where?: consentimientosWhereInput
    /**
     * Limit how many consentimientos to update.
     */
    limit?: number
  }

  /**
   * consentimientos upsert
   */
  export type consentimientosUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * The filter to search for the consentimientos to update in case it exists.
     */
    where: consentimientosWhereUniqueInput
    /**
     * In case the consentimientos found by the `where` argument doesn't exist, create a new consentimientos with this data.
     */
    create: XOR<consentimientosCreateInput, consentimientosUncheckedCreateInput>
    /**
     * In case the consentimientos was found with the provided `where` argument, update it with this data.
     */
    update: XOR<consentimientosUpdateInput, consentimientosUncheckedUpdateInput>
  }

  /**
   * consentimientos delete
   */
  export type consentimientosDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
    /**
     * Filter which consentimientos to delete.
     */
    where: consentimientosWhereUniqueInput
  }

  /**
   * consentimientos deleteMany
   */
  export type consentimientosDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which consentimientos to delete
     */
    where?: consentimientosWhereInput
    /**
     * Limit how many consentimientos to delete.
     */
    limit?: number
  }

  /**
   * consentimientos.usuarios
   */
  export type consentimientos$usuariosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    where?: usuariosWhereInput
    orderBy?: usuariosOrderByWithRelationInput | usuariosOrderByWithRelationInput[]
    cursor?: usuariosWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UsuariosScalarFieldEnum | UsuariosScalarFieldEnum[]
  }

  /**
   * consentimientos without action
   */
  export type consentimientosDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the consentimientos
     */
    select?: consentimientosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the consentimientos
     */
    omit?: consentimientosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: consentimientosInclude<ExtArgs> | null
  }


  /**
   * Model linea_base
   */

  export type AggregateLinea_base = {
    _count: Linea_baseCountAggregateOutputType | null
    _avg: Linea_baseAvgAggregateOutputType | null
    _sum: Linea_baseSumAggregateOutputType | null
    _min: Linea_baseMinAggregateOutputType | null
    _max: Linea_baseMaxAggregateOutputType | null
  }

  export type Linea_baseAvgAggregateOutputType = {
    semestre_cursado: number | null
    frecuencia_consumo: number | null
  }

  export type Linea_baseSumAggregateOutputType = {
    semestre_cursado: number | null
    frecuencia_consumo: number | null
  }

  export type Linea_baseMinAggregateOutputType = {
    id_linea_base: string | null
    id_usuario: string | null
    entidad_educativa: string | null
    programa_academico: string | null
    semestre_cursado: number | null
    nivel_academico: $Enums.nivel_academico_enum | null
    ciudad: string | null
    fecha_inicio_consumo: Date | null
    motivo_inicio_consumo: $Enums.motivo_consumo_enum | null
    fecha_ultimo_consumo: Date | null
    frecuencia_consumo: number | null
    fecha_creacion: Date | null
    fecha_actualizacion: Date | null
    fecha_nacimiento: Date | null
  }

  export type Linea_baseMaxAggregateOutputType = {
    id_linea_base: string | null
    id_usuario: string | null
    entidad_educativa: string | null
    programa_academico: string | null
    semestre_cursado: number | null
    nivel_academico: $Enums.nivel_academico_enum | null
    ciudad: string | null
    fecha_inicio_consumo: Date | null
    motivo_inicio_consumo: $Enums.motivo_consumo_enum | null
    fecha_ultimo_consumo: Date | null
    frecuencia_consumo: number | null
    fecha_creacion: Date | null
    fecha_actualizacion: Date | null
    fecha_nacimiento: Date | null
  }

  export type Linea_baseCountAggregateOutputType = {
    id_linea_base: number
    id_usuario: number
    entidad_educativa: number
    programa_academico: number
    semestre_cursado: number
    nivel_academico: number
    ciudad: number
    fecha_inicio_consumo: number
    motivo_inicio_consumo: number
    fecha_ultimo_consumo: number
    frecuencia_consumo: number
    fecha_creacion: number
    fecha_actualizacion: number
    fecha_nacimiento: number
    _all: number
  }


  export type Linea_baseAvgAggregateInputType = {
    semestre_cursado?: true
    frecuencia_consumo?: true
  }

  export type Linea_baseSumAggregateInputType = {
    semestre_cursado?: true
    frecuencia_consumo?: true
  }

  export type Linea_baseMinAggregateInputType = {
    id_linea_base?: true
    id_usuario?: true
    entidad_educativa?: true
    programa_academico?: true
    semestre_cursado?: true
    nivel_academico?: true
    ciudad?: true
    fecha_inicio_consumo?: true
    motivo_inicio_consumo?: true
    fecha_ultimo_consumo?: true
    frecuencia_consumo?: true
    fecha_creacion?: true
    fecha_actualizacion?: true
    fecha_nacimiento?: true
  }

  export type Linea_baseMaxAggregateInputType = {
    id_linea_base?: true
    id_usuario?: true
    entidad_educativa?: true
    programa_academico?: true
    semestre_cursado?: true
    nivel_academico?: true
    ciudad?: true
    fecha_inicio_consumo?: true
    motivo_inicio_consumo?: true
    fecha_ultimo_consumo?: true
    frecuencia_consumo?: true
    fecha_creacion?: true
    fecha_actualizacion?: true
    fecha_nacimiento?: true
  }

  export type Linea_baseCountAggregateInputType = {
    id_linea_base?: true
    id_usuario?: true
    entidad_educativa?: true
    programa_academico?: true
    semestre_cursado?: true
    nivel_academico?: true
    ciudad?: true
    fecha_inicio_consumo?: true
    motivo_inicio_consumo?: true
    fecha_ultimo_consumo?: true
    frecuencia_consumo?: true
    fecha_creacion?: true
    fecha_actualizacion?: true
    fecha_nacimiento?: true
    _all?: true
  }

  export type Linea_baseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which linea_base to aggregate.
     */
    where?: linea_baseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_bases to fetch.
     */
    orderBy?: linea_baseOrderByWithRelationInput | linea_baseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: linea_baseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_bases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_bases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned linea_bases
    **/
    _count?: true | Linea_baseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Linea_baseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Linea_baseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Linea_baseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Linea_baseMaxAggregateInputType
  }

  export type GetLinea_baseAggregateType<T extends Linea_baseAggregateArgs> = {
        [P in keyof T & keyof AggregateLinea_base]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLinea_base[P]>
      : GetScalarType<T[P], AggregateLinea_base[P]>
  }




  export type linea_baseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: linea_baseWhereInput
    orderBy?: linea_baseOrderByWithAggregationInput | linea_baseOrderByWithAggregationInput[]
    by: Linea_baseScalarFieldEnum[] | Linea_baseScalarFieldEnum
    having?: linea_baseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Linea_baseCountAggregateInputType | true
    _avg?: Linea_baseAvgAggregateInputType
    _sum?: Linea_baseSumAggregateInputType
    _min?: Linea_baseMinAggregateInputType
    _max?: Linea_baseMaxAggregateInputType
  }

  export type Linea_baseGroupByOutputType = {
    id_linea_base: string
    id_usuario: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date
    frecuencia_consumo: number
    fecha_creacion: Date
    fecha_actualizacion: Date
    fecha_nacimiento: Date | null
    _count: Linea_baseCountAggregateOutputType | null
    _avg: Linea_baseAvgAggregateOutputType | null
    _sum: Linea_baseSumAggregateOutputType | null
    _min: Linea_baseMinAggregateOutputType | null
    _max: Linea_baseMaxAggregateOutputType | null
  }

  type GetLinea_baseGroupByPayload<T extends linea_baseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Linea_baseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Linea_baseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Linea_baseGroupByOutputType[P]>
            : GetScalarType<T[P], Linea_baseGroupByOutputType[P]>
        }
      >
    >


  export type linea_baseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_linea_base?: boolean
    id_usuario?: boolean
    entidad_educativa?: boolean
    programa_academico?: boolean
    semestre_cursado?: boolean
    nivel_academico?: boolean
    ciudad?: boolean
    fecha_inicio_consumo?: boolean
    motivo_inicio_consumo?: boolean
    fecha_ultimo_consumo?: boolean
    frecuencia_consumo?: boolean
    fecha_creacion?: boolean
    fecha_actualizacion?: boolean
    fecha_nacimiento?: boolean
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
    linea_base_historial?: boolean | linea_base$linea_base_historialArgs<ExtArgs>
    _count?: boolean | Linea_baseCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linea_base"]>

  export type linea_baseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_linea_base?: boolean
    id_usuario?: boolean
    entidad_educativa?: boolean
    programa_academico?: boolean
    semestre_cursado?: boolean
    nivel_academico?: boolean
    ciudad?: boolean
    fecha_inicio_consumo?: boolean
    motivo_inicio_consumo?: boolean
    fecha_ultimo_consumo?: boolean
    frecuencia_consumo?: boolean
    fecha_creacion?: boolean
    fecha_actualizacion?: boolean
    fecha_nacimiento?: boolean
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linea_base"]>

  export type linea_baseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_linea_base?: boolean
    id_usuario?: boolean
    entidad_educativa?: boolean
    programa_academico?: boolean
    semestre_cursado?: boolean
    nivel_academico?: boolean
    ciudad?: boolean
    fecha_inicio_consumo?: boolean
    motivo_inicio_consumo?: boolean
    fecha_ultimo_consumo?: boolean
    frecuencia_consumo?: boolean
    fecha_creacion?: boolean
    fecha_actualizacion?: boolean
    fecha_nacimiento?: boolean
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linea_base"]>

  export type linea_baseSelectScalar = {
    id_linea_base?: boolean
    id_usuario?: boolean
    entidad_educativa?: boolean
    programa_academico?: boolean
    semestre_cursado?: boolean
    nivel_academico?: boolean
    ciudad?: boolean
    fecha_inicio_consumo?: boolean
    motivo_inicio_consumo?: boolean
    fecha_ultimo_consumo?: boolean
    frecuencia_consumo?: boolean
    fecha_creacion?: boolean
    fecha_actualizacion?: boolean
    fecha_nacimiento?: boolean
  }

  export type linea_baseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id_linea_base" | "id_usuario" | "entidad_educativa" | "programa_academico" | "semestre_cursado" | "nivel_academico" | "ciudad" | "fecha_inicio_consumo" | "motivo_inicio_consumo" | "fecha_ultimo_consumo" | "frecuencia_consumo" | "fecha_creacion" | "fecha_actualizacion" | "fecha_nacimiento", ExtArgs["result"]["linea_base"]>
  export type linea_baseInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
    linea_base_historial?: boolean | linea_base$linea_base_historialArgs<ExtArgs>
    _count?: boolean | Linea_baseCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type linea_baseIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }
  export type linea_baseIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }

  export type $linea_basePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "linea_base"
    objects: {
      usuarios: Prisma.$usuariosPayload<ExtArgs>
      linea_base_historial: Prisma.$linea_base_historialPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id_linea_base: string
      id_usuario: string
      entidad_educativa: string
      programa_academico: string
      semestre_cursado: number
      nivel_academico: $Enums.nivel_academico_enum
      ciudad: string
      fecha_inicio_consumo: Date
      motivo_inicio_consumo: $Enums.motivo_consumo_enum
      fecha_ultimo_consumo: Date
      frecuencia_consumo: number
      fecha_creacion: Date
      fecha_actualizacion: Date
      fecha_nacimiento: Date | null
    }, ExtArgs["result"]["linea_base"]>
    composites: {}
  }

  type linea_baseGetPayload<S extends boolean | null | undefined | linea_baseDefaultArgs> = $Result.GetResult<Prisma.$linea_basePayload, S>

  type linea_baseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<linea_baseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Linea_baseCountAggregateInputType | true
    }

  export interface linea_baseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['linea_base'], meta: { name: 'linea_base' } }
    /**
     * Find zero or one Linea_base that matches the filter.
     * @param {linea_baseFindUniqueArgs} args - Arguments to find a Linea_base
     * @example
     * // Get one Linea_base
     * const linea_base = await prisma.linea_base.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends linea_baseFindUniqueArgs>(args: SelectSubset<T, linea_baseFindUniqueArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Linea_base that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {linea_baseFindUniqueOrThrowArgs} args - Arguments to find a Linea_base
     * @example
     * // Get one Linea_base
     * const linea_base = await prisma.linea_base.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends linea_baseFindUniqueOrThrowArgs>(args: SelectSubset<T, linea_baseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Linea_base that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_baseFindFirstArgs} args - Arguments to find a Linea_base
     * @example
     * // Get one Linea_base
     * const linea_base = await prisma.linea_base.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends linea_baseFindFirstArgs>(args?: SelectSubset<T, linea_baseFindFirstArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Linea_base that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_baseFindFirstOrThrowArgs} args - Arguments to find a Linea_base
     * @example
     * // Get one Linea_base
     * const linea_base = await prisma.linea_base.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends linea_baseFindFirstOrThrowArgs>(args?: SelectSubset<T, linea_baseFindFirstOrThrowArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Linea_bases that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_baseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Linea_bases
     * const linea_bases = await prisma.linea_base.findMany()
     * 
     * // Get first 10 Linea_bases
     * const linea_bases = await prisma.linea_base.findMany({ take: 10 })
     * 
     * // Only select the `id_linea_base`
     * const linea_baseWithId_linea_baseOnly = await prisma.linea_base.findMany({ select: { id_linea_base: true } })
     * 
     */
    findMany<T extends linea_baseFindManyArgs>(args?: SelectSubset<T, linea_baseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Linea_base.
     * @param {linea_baseCreateArgs} args - Arguments to create a Linea_base.
     * @example
     * // Create one Linea_base
     * const Linea_base = await prisma.linea_base.create({
     *   data: {
     *     // ... data to create a Linea_base
     *   }
     * })
     * 
     */
    create<T extends linea_baseCreateArgs>(args: SelectSubset<T, linea_baseCreateArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Linea_bases.
     * @param {linea_baseCreateManyArgs} args - Arguments to create many Linea_bases.
     * @example
     * // Create many Linea_bases
     * const linea_base = await prisma.linea_base.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends linea_baseCreateManyArgs>(args?: SelectSubset<T, linea_baseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Linea_bases and returns the data saved in the database.
     * @param {linea_baseCreateManyAndReturnArgs} args - Arguments to create many Linea_bases.
     * @example
     * // Create many Linea_bases
     * const linea_base = await prisma.linea_base.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Linea_bases and only return the `id_linea_base`
     * const linea_baseWithId_linea_baseOnly = await prisma.linea_base.createManyAndReturn({
     *   select: { id_linea_base: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends linea_baseCreateManyAndReturnArgs>(args?: SelectSubset<T, linea_baseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Linea_base.
     * @param {linea_baseDeleteArgs} args - Arguments to delete one Linea_base.
     * @example
     * // Delete one Linea_base
     * const Linea_base = await prisma.linea_base.delete({
     *   where: {
     *     // ... filter to delete one Linea_base
     *   }
     * })
     * 
     */
    delete<T extends linea_baseDeleteArgs>(args: SelectSubset<T, linea_baseDeleteArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Linea_base.
     * @param {linea_baseUpdateArgs} args - Arguments to update one Linea_base.
     * @example
     * // Update one Linea_base
     * const linea_base = await prisma.linea_base.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends linea_baseUpdateArgs>(args: SelectSubset<T, linea_baseUpdateArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Linea_bases.
     * @param {linea_baseDeleteManyArgs} args - Arguments to filter Linea_bases to delete.
     * @example
     * // Delete a few Linea_bases
     * const { count } = await prisma.linea_base.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends linea_baseDeleteManyArgs>(args?: SelectSubset<T, linea_baseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Linea_bases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_baseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Linea_bases
     * const linea_base = await prisma.linea_base.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends linea_baseUpdateManyArgs>(args: SelectSubset<T, linea_baseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Linea_bases and returns the data updated in the database.
     * @param {linea_baseUpdateManyAndReturnArgs} args - Arguments to update many Linea_bases.
     * @example
     * // Update many Linea_bases
     * const linea_base = await prisma.linea_base.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Linea_bases and only return the `id_linea_base`
     * const linea_baseWithId_linea_baseOnly = await prisma.linea_base.updateManyAndReturn({
     *   select: { id_linea_base: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends linea_baseUpdateManyAndReturnArgs>(args: SelectSubset<T, linea_baseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Linea_base.
     * @param {linea_baseUpsertArgs} args - Arguments to update or create a Linea_base.
     * @example
     * // Update or create a Linea_base
     * const linea_base = await prisma.linea_base.upsert({
     *   create: {
     *     // ... data to create a Linea_base
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Linea_base we want to update
     *   }
     * })
     */
    upsert<T extends linea_baseUpsertArgs>(args: SelectSubset<T, linea_baseUpsertArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Linea_bases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_baseCountArgs} args - Arguments to filter Linea_bases to count.
     * @example
     * // Count the number of Linea_bases
     * const count = await prisma.linea_base.count({
     *   where: {
     *     // ... the filter for the Linea_bases we want to count
     *   }
     * })
    **/
    count<T extends linea_baseCountArgs>(
      args?: Subset<T, linea_baseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Linea_baseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Linea_base.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Linea_baseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Linea_baseAggregateArgs>(args: Subset<T, Linea_baseAggregateArgs>): Prisma.PrismaPromise<GetLinea_baseAggregateType<T>>

    /**
     * Group by Linea_base.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_baseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends linea_baseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: linea_baseGroupByArgs['orderBy'] }
        : { orderBy?: linea_baseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, linea_baseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLinea_baseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the linea_base model
   */
  readonly fields: linea_baseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for linea_base.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__linea_baseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    usuarios<T extends usuariosDefaultArgs<ExtArgs> = {}>(args?: Subset<T, usuariosDefaultArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    linea_base_historial<T extends linea_base$linea_base_historialArgs<ExtArgs> = {}>(args?: Subset<T, linea_base$linea_base_historialArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the linea_base model
   */
  interface linea_baseFieldRefs {
    readonly id_linea_base: FieldRef<"linea_base", 'String'>
    readonly id_usuario: FieldRef<"linea_base", 'String'>
    readonly entidad_educativa: FieldRef<"linea_base", 'String'>
    readonly programa_academico: FieldRef<"linea_base", 'String'>
    readonly semestre_cursado: FieldRef<"linea_base", 'Int'>
    readonly nivel_academico: FieldRef<"linea_base", 'nivel_academico_enum'>
    readonly ciudad: FieldRef<"linea_base", 'String'>
    readonly fecha_inicio_consumo: FieldRef<"linea_base", 'DateTime'>
    readonly motivo_inicio_consumo: FieldRef<"linea_base", 'motivo_consumo_enum'>
    readonly fecha_ultimo_consumo: FieldRef<"linea_base", 'DateTime'>
    readonly frecuencia_consumo: FieldRef<"linea_base", 'Int'>
    readonly fecha_creacion: FieldRef<"linea_base", 'DateTime'>
    readonly fecha_actualizacion: FieldRef<"linea_base", 'DateTime'>
    readonly fecha_nacimiento: FieldRef<"linea_base", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * linea_base findUnique
   */
  export type linea_baseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * Filter, which linea_base to fetch.
     */
    where: linea_baseWhereUniqueInput
  }

  /**
   * linea_base findUniqueOrThrow
   */
  export type linea_baseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * Filter, which linea_base to fetch.
     */
    where: linea_baseWhereUniqueInput
  }

  /**
   * linea_base findFirst
   */
  export type linea_baseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * Filter, which linea_base to fetch.
     */
    where?: linea_baseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_bases to fetch.
     */
    orderBy?: linea_baseOrderByWithRelationInput | linea_baseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for linea_bases.
     */
    cursor?: linea_baseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_bases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_bases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of linea_bases.
     */
    distinct?: Linea_baseScalarFieldEnum | Linea_baseScalarFieldEnum[]
  }

  /**
   * linea_base findFirstOrThrow
   */
  export type linea_baseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * Filter, which linea_base to fetch.
     */
    where?: linea_baseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_bases to fetch.
     */
    orderBy?: linea_baseOrderByWithRelationInput | linea_baseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for linea_bases.
     */
    cursor?: linea_baseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_bases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_bases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of linea_bases.
     */
    distinct?: Linea_baseScalarFieldEnum | Linea_baseScalarFieldEnum[]
  }

  /**
   * linea_base findMany
   */
  export type linea_baseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * Filter, which linea_bases to fetch.
     */
    where?: linea_baseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_bases to fetch.
     */
    orderBy?: linea_baseOrderByWithRelationInput | linea_baseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing linea_bases.
     */
    cursor?: linea_baseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_bases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_bases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of linea_bases.
     */
    distinct?: Linea_baseScalarFieldEnum | Linea_baseScalarFieldEnum[]
  }

  /**
   * linea_base create
   */
  export type linea_baseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * The data needed to create a linea_base.
     */
    data: XOR<linea_baseCreateInput, linea_baseUncheckedCreateInput>
  }

  /**
   * linea_base createMany
   */
  export type linea_baseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many linea_bases.
     */
    data: linea_baseCreateManyInput | linea_baseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * linea_base createManyAndReturn
   */
  export type linea_baseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * The data used to create many linea_bases.
     */
    data: linea_baseCreateManyInput | linea_baseCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * linea_base update
   */
  export type linea_baseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * The data needed to update a linea_base.
     */
    data: XOR<linea_baseUpdateInput, linea_baseUncheckedUpdateInput>
    /**
     * Choose, which linea_base to update.
     */
    where: linea_baseWhereUniqueInput
  }

  /**
   * linea_base updateMany
   */
  export type linea_baseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update linea_bases.
     */
    data: XOR<linea_baseUpdateManyMutationInput, linea_baseUncheckedUpdateManyInput>
    /**
     * Filter which linea_bases to update
     */
    where?: linea_baseWhereInput
    /**
     * Limit how many linea_bases to update.
     */
    limit?: number
  }

  /**
   * linea_base updateManyAndReturn
   */
  export type linea_baseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * The data used to update linea_bases.
     */
    data: XOR<linea_baseUpdateManyMutationInput, linea_baseUncheckedUpdateManyInput>
    /**
     * Filter which linea_bases to update
     */
    where?: linea_baseWhereInput
    /**
     * Limit how many linea_bases to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * linea_base upsert
   */
  export type linea_baseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * The filter to search for the linea_base to update in case it exists.
     */
    where: linea_baseWhereUniqueInput
    /**
     * In case the linea_base found by the `where` argument doesn't exist, create a new linea_base with this data.
     */
    create: XOR<linea_baseCreateInput, linea_baseUncheckedCreateInput>
    /**
     * In case the linea_base was found with the provided `where` argument, update it with this data.
     */
    update: XOR<linea_baseUpdateInput, linea_baseUncheckedUpdateInput>
  }

  /**
   * linea_base delete
   */
  export type linea_baseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    /**
     * Filter which linea_base to delete.
     */
    where: linea_baseWhereUniqueInput
  }

  /**
   * linea_base deleteMany
   */
  export type linea_baseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which linea_bases to delete
     */
    where?: linea_baseWhereInput
    /**
     * Limit how many linea_bases to delete.
     */
    limit?: number
  }

  /**
   * linea_base.linea_base_historial
   */
  export type linea_base$linea_base_historialArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    where?: linea_base_historialWhereInput
    orderBy?: linea_base_historialOrderByWithRelationInput | linea_base_historialOrderByWithRelationInput[]
    cursor?: linea_base_historialWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Linea_base_historialScalarFieldEnum | Linea_base_historialScalarFieldEnum[]
  }

  /**
   * linea_base without action
   */
  export type linea_baseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
  }


  /**
   * Model linea_base_historial
   */

  export type AggregateLinea_base_historial = {
    _count: Linea_base_historialCountAggregateOutputType | null
    _avg: Linea_base_historialAvgAggregateOutputType | null
    _sum: Linea_base_historialSumAggregateOutputType | null
    _min: Linea_base_historialMinAggregateOutputType | null
    _max: Linea_base_historialMaxAggregateOutputType | null
  }

  export type Linea_base_historialAvgAggregateOutputType = {
    id_historial: number | null
  }

  export type Linea_base_historialSumAggregateOutputType = {
    id_historial: bigint | null
  }

  export type Linea_base_historialMinAggregateOutputType = {
    id_historial: bigint | null
    id_linea_base: string | null
    id_usuario: string | null
    fecha_modificacion: Date | null
  }

  export type Linea_base_historialMaxAggregateOutputType = {
    id_historial: bigint | null
    id_linea_base: string | null
    id_usuario: string | null
    fecha_modificacion: Date | null
  }

  export type Linea_base_historialCountAggregateOutputType = {
    id_historial: number
    id_linea_base: number
    id_usuario: number
    campos_modificados: number
    datos_anteriores: number
    fecha_modificacion: number
    _all: number
  }


  export type Linea_base_historialAvgAggregateInputType = {
    id_historial?: true
  }

  export type Linea_base_historialSumAggregateInputType = {
    id_historial?: true
  }

  export type Linea_base_historialMinAggregateInputType = {
    id_historial?: true
    id_linea_base?: true
    id_usuario?: true
    fecha_modificacion?: true
  }

  export type Linea_base_historialMaxAggregateInputType = {
    id_historial?: true
    id_linea_base?: true
    id_usuario?: true
    fecha_modificacion?: true
  }

  export type Linea_base_historialCountAggregateInputType = {
    id_historial?: true
    id_linea_base?: true
    id_usuario?: true
    campos_modificados?: true
    datos_anteriores?: true
    fecha_modificacion?: true
    _all?: true
  }

  export type Linea_base_historialAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which linea_base_historial to aggregate.
     */
    where?: linea_base_historialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_base_historials to fetch.
     */
    orderBy?: linea_base_historialOrderByWithRelationInput | linea_base_historialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: linea_base_historialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_base_historials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_base_historials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned linea_base_historials
    **/
    _count?: true | Linea_base_historialCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Linea_base_historialAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Linea_base_historialSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Linea_base_historialMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Linea_base_historialMaxAggregateInputType
  }

  export type GetLinea_base_historialAggregateType<T extends Linea_base_historialAggregateArgs> = {
        [P in keyof T & keyof AggregateLinea_base_historial]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLinea_base_historial[P]>
      : GetScalarType<T[P], AggregateLinea_base_historial[P]>
  }




  export type linea_base_historialGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: linea_base_historialWhereInput
    orderBy?: linea_base_historialOrderByWithAggregationInput | linea_base_historialOrderByWithAggregationInput[]
    by: Linea_base_historialScalarFieldEnum[] | Linea_base_historialScalarFieldEnum
    having?: linea_base_historialScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Linea_base_historialCountAggregateInputType | true
    _avg?: Linea_base_historialAvgAggregateInputType
    _sum?: Linea_base_historialSumAggregateInputType
    _min?: Linea_base_historialMinAggregateInputType
    _max?: Linea_base_historialMaxAggregateInputType
  }

  export type Linea_base_historialGroupByOutputType = {
    id_historial: bigint
    id_linea_base: string
    id_usuario: string
    campos_modificados: string[]
    datos_anteriores: JsonValue
    fecha_modificacion: Date
    _count: Linea_base_historialCountAggregateOutputType | null
    _avg: Linea_base_historialAvgAggregateOutputType | null
    _sum: Linea_base_historialSumAggregateOutputType | null
    _min: Linea_base_historialMinAggregateOutputType | null
    _max: Linea_base_historialMaxAggregateOutputType | null
  }

  type GetLinea_base_historialGroupByPayload<T extends linea_base_historialGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Linea_base_historialGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Linea_base_historialGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Linea_base_historialGroupByOutputType[P]>
            : GetScalarType<T[P], Linea_base_historialGroupByOutputType[P]>
        }
      >
    >


  export type linea_base_historialSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_historial?: boolean
    id_linea_base?: boolean
    id_usuario?: boolean
    campos_modificados?: boolean
    datos_anteriores?: boolean
    fecha_modificacion?: boolean
    linea_base?: boolean | linea_baseDefaultArgs<ExtArgs>
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linea_base_historial"]>

  export type linea_base_historialSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_historial?: boolean
    id_linea_base?: boolean
    id_usuario?: boolean
    campos_modificados?: boolean
    datos_anteriores?: boolean
    fecha_modificacion?: boolean
    linea_base?: boolean | linea_baseDefaultArgs<ExtArgs>
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linea_base_historial"]>

  export type linea_base_historialSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_historial?: boolean
    id_linea_base?: boolean
    id_usuario?: boolean
    campos_modificados?: boolean
    datos_anteriores?: boolean
    fecha_modificacion?: boolean
    linea_base?: boolean | linea_baseDefaultArgs<ExtArgs>
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["linea_base_historial"]>

  export type linea_base_historialSelectScalar = {
    id_historial?: boolean
    id_linea_base?: boolean
    id_usuario?: boolean
    campos_modificados?: boolean
    datos_anteriores?: boolean
    fecha_modificacion?: boolean
  }

  export type linea_base_historialOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id_historial" | "id_linea_base" | "id_usuario" | "campos_modificados" | "datos_anteriores" | "fecha_modificacion", ExtArgs["result"]["linea_base_historial"]>
  export type linea_base_historialInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    linea_base?: boolean | linea_baseDefaultArgs<ExtArgs>
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }
  export type linea_base_historialIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    linea_base?: boolean | linea_baseDefaultArgs<ExtArgs>
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }
  export type linea_base_historialIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    linea_base?: boolean | linea_baseDefaultArgs<ExtArgs>
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }

  export type $linea_base_historialPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "linea_base_historial"
    objects: {
      linea_base: Prisma.$linea_basePayload<ExtArgs>
      usuarios: Prisma.$usuariosPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id_historial: bigint
      id_linea_base: string
      id_usuario: string
      campos_modificados: string[]
      datos_anteriores: Prisma.JsonValue
      fecha_modificacion: Date
    }, ExtArgs["result"]["linea_base_historial"]>
    composites: {}
  }

  type linea_base_historialGetPayload<S extends boolean | null | undefined | linea_base_historialDefaultArgs> = $Result.GetResult<Prisma.$linea_base_historialPayload, S>

  type linea_base_historialCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<linea_base_historialFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Linea_base_historialCountAggregateInputType | true
    }

  export interface linea_base_historialDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['linea_base_historial'], meta: { name: 'linea_base_historial' } }
    /**
     * Find zero or one Linea_base_historial that matches the filter.
     * @param {linea_base_historialFindUniqueArgs} args - Arguments to find a Linea_base_historial
     * @example
     * // Get one Linea_base_historial
     * const linea_base_historial = await prisma.linea_base_historial.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends linea_base_historialFindUniqueArgs>(args: SelectSubset<T, linea_base_historialFindUniqueArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Linea_base_historial that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {linea_base_historialFindUniqueOrThrowArgs} args - Arguments to find a Linea_base_historial
     * @example
     * // Get one Linea_base_historial
     * const linea_base_historial = await prisma.linea_base_historial.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends linea_base_historialFindUniqueOrThrowArgs>(args: SelectSubset<T, linea_base_historialFindUniqueOrThrowArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Linea_base_historial that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_base_historialFindFirstArgs} args - Arguments to find a Linea_base_historial
     * @example
     * // Get one Linea_base_historial
     * const linea_base_historial = await prisma.linea_base_historial.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends linea_base_historialFindFirstArgs>(args?: SelectSubset<T, linea_base_historialFindFirstArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Linea_base_historial that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_base_historialFindFirstOrThrowArgs} args - Arguments to find a Linea_base_historial
     * @example
     * // Get one Linea_base_historial
     * const linea_base_historial = await prisma.linea_base_historial.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends linea_base_historialFindFirstOrThrowArgs>(args?: SelectSubset<T, linea_base_historialFindFirstOrThrowArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Linea_base_historials that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_base_historialFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Linea_base_historials
     * const linea_base_historials = await prisma.linea_base_historial.findMany()
     * 
     * // Get first 10 Linea_base_historials
     * const linea_base_historials = await prisma.linea_base_historial.findMany({ take: 10 })
     * 
     * // Only select the `id_historial`
     * const linea_base_historialWithId_historialOnly = await prisma.linea_base_historial.findMany({ select: { id_historial: true } })
     * 
     */
    findMany<T extends linea_base_historialFindManyArgs>(args?: SelectSubset<T, linea_base_historialFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Linea_base_historial.
     * @param {linea_base_historialCreateArgs} args - Arguments to create a Linea_base_historial.
     * @example
     * // Create one Linea_base_historial
     * const Linea_base_historial = await prisma.linea_base_historial.create({
     *   data: {
     *     // ... data to create a Linea_base_historial
     *   }
     * })
     * 
     */
    create<T extends linea_base_historialCreateArgs>(args: SelectSubset<T, linea_base_historialCreateArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Linea_base_historials.
     * @param {linea_base_historialCreateManyArgs} args - Arguments to create many Linea_base_historials.
     * @example
     * // Create many Linea_base_historials
     * const linea_base_historial = await prisma.linea_base_historial.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends linea_base_historialCreateManyArgs>(args?: SelectSubset<T, linea_base_historialCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Linea_base_historials and returns the data saved in the database.
     * @param {linea_base_historialCreateManyAndReturnArgs} args - Arguments to create many Linea_base_historials.
     * @example
     * // Create many Linea_base_historials
     * const linea_base_historial = await prisma.linea_base_historial.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Linea_base_historials and only return the `id_historial`
     * const linea_base_historialWithId_historialOnly = await prisma.linea_base_historial.createManyAndReturn({
     *   select: { id_historial: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends linea_base_historialCreateManyAndReturnArgs>(args?: SelectSubset<T, linea_base_historialCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Linea_base_historial.
     * @param {linea_base_historialDeleteArgs} args - Arguments to delete one Linea_base_historial.
     * @example
     * // Delete one Linea_base_historial
     * const Linea_base_historial = await prisma.linea_base_historial.delete({
     *   where: {
     *     // ... filter to delete one Linea_base_historial
     *   }
     * })
     * 
     */
    delete<T extends linea_base_historialDeleteArgs>(args: SelectSubset<T, linea_base_historialDeleteArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Linea_base_historial.
     * @param {linea_base_historialUpdateArgs} args - Arguments to update one Linea_base_historial.
     * @example
     * // Update one Linea_base_historial
     * const linea_base_historial = await prisma.linea_base_historial.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends linea_base_historialUpdateArgs>(args: SelectSubset<T, linea_base_historialUpdateArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Linea_base_historials.
     * @param {linea_base_historialDeleteManyArgs} args - Arguments to filter Linea_base_historials to delete.
     * @example
     * // Delete a few Linea_base_historials
     * const { count } = await prisma.linea_base_historial.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends linea_base_historialDeleteManyArgs>(args?: SelectSubset<T, linea_base_historialDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Linea_base_historials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_base_historialUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Linea_base_historials
     * const linea_base_historial = await prisma.linea_base_historial.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends linea_base_historialUpdateManyArgs>(args: SelectSubset<T, linea_base_historialUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Linea_base_historials and returns the data updated in the database.
     * @param {linea_base_historialUpdateManyAndReturnArgs} args - Arguments to update many Linea_base_historials.
     * @example
     * // Update many Linea_base_historials
     * const linea_base_historial = await prisma.linea_base_historial.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Linea_base_historials and only return the `id_historial`
     * const linea_base_historialWithId_historialOnly = await prisma.linea_base_historial.updateManyAndReturn({
     *   select: { id_historial: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends linea_base_historialUpdateManyAndReturnArgs>(args: SelectSubset<T, linea_base_historialUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Linea_base_historial.
     * @param {linea_base_historialUpsertArgs} args - Arguments to update or create a Linea_base_historial.
     * @example
     * // Update or create a Linea_base_historial
     * const linea_base_historial = await prisma.linea_base_historial.upsert({
     *   create: {
     *     // ... data to create a Linea_base_historial
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Linea_base_historial we want to update
     *   }
     * })
     */
    upsert<T extends linea_base_historialUpsertArgs>(args: SelectSubset<T, linea_base_historialUpsertArgs<ExtArgs>>): Prisma__linea_base_historialClient<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Linea_base_historials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_base_historialCountArgs} args - Arguments to filter Linea_base_historials to count.
     * @example
     * // Count the number of Linea_base_historials
     * const count = await prisma.linea_base_historial.count({
     *   where: {
     *     // ... the filter for the Linea_base_historials we want to count
     *   }
     * })
    **/
    count<T extends linea_base_historialCountArgs>(
      args?: Subset<T, linea_base_historialCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Linea_base_historialCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Linea_base_historial.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Linea_base_historialAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Linea_base_historialAggregateArgs>(args: Subset<T, Linea_base_historialAggregateArgs>): Prisma.PrismaPromise<GetLinea_base_historialAggregateType<T>>

    /**
     * Group by Linea_base_historial.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {linea_base_historialGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends linea_base_historialGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: linea_base_historialGroupByArgs['orderBy'] }
        : { orderBy?: linea_base_historialGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, linea_base_historialGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLinea_base_historialGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the linea_base_historial model
   */
  readonly fields: linea_base_historialFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for linea_base_historial.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__linea_base_historialClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    linea_base<T extends linea_baseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, linea_baseDefaultArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    usuarios<T extends usuariosDefaultArgs<ExtArgs> = {}>(args?: Subset<T, usuariosDefaultArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the linea_base_historial model
   */
  interface linea_base_historialFieldRefs {
    readonly id_historial: FieldRef<"linea_base_historial", 'BigInt'>
    readonly id_linea_base: FieldRef<"linea_base_historial", 'String'>
    readonly id_usuario: FieldRef<"linea_base_historial", 'String'>
    readonly campos_modificados: FieldRef<"linea_base_historial", 'String[]'>
    readonly datos_anteriores: FieldRef<"linea_base_historial", 'Json'>
    readonly fecha_modificacion: FieldRef<"linea_base_historial", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * linea_base_historial findUnique
   */
  export type linea_base_historialFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * Filter, which linea_base_historial to fetch.
     */
    where: linea_base_historialWhereUniqueInput
  }

  /**
   * linea_base_historial findUniqueOrThrow
   */
  export type linea_base_historialFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * Filter, which linea_base_historial to fetch.
     */
    where: linea_base_historialWhereUniqueInput
  }

  /**
   * linea_base_historial findFirst
   */
  export type linea_base_historialFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * Filter, which linea_base_historial to fetch.
     */
    where?: linea_base_historialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_base_historials to fetch.
     */
    orderBy?: linea_base_historialOrderByWithRelationInput | linea_base_historialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for linea_base_historials.
     */
    cursor?: linea_base_historialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_base_historials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_base_historials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of linea_base_historials.
     */
    distinct?: Linea_base_historialScalarFieldEnum | Linea_base_historialScalarFieldEnum[]
  }

  /**
   * linea_base_historial findFirstOrThrow
   */
  export type linea_base_historialFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * Filter, which linea_base_historial to fetch.
     */
    where?: linea_base_historialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_base_historials to fetch.
     */
    orderBy?: linea_base_historialOrderByWithRelationInput | linea_base_historialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for linea_base_historials.
     */
    cursor?: linea_base_historialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_base_historials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_base_historials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of linea_base_historials.
     */
    distinct?: Linea_base_historialScalarFieldEnum | Linea_base_historialScalarFieldEnum[]
  }

  /**
   * linea_base_historial findMany
   */
  export type linea_base_historialFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * Filter, which linea_base_historials to fetch.
     */
    where?: linea_base_historialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of linea_base_historials to fetch.
     */
    orderBy?: linea_base_historialOrderByWithRelationInput | linea_base_historialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing linea_base_historials.
     */
    cursor?: linea_base_historialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` linea_base_historials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` linea_base_historials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of linea_base_historials.
     */
    distinct?: Linea_base_historialScalarFieldEnum | Linea_base_historialScalarFieldEnum[]
  }

  /**
   * linea_base_historial create
   */
  export type linea_base_historialCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * The data needed to create a linea_base_historial.
     */
    data: XOR<linea_base_historialCreateInput, linea_base_historialUncheckedCreateInput>
  }

  /**
   * linea_base_historial createMany
   */
  export type linea_base_historialCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many linea_base_historials.
     */
    data: linea_base_historialCreateManyInput | linea_base_historialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * linea_base_historial createManyAndReturn
   */
  export type linea_base_historialCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * The data used to create many linea_base_historials.
     */
    data: linea_base_historialCreateManyInput | linea_base_historialCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * linea_base_historial update
   */
  export type linea_base_historialUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * The data needed to update a linea_base_historial.
     */
    data: XOR<linea_base_historialUpdateInput, linea_base_historialUncheckedUpdateInput>
    /**
     * Choose, which linea_base_historial to update.
     */
    where: linea_base_historialWhereUniqueInput
  }

  /**
   * linea_base_historial updateMany
   */
  export type linea_base_historialUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update linea_base_historials.
     */
    data: XOR<linea_base_historialUpdateManyMutationInput, linea_base_historialUncheckedUpdateManyInput>
    /**
     * Filter which linea_base_historials to update
     */
    where?: linea_base_historialWhereInput
    /**
     * Limit how many linea_base_historials to update.
     */
    limit?: number
  }

  /**
   * linea_base_historial updateManyAndReturn
   */
  export type linea_base_historialUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * The data used to update linea_base_historials.
     */
    data: XOR<linea_base_historialUpdateManyMutationInput, linea_base_historialUncheckedUpdateManyInput>
    /**
     * Filter which linea_base_historials to update
     */
    where?: linea_base_historialWhereInput
    /**
     * Limit how many linea_base_historials to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * linea_base_historial upsert
   */
  export type linea_base_historialUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * The filter to search for the linea_base_historial to update in case it exists.
     */
    where: linea_base_historialWhereUniqueInput
    /**
     * In case the linea_base_historial found by the `where` argument doesn't exist, create a new linea_base_historial with this data.
     */
    create: XOR<linea_base_historialCreateInput, linea_base_historialUncheckedCreateInput>
    /**
     * In case the linea_base_historial was found with the provided `where` argument, update it with this data.
     */
    update: XOR<linea_base_historialUpdateInput, linea_base_historialUncheckedUpdateInput>
  }

  /**
   * linea_base_historial delete
   */
  export type linea_base_historialDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    /**
     * Filter which linea_base_historial to delete.
     */
    where: linea_base_historialWhereUniqueInput
  }

  /**
   * linea_base_historial deleteMany
   */
  export type linea_base_historialDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which linea_base_historials to delete
     */
    where?: linea_base_historialWhereInput
    /**
     * Limit how many linea_base_historials to delete.
     */
    limit?: number
  }

  /**
   * linea_base_historial without action
   */
  export type linea_base_historialDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
  }


  /**
   * Model sesiones
   */

  export type AggregateSesiones = {
    _count: SesionesCountAggregateOutputType | null
    _avg: SesionesAvgAggregateOutputType | null
    _sum: SesionesSumAggregateOutputType | null
    _min: SesionesMinAggregateOutputType | null
    _max: SesionesMaxAggregateOutputType | null
  }

  export type SesionesAvgAggregateOutputType = {
    limite_inactividad_minutos: number | null
  }

  export type SesionesSumAggregateOutputType = {
    limite_inactividad_minutos: number | null
  }

  export type SesionesMinAggregateOutputType = {
    id_sesion: string | null
    id_usuario: string | null
    fecha_inicio_sesion: Date | null
    fecha_ultima_interaccion: Date | null
    limite_inactividad_minutos: number | null
    estado_aplicacion: $Enums.estado_aplicacion_enum | null
    activa: boolean | null
    fecha_cierre_sesion: Date | null
    motivo_cierre: $Enums.motivo_cierre_enum | null
  }

  export type SesionesMaxAggregateOutputType = {
    id_sesion: string | null
    id_usuario: string | null
    fecha_inicio_sesion: Date | null
    fecha_ultima_interaccion: Date | null
    limite_inactividad_minutos: number | null
    estado_aplicacion: $Enums.estado_aplicacion_enum | null
    activa: boolean | null
    fecha_cierre_sesion: Date | null
    motivo_cierre: $Enums.motivo_cierre_enum | null
  }

  export type SesionesCountAggregateOutputType = {
    id_sesion: number
    id_usuario: number
    fecha_inicio_sesion: number
    fecha_ultima_interaccion: number
    limite_inactividad_minutos: number
    estado_aplicacion: number
    activa: number
    fecha_cierre_sesion: number
    motivo_cierre: number
    _all: number
  }


  export type SesionesAvgAggregateInputType = {
    limite_inactividad_minutos?: true
  }

  export type SesionesSumAggregateInputType = {
    limite_inactividad_minutos?: true
  }

  export type SesionesMinAggregateInputType = {
    id_sesion?: true
    id_usuario?: true
    fecha_inicio_sesion?: true
    fecha_ultima_interaccion?: true
    limite_inactividad_minutos?: true
    estado_aplicacion?: true
    activa?: true
    fecha_cierre_sesion?: true
    motivo_cierre?: true
  }

  export type SesionesMaxAggregateInputType = {
    id_sesion?: true
    id_usuario?: true
    fecha_inicio_sesion?: true
    fecha_ultima_interaccion?: true
    limite_inactividad_minutos?: true
    estado_aplicacion?: true
    activa?: true
    fecha_cierre_sesion?: true
    motivo_cierre?: true
  }

  export type SesionesCountAggregateInputType = {
    id_sesion?: true
    id_usuario?: true
    fecha_inicio_sesion?: true
    fecha_ultima_interaccion?: true
    limite_inactividad_minutos?: true
    estado_aplicacion?: true
    activa?: true
    fecha_cierre_sesion?: true
    motivo_cierre?: true
    _all?: true
  }

  export type SesionesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sesiones to aggregate.
     */
    where?: sesionesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sesiones to fetch.
     */
    orderBy?: sesionesOrderByWithRelationInput | sesionesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sesionesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sesiones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sesiones.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sesiones
    **/
    _count?: true | SesionesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SesionesAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SesionesSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SesionesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SesionesMaxAggregateInputType
  }

  export type GetSesionesAggregateType<T extends SesionesAggregateArgs> = {
        [P in keyof T & keyof AggregateSesiones]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSesiones[P]>
      : GetScalarType<T[P], AggregateSesiones[P]>
  }




  export type sesionesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sesionesWhereInput
    orderBy?: sesionesOrderByWithAggregationInput | sesionesOrderByWithAggregationInput[]
    by: SesionesScalarFieldEnum[] | SesionesScalarFieldEnum
    having?: sesionesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SesionesCountAggregateInputType | true
    _avg?: SesionesAvgAggregateInputType
    _sum?: SesionesSumAggregateInputType
    _min?: SesionesMinAggregateInputType
    _max?: SesionesMaxAggregateInputType
  }

  export type SesionesGroupByOutputType = {
    id_sesion: string
    id_usuario: string
    fecha_inicio_sesion: Date
    fecha_ultima_interaccion: Date
    limite_inactividad_minutos: number
    estado_aplicacion: $Enums.estado_aplicacion_enum
    activa: boolean
    fecha_cierre_sesion: Date | null
    motivo_cierre: $Enums.motivo_cierre_enum | null
    _count: SesionesCountAggregateOutputType | null
    _avg: SesionesAvgAggregateOutputType | null
    _sum: SesionesSumAggregateOutputType | null
    _min: SesionesMinAggregateOutputType | null
    _max: SesionesMaxAggregateOutputType | null
  }

  type GetSesionesGroupByPayload<T extends sesionesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SesionesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SesionesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SesionesGroupByOutputType[P]>
            : GetScalarType<T[P], SesionesGroupByOutputType[P]>
        }
      >
    >


  export type sesionesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_sesion?: boolean
    id_usuario?: boolean
    fecha_inicio_sesion?: boolean
    fecha_ultima_interaccion?: boolean
    limite_inactividad_minutos?: boolean
    estado_aplicacion?: boolean
    activa?: boolean
    fecha_cierre_sesion?: boolean
    motivo_cierre?: boolean
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sesiones"]>

  export type sesionesSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_sesion?: boolean
    id_usuario?: boolean
    fecha_inicio_sesion?: boolean
    fecha_ultima_interaccion?: boolean
    limite_inactividad_minutos?: boolean
    estado_aplicacion?: boolean
    activa?: boolean
    fecha_cierre_sesion?: boolean
    motivo_cierre?: boolean
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sesiones"]>

  export type sesionesSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_sesion?: boolean
    id_usuario?: boolean
    fecha_inicio_sesion?: boolean
    fecha_ultima_interaccion?: boolean
    limite_inactividad_minutos?: boolean
    estado_aplicacion?: boolean
    activa?: boolean
    fecha_cierre_sesion?: boolean
    motivo_cierre?: boolean
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["sesiones"]>

  export type sesionesSelectScalar = {
    id_sesion?: boolean
    id_usuario?: boolean
    fecha_inicio_sesion?: boolean
    fecha_ultima_interaccion?: boolean
    limite_inactividad_minutos?: boolean
    estado_aplicacion?: boolean
    activa?: boolean
    fecha_cierre_sesion?: boolean
    motivo_cierre?: boolean
  }

  export type sesionesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id_sesion" | "id_usuario" | "fecha_inicio_sesion" | "fecha_ultima_interaccion" | "limite_inactividad_minutos" | "estado_aplicacion" | "activa" | "fecha_cierre_sesion" | "motivo_cierre", ExtArgs["result"]["sesiones"]>
  export type sesionesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }
  export type sesionesIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }
  export type sesionesIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | usuariosDefaultArgs<ExtArgs>
  }

  export type $sesionesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sesiones"
    objects: {
      usuarios: Prisma.$usuariosPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id_sesion: string
      id_usuario: string
      fecha_inicio_sesion: Date
      fecha_ultima_interaccion: Date
      limite_inactividad_minutos: number
      estado_aplicacion: $Enums.estado_aplicacion_enum
      activa: boolean
      fecha_cierre_sesion: Date | null
      motivo_cierre: $Enums.motivo_cierre_enum | null
    }, ExtArgs["result"]["sesiones"]>
    composites: {}
  }

  type sesionesGetPayload<S extends boolean | null | undefined | sesionesDefaultArgs> = $Result.GetResult<Prisma.$sesionesPayload, S>

  type sesionesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sesionesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SesionesCountAggregateInputType | true
    }

  export interface sesionesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sesiones'], meta: { name: 'sesiones' } }
    /**
     * Find zero or one Sesiones that matches the filter.
     * @param {sesionesFindUniqueArgs} args - Arguments to find a Sesiones
     * @example
     * // Get one Sesiones
     * const sesiones = await prisma.sesiones.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sesionesFindUniqueArgs>(args: SelectSubset<T, sesionesFindUniqueArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sesiones that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sesionesFindUniqueOrThrowArgs} args - Arguments to find a Sesiones
     * @example
     * // Get one Sesiones
     * const sesiones = await prisma.sesiones.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sesionesFindUniqueOrThrowArgs>(args: SelectSubset<T, sesionesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sesiones that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sesionesFindFirstArgs} args - Arguments to find a Sesiones
     * @example
     * // Get one Sesiones
     * const sesiones = await prisma.sesiones.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sesionesFindFirstArgs>(args?: SelectSubset<T, sesionesFindFirstArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sesiones that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sesionesFindFirstOrThrowArgs} args - Arguments to find a Sesiones
     * @example
     * // Get one Sesiones
     * const sesiones = await prisma.sesiones.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sesionesFindFirstOrThrowArgs>(args?: SelectSubset<T, sesionesFindFirstOrThrowArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sesiones that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sesionesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sesiones
     * const sesiones = await prisma.sesiones.findMany()
     * 
     * // Get first 10 Sesiones
     * const sesiones = await prisma.sesiones.findMany({ take: 10 })
     * 
     * // Only select the `id_sesion`
     * const sesionesWithId_sesionOnly = await prisma.sesiones.findMany({ select: { id_sesion: true } })
     * 
     */
    findMany<T extends sesionesFindManyArgs>(args?: SelectSubset<T, sesionesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sesiones.
     * @param {sesionesCreateArgs} args - Arguments to create a Sesiones.
     * @example
     * // Create one Sesiones
     * const Sesiones = await prisma.sesiones.create({
     *   data: {
     *     // ... data to create a Sesiones
     *   }
     * })
     * 
     */
    create<T extends sesionesCreateArgs>(args: SelectSubset<T, sesionesCreateArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sesiones.
     * @param {sesionesCreateManyArgs} args - Arguments to create many Sesiones.
     * @example
     * // Create many Sesiones
     * const sesiones = await prisma.sesiones.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sesionesCreateManyArgs>(args?: SelectSubset<T, sesionesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sesiones and returns the data saved in the database.
     * @param {sesionesCreateManyAndReturnArgs} args - Arguments to create many Sesiones.
     * @example
     * // Create many Sesiones
     * const sesiones = await prisma.sesiones.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sesiones and only return the `id_sesion`
     * const sesionesWithId_sesionOnly = await prisma.sesiones.createManyAndReturn({
     *   select: { id_sesion: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sesionesCreateManyAndReturnArgs>(args?: SelectSubset<T, sesionesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sesiones.
     * @param {sesionesDeleteArgs} args - Arguments to delete one Sesiones.
     * @example
     * // Delete one Sesiones
     * const Sesiones = await prisma.sesiones.delete({
     *   where: {
     *     // ... filter to delete one Sesiones
     *   }
     * })
     * 
     */
    delete<T extends sesionesDeleteArgs>(args: SelectSubset<T, sesionesDeleteArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sesiones.
     * @param {sesionesUpdateArgs} args - Arguments to update one Sesiones.
     * @example
     * // Update one Sesiones
     * const sesiones = await prisma.sesiones.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sesionesUpdateArgs>(args: SelectSubset<T, sesionesUpdateArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sesiones.
     * @param {sesionesDeleteManyArgs} args - Arguments to filter Sesiones to delete.
     * @example
     * // Delete a few Sesiones
     * const { count } = await prisma.sesiones.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sesionesDeleteManyArgs>(args?: SelectSubset<T, sesionesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sesiones.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sesionesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sesiones
     * const sesiones = await prisma.sesiones.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sesionesUpdateManyArgs>(args: SelectSubset<T, sesionesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sesiones and returns the data updated in the database.
     * @param {sesionesUpdateManyAndReturnArgs} args - Arguments to update many Sesiones.
     * @example
     * // Update many Sesiones
     * const sesiones = await prisma.sesiones.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sesiones and only return the `id_sesion`
     * const sesionesWithId_sesionOnly = await prisma.sesiones.updateManyAndReturn({
     *   select: { id_sesion: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sesionesUpdateManyAndReturnArgs>(args: SelectSubset<T, sesionesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sesiones.
     * @param {sesionesUpsertArgs} args - Arguments to update or create a Sesiones.
     * @example
     * // Update or create a Sesiones
     * const sesiones = await prisma.sesiones.upsert({
     *   create: {
     *     // ... data to create a Sesiones
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sesiones we want to update
     *   }
     * })
     */
    upsert<T extends sesionesUpsertArgs>(args: SelectSubset<T, sesionesUpsertArgs<ExtArgs>>): Prisma__sesionesClient<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sesiones.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sesionesCountArgs} args - Arguments to filter Sesiones to count.
     * @example
     * // Count the number of Sesiones
     * const count = await prisma.sesiones.count({
     *   where: {
     *     // ... the filter for the Sesiones we want to count
     *   }
     * })
    **/
    count<T extends sesionesCountArgs>(
      args?: Subset<T, sesionesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SesionesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sesiones.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SesionesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SesionesAggregateArgs>(args: Subset<T, SesionesAggregateArgs>): Prisma.PrismaPromise<GetSesionesAggregateType<T>>

    /**
     * Group by Sesiones.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sesionesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sesionesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sesionesGroupByArgs['orderBy'] }
        : { orderBy?: sesionesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sesionesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSesionesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sesiones model
   */
  readonly fields: sesionesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sesiones.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sesionesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    usuarios<T extends usuariosDefaultArgs<ExtArgs> = {}>(args?: Subset<T, usuariosDefaultArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sesiones model
   */
  interface sesionesFieldRefs {
    readonly id_sesion: FieldRef<"sesiones", 'String'>
    readonly id_usuario: FieldRef<"sesiones", 'String'>
    readonly fecha_inicio_sesion: FieldRef<"sesiones", 'DateTime'>
    readonly fecha_ultima_interaccion: FieldRef<"sesiones", 'DateTime'>
    readonly limite_inactividad_minutos: FieldRef<"sesiones", 'Int'>
    readonly estado_aplicacion: FieldRef<"sesiones", 'estado_aplicacion_enum'>
    readonly activa: FieldRef<"sesiones", 'Boolean'>
    readonly fecha_cierre_sesion: FieldRef<"sesiones", 'DateTime'>
    readonly motivo_cierre: FieldRef<"sesiones", 'motivo_cierre_enum'>
  }
    

  // Custom InputTypes
  /**
   * sesiones findUnique
   */
  export type sesionesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * Filter, which sesiones to fetch.
     */
    where: sesionesWhereUniqueInput
  }

  /**
   * sesiones findUniqueOrThrow
   */
  export type sesionesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * Filter, which sesiones to fetch.
     */
    where: sesionesWhereUniqueInput
  }

  /**
   * sesiones findFirst
   */
  export type sesionesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * Filter, which sesiones to fetch.
     */
    where?: sesionesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sesiones to fetch.
     */
    orderBy?: sesionesOrderByWithRelationInput | sesionesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sesiones.
     */
    cursor?: sesionesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sesiones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sesiones.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sesiones.
     */
    distinct?: SesionesScalarFieldEnum | SesionesScalarFieldEnum[]
  }

  /**
   * sesiones findFirstOrThrow
   */
  export type sesionesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * Filter, which sesiones to fetch.
     */
    where?: sesionesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sesiones to fetch.
     */
    orderBy?: sesionesOrderByWithRelationInput | sesionesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sesiones.
     */
    cursor?: sesionesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sesiones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sesiones.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sesiones.
     */
    distinct?: SesionesScalarFieldEnum | SesionesScalarFieldEnum[]
  }

  /**
   * sesiones findMany
   */
  export type sesionesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * Filter, which sesiones to fetch.
     */
    where?: sesionesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sesiones to fetch.
     */
    orderBy?: sesionesOrderByWithRelationInput | sesionesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sesiones.
     */
    cursor?: sesionesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sesiones from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sesiones.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sesiones.
     */
    distinct?: SesionesScalarFieldEnum | SesionesScalarFieldEnum[]
  }

  /**
   * sesiones create
   */
  export type sesionesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * The data needed to create a sesiones.
     */
    data: XOR<sesionesCreateInput, sesionesUncheckedCreateInput>
  }

  /**
   * sesiones createMany
   */
  export type sesionesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sesiones.
     */
    data: sesionesCreateManyInput | sesionesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sesiones createManyAndReturn
   */
  export type sesionesCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * The data used to create many sesiones.
     */
    data: sesionesCreateManyInput | sesionesCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * sesiones update
   */
  export type sesionesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * The data needed to update a sesiones.
     */
    data: XOR<sesionesUpdateInput, sesionesUncheckedUpdateInput>
    /**
     * Choose, which sesiones to update.
     */
    where: sesionesWhereUniqueInput
  }

  /**
   * sesiones updateMany
   */
  export type sesionesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sesiones.
     */
    data: XOR<sesionesUpdateManyMutationInput, sesionesUncheckedUpdateManyInput>
    /**
     * Filter which sesiones to update
     */
    where?: sesionesWhereInput
    /**
     * Limit how many sesiones to update.
     */
    limit?: number
  }

  /**
   * sesiones updateManyAndReturn
   */
  export type sesionesUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * The data used to update sesiones.
     */
    data: XOR<sesionesUpdateManyMutationInput, sesionesUncheckedUpdateManyInput>
    /**
     * Filter which sesiones to update
     */
    where?: sesionesWhereInput
    /**
     * Limit how many sesiones to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * sesiones upsert
   */
  export type sesionesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * The filter to search for the sesiones to update in case it exists.
     */
    where: sesionesWhereUniqueInput
    /**
     * In case the sesiones found by the `where` argument doesn't exist, create a new sesiones with this data.
     */
    create: XOR<sesionesCreateInput, sesionesUncheckedCreateInput>
    /**
     * In case the sesiones was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sesionesUpdateInput, sesionesUncheckedUpdateInput>
  }

  /**
   * sesiones delete
   */
  export type sesionesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    /**
     * Filter which sesiones to delete.
     */
    where: sesionesWhereUniqueInput
  }

  /**
   * sesiones deleteMany
   */
  export type sesionesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sesiones to delete
     */
    where?: sesionesWhereInput
    /**
     * Limit how many sesiones to delete.
     */
    limit?: number
  }

  /**
   * sesiones without action
   */
  export type sesionesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
  }


  /**
   * Model solicitudes_recuperacion
   */

  export type AggregateSolicitudes_recuperacion = {
    _count: Solicitudes_recuperacionCountAggregateOutputType | null
    _min: Solicitudes_recuperacionMinAggregateOutputType | null
    _max: Solicitudes_recuperacionMaxAggregateOutputType | null
  }

  export type Solicitudes_recuperacionMinAggregateOutputType = {
    id_solicitud: string | null
    correo_electronico: string | null
    id_usuario: string | null
    direccion_ip: string | null
    codigo_hash: string | null
    fecha_solicitud: Date | null
    fecha_expiracion: Date | null
    estado_codigo: $Enums.estado_codigo_enum | null
  }

  export type Solicitudes_recuperacionMaxAggregateOutputType = {
    id_solicitud: string | null
    correo_electronico: string | null
    id_usuario: string | null
    direccion_ip: string | null
    codigo_hash: string | null
    fecha_solicitud: Date | null
    fecha_expiracion: Date | null
    estado_codigo: $Enums.estado_codigo_enum | null
  }

  export type Solicitudes_recuperacionCountAggregateOutputType = {
    id_solicitud: number
    correo_electronico: number
    id_usuario: number
    direccion_ip: number
    codigo_hash: number
    fecha_solicitud: number
    fecha_expiracion: number
    estado_codigo: number
    _all: number
  }


  export type Solicitudes_recuperacionMinAggregateInputType = {
    id_solicitud?: true
    correo_electronico?: true
    id_usuario?: true
    direccion_ip?: true
    codigo_hash?: true
    fecha_solicitud?: true
    fecha_expiracion?: true
    estado_codigo?: true
  }

  export type Solicitudes_recuperacionMaxAggregateInputType = {
    id_solicitud?: true
    correo_electronico?: true
    id_usuario?: true
    direccion_ip?: true
    codigo_hash?: true
    fecha_solicitud?: true
    fecha_expiracion?: true
    estado_codigo?: true
  }

  export type Solicitudes_recuperacionCountAggregateInputType = {
    id_solicitud?: true
    correo_electronico?: true
    id_usuario?: true
    direccion_ip?: true
    codigo_hash?: true
    fecha_solicitud?: true
    fecha_expiracion?: true
    estado_codigo?: true
    _all?: true
  }

  export type Solicitudes_recuperacionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which solicitudes_recuperacion to aggregate.
     */
    where?: solicitudes_recuperacionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of solicitudes_recuperacions to fetch.
     */
    orderBy?: solicitudes_recuperacionOrderByWithRelationInput | solicitudes_recuperacionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: solicitudes_recuperacionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` solicitudes_recuperacions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` solicitudes_recuperacions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned solicitudes_recuperacions
    **/
    _count?: true | Solicitudes_recuperacionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Solicitudes_recuperacionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Solicitudes_recuperacionMaxAggregateInputType
  }

  export type GetSolicitudes_recuperacionAggregateType<T extends Solicitudes_recuperacionAggregateArgs> = {
        [P in keyof T & keyof AggregateSolicitudes_recuperacion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSolicitudes_recuperacion[P]>
      : GetScalarType<T[P], AggregateSolicitudes_recuperacion[P]>
  }




  export type solicitudes_recuperacionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: solicitudes_recuperacionWhereInput
    orderBy?: solicitudes_recuperacionOrderByWithAggregationInput | solicitudes_recuperacionOrderByWithAggregationInput[]
    by: Solicitudes_recuperacionScalarFieldEnum[] | Solicitudes_recuperacionScalarFieldEnum
    having?: solicitudes_recuperacionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Solicitudes_recuperacionCountAggregateInputType | true
    _min?: Solicitudes_recuperacionMinAggregateInputType
    _max?: Solicitudes_recuperacionMaxAggregateInputType
  }

  export type Solicitudes_recuperacionGroupByOutputType = {
    id_solicitud: string
    correo_electronico: string
    id_usuario: string | null
    direccion_ip: string
    codigo_hash: string | null
    fecha_solicitud: Date
    fecha_expiracion: Date | null
    estado_codigo: $Enums.estado_codigo_enum | null
    _count: Solicitudes_recuperacionCountAggregateOutputType | null
    _min: Solicitudes_recuperacionMinAggregateOutputType | null
    _max: Solicitudes_recuperacionMaxAggregateOutputType | null
  }

  type GetSolicitudes_recuperacionGroupByPayload<T extends solicitudes_recuperacionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Solicitudes_recuperacionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Solicitudes_recuperacionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Solicitudes_recuperacionGroupByOutputType[P]>
            : GetScalarType<T[P], Solicitudes_recuperacionGroupByOutputType[P]>
        }
      >
    >


  export type solicitudes_recuperacionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_solicitud?: boolean
    correo_electronico?: boolean
    id_usuario?: boolean
    direccion_ip?: boolean
    codigo_hash?: boolean
    fecha_solicitud?: boolean
    fecha_expiracion?: boolean
    estado_codigo?: boolean
    usuarios?: boolean | solicitudes_recuperacion$usuariosArgs<ExtArgs>
  }, ExtArgs["result"]["solicitudes_recuperacion"]>

  export type solicitudes_recuperacionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_solicitud?: boolean
    correo_electronico?: boolean
    id_usuario?: boolean
    direccion_ip?: boolean
    codigo_hash?: boolean
    fecha_solicitud?: boolean
    fecha_expiracion?: boolean
    estado_codigo?: boolean
    usuarios?: boolean | solicitudes_recuperacion$usuariosArgs<ExtArgs>
  }, ExtArgs["result"]["solicitudes_recuperacion"]>

  export type solicitudes_recuperacionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_solicitud?: boolean
    correo_electronico?: boolean
    id_usuario?: boolean
    direccion_ip?: boolean
    codigo_hash?: boolean
    fecha_solicitud?: boolean
    fecha_expiracion?: boolean
    estado_codigo?: boolean
    usuarios?: boolean | solicitudes_recuperacion$usuariosArgs<ExtArgs>
  }, ExtArgs["result"]["solicitudes_recuperacion"]>

  export type solicitudes_recuperacionSelectScalar = {
    id_solicitud?: boolean
    correo_electronico?: boolean
    id_usuario?: boolean
    direccion_ip?: boolean
    codigo_hash?: boolean
    fecha_solicitud?: boolean
    fecha_expiracion?: boolean
    estado_codigo?: boolean
  }

  export type solicitudes_recuperacionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id_solicitud" | "correo_electronico" | "id_usuario" | "direccion_ip" | "codigo_hash" | "fecha_solicitud" | "fecha_expiracion" | "estado_codigo", ExtArgs["result"]["solicitudes_recuperacion"]>
  export type solicitudes_recuperacionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | solicitudes_recuperacion$usuariosArgs<ExtArgs>
  }
  export type solicitudes_recuperacionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | solicitudes_recuperacion$usuariosArgs<ExtArgs>
  }
  export type solicitudes_recuperacionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    usuarios?: boolean | solicitudes_recuperacion$usuariosArgs<ExtArgs>
  }

  export type $solicitudes_recuperacionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "solicitudes_recuperacion"
    objects: {
      usuarios: Prisma.$usuariosPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id_solicitud: string
      correo_electronico: string
      id_usuario: string | null
      direccion_ip: string
      codigo_hash: string | null
      fecha_solicitud: Date
      fecha_expiracion: Date | null
      estado_codigo: $Enums.estado_codigo_enum | null
    }, ExtArgs["result"]["solicitudes_recuperacion"]>
    composites: {}
  }

  type solicitudes_recuperacionGetPayload<S extends boolean | null | undefined | solicitudes_recuperacionDefaultArgs> = $Result.GetResult<Prisma.$solicitudes_recuperacionPayload, S>

  type solicitudes_recuperacionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<solicitudes_recuperacionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Solicitudes_recuperacionCountAggregateInputType | true
    }

  export interface solicitudes_recuperacionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['solicitudes_recuperacion'], meta: { name: 'solicitudes_recuperacion' } }
    /**
     * Find zero or one Solicitudes_recuperacion that matches the filter.
     * @param {solicitudes_recuperacionFindUniqueArgs} args - Arguments to find a Solicitudes_recuperacion
     * @example
     * // Get one Solicitudes_recuperacion
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends solicitudes_recuperacionFindUniqueArgs>(args: SelectSubset<T, solicitudes_recuperacionFindUniqueArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Solicitudes_recuperacion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {solicitudes_recuperacionFindUniqueOrThrowArgs} args - Arguments to find a Solicitudes_recuperacion
     * @example
     * // Get one Solicitudes_recuperacion
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends solicitudes_recuperacionFindUniqueOrThrowArgs>(args: SelectSubset<T, solicitudes_recuperacionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Solicitudes_recuperacion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {solicitudes_recuperacionFindFirstArgs} args - Arguments to find a Solicitudes_recuperacion
     * @example
     * // Get one Solicitudes_recuperacion
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends solicitudes_recuperacionFindFirstArgs>(args?: SelectSubset<T, solicitudes_recuperacionFindFirstArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Solicitudes_recuperacion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {solicitudes_recuperacionFindFirstOrThrowArgs} args - Arguments to find a Solicitudes_recuperacion
     * @example
     * // Get one Solicitudes_recuperacion
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends solicitudes_recuperacionFindFirstOrThrowArgs>(args?: SelectSubset<T, solicitudes_recuperacionFindFirstOrThrowArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Solicitudes_recuperacions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {solicitudes_recuperacionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Solicitudes_recuperacions
     * const solicitudes_recuperacions = await prisma.solicitudes_recuperacion.findMany()
     * 
     * // Get first 10 Solicitudes_recuperacions
     * const solicitudes_recuperacions = await prisma.solicitudes_recuperacion.findMany({ take: 10 })
     * 
     * // Only select the `id_solicitud`
     * const solicitudes_recuperacionWithId_solicitudOnly = await prisma.solicitudes_recuperacion.findMany({ select: { id_solicitud: true } })
     * 
     */
    findMany<T extends solicitudes_recuperacionFindManyArgs>(args?: SelectSubset<T, solicitudes_recuperacionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Solicitudes_recuperacion.
     * @param {solicitudes_recuperacionCreateArgs} args - Arguments to create a Solicitudes_recuperacion.
     * @example
     * // Create one Solicitudes_recuperacion
     * const Solicitudes_recuperacion = await prisma.solicitudes_recuperacion.create({
     *   data: {
     *     // ... data to create a Solicitudes_recuperacion
     *   }
     * })
     * 
     */
    create<T extends solicitudes_recuperacionCreateArgs>(args: SelectSubset<T, solicitudes_recuperacionCreateArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Solicitudes_recuperacions.
     * @param {solicitudes_recuperacionCreateManyArgs} args - Arguments to create many Solicitudes_recuperacions.
     * @example
     * // Create many Solicitudes_recuperacions
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends solicitudes_recuperacionCreateManyArgs>(args?: SelectSubset<T, solicitudes_recuperacionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Solicitudes_recuperacions and returns the data saved in the database.
     * @param {solicitudes_recuperacionCreateManyAndReturnArgs} args - Arguments to create many Solicitudes_recuperacions.
     * @example
     * // Create many Solicitudes_recuperacions
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Solicitudes_recuperacions and only return the `id_solicitud`
     * const solicitudes_recuperacionWithId_solicitudOnly = await prisma.solicitudes_recuperacion.createManyAndReturn({
     *   select: { id_solicitud: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends solicitudes_recuperacionCreateManyAndReturnArgs>(args?: SelectSubset<T, solicitudes_recuperacionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Solicitudes_recuperacion.
     * @param {solicitudes_recuperacionDeleteArgs} args - Arguments to delete one Solicitudes_recuperacion.
     * @example
     * // Delete one Solicitudes_recuperacion
     * const Solicitudes_recuperacion = await prisma.solicitudes_recuperacion.delete({
     *   where: {
     *     // ... filter to delete one Solicitudes_recuperacion
     *   }
     * })
     * 
     */
    delete<T extends solicitudes_recuperacionDeleteArgs>(args: SelectSubset<T, solicitudes_recuperacionDeleteArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Solicitudes_recuperacion.
     * @param {solicitudes_recuperacionUpdateArgs} args - Arguments to update one Solicitudes_recuperacion.
     * @example
     * // Update one Solicitudes_recuperacion
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends solicitudes_recuperacionUpdateArgs>(args: SelectSubset<T, solicitudes_recuperacionUpdateArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Solicitudes_recuperacions.
     * @param {solicitudes_recuperacionDeleteManyArgs} args - Arguments to filter Solicitudes_recuperacions to delete.
     * @example
     * // Delete a few Solicitudes_recuperacions
     * const { count } = await prisma.solicitudes_recuperacion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends solicitudes_recuperacionDeleteManyArgs>(args?: SelectSubset<T, solicitudes_recuperacionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Solicitudes_recuperacions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {solicitudes_recuperacionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Solicitudes_recuperacions
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends solicitudes_recuperacionUpdateManyArgs>(args: SelectSubset<T, solicitudes_recuperacionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Solicitudes_recuperacions and returns the data updated in the database.
     * @param {solicitudes_recuperacionUpdateManyAndReturnArgs} args - Arguments to update many Solicitudes_recuperacions.
     * @example
     * // Update many Solicitudes_recuperacions
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Solicitudes_recuperacions and only return the `id_solicitud`
     * const solicitudes_recuperacionWithId_solicitudOnly = await prisma.solicitudes_recuperacion.updateManyAndReturn({
     *   select: { id_solicitud: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends solicitudes_recuperacionUpdateManyAndReturnArgs>(args: SelectSubset<T, solicitudes_recuperacionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Solicitudes_recuperacion.
     * @param {solicitudes_recuperacionUpsertArgs} args - Arguments to update or create a Solicitudes_recuperacion.
     * @example
     * // Update or create a Solicitudes_recuperacion
     * const solicitudes_recuperacion = await prisma.solicitudes_recuperacion.upsert({
     *   create: {
     *     // ... data to create a Solicitudes_recuperacion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Solicitudes_recuperacion we want to update
     *   }
     * })
     */
    upsert<T extends solicitudes_recuperacionUpsertArgs>(args: SelectSubset<T, solicitudes_recuperacionUpsertArgs<ExtArgs>>): Prisma__solicitudes_recuperacionClient<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Solicitudes_recuperacions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {solicitudes_recuperacionCountArgs} args - Arguments to filter Solicitudes_recuperacions to count.
     * @example
     * // Count the number of Solicitudes_recuperacions
     * const count = await prisma.solicitudes_recuperacion.count({
     *   where: {
     *     // ... the filter for the Solicitudes_recuperacions we want to count
     *   }
     * })
    **/
    count<T extends solicitudes_recuperacionCountArgs>(
      args?: Subset<T, solicitudes_recuperacionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Solicitudes_recuperacionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Solicitudes_recuperacion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Solicitudes_recuperacionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Solicitudes_recuperacionAggregateArgs>(args: Subset<T, Solicitudes_recuperacionAggregateArgs>): Prisma.PrismaPromise<GetSolicitudes_recuperacionAggregateType<T>>

    /**
     * Group by Solicitudes_recuperacion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {solicitudes_recuperacionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends solicitudes_recuperacionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: solicitudes_recuperacionGroupByArgs['orderBy'] }
        : { orderBy?: solicitudes_recuperacionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, solicitudes_recuperacionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSolicitudes_recuperacionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the solicitudes_recuperacion model
   */
  readonly fields: solicitudes_recuperacionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for solicitudes_recuperacion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__solicitudes_recuperacionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    usuarios<T extends solicitudes_recuperacion$usuariosArgs<ExtArgs> = {}>(args?: Subset<T, solicitudes_recuperacion$usuariosArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the solicitudes_recuperacion model
   */
  interface solicitudes_recuperacionFieldRefs {
    readonly id_solicitud: FieldRef<"solicitudes_recuperacion", 'String'>
    readonly correo_electronico: FieldRef<"solicitudes_recuperacion", 'String'>
    readonly id_usuario: FieldRef<"solicitudes_recuperacion", 'String'>
    readonly direccion_ip: FieldRef<"solicitudes_recuperacion", 'String'>
    readonly codigo_hash: FieldRef<"solicitudes_recuperacion", 'String'>
    readonly fecha_solicitud: FieldRef<"solicitudes_recuperacion", 'DateTime'>
    readonly fecha_expiracion: FieldRef<"solicitudes_recuperacion", 'DateTime'>
    readonly estado_codigo: FieldRef<"solicitudes_recuperacion", 'estado_codigo_enum'>
  }
    

  // Custom InputTypes
  /**
   * solicitudes_recuperacion findUnique
   */
  export type solicitudes_recuperacionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * Filter, which solicitudes_recuperacion to fetch.
     */
    where: solicitudes_recuperacionWhereUniqueInput
  }

  /**
   * solicitudes_recuperacion findUniqueOrThrow
   */
  export type solicitudes_recuperacionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * Filter, which solicitudes_recuperacion to fetch.
     */
    where: solicitudes_recuperacionWhereUniqueInput
  }

  /**
   * solicitudes_recuperacion findFirst
   */
  export type solicitudes_recuperacionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * Filter, which solicitudes_recuperacion to fetch.
     */
    where?: solicitudes_recuperacionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of solicitudes_recuperacions to fetch.
     */
    orderBy?: solicitudes_recuperacionOrderByWithRelationInput | solicitudes_recuperacionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for solicitudes_recuperacions.
     */
    cursor?: solicitudes_recuperacionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` solicitudes_recuperacions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` solicitudes_recuperacions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of solicitudes_recuperacions.
     */
    distinct?: Solicitudes_recuperacionScalarFieldEnum | Solicitudes_recuperacionScalarFieldEnum[]
  }

  /**
   * solicitudes_recuperacion findFirstOrThrow
   */
  export type solicitudes_recuperacionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * Filter, which solicitudes_recuperacion to fetch.
     */
    where?: solicitudes_recuperacionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of solicitudes_recuperacions to fetch.
     */
    orderBy?: solicitudes_recuperacionOrderByWithRelationInput | solicitudes_recuperacionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for solicitudes_recuperacions.
     */
    cursor?: solicitudes_recuperacionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` solicitudes_recuperacions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` solicitudes_recuperacions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of solicitudes_recuperacions.
     */
    distinct?: Solicitudes_recuperacionScalarFieldEnum | Solicitudes_recuperacionScalarFieldEnum[]
  }

  /**
   * solicitudes_recuperacion findMany
   */
  export type solicitudes_recuperacionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * Filter, which solicitudes_recuperacions to fetch.
     */
    where?: solicitudes_recuperacionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of solicitudes_recuperacions to fetch.
     */
    orderBy?: solicitudes_recuperacionOrderByWithRelationInput | solicitudes_recuperacionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing solicitudes_recuperacions.
     */
    cursor?: solicitudes_recuperacionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` solicitudes_recuperacions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` solicitudes_recuperacions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of solicitudes_recuperacions.
     */
    distinct?: Solicitudes_recuperacionScalarFieldEnum | Solicitudes_recuperacionScalarFieldEnum[]
  }

  /**
   * solicitudes_recuperacion create
   */
  export type solicitudes_recuperacionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * The data needed to create a solicitudes_recuperacion.
     */
    data: XOR<solicitudes_recuperacionCreateInput, solicitudes_recuperacionUncheckedCreateInput>
  }

  /**
   * solicitudes_recuperacion createMany
   */
  export type solicitudes_recuperacionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many solicitudes_recuperacions.
     */
    data: solicitudes_recuperacionCreateManyInput | solicitudes_recuperacionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * solicitudes_recuperacion createManyAndReturn
   */
  export type solicitudes_recuperacionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * The data used to create many solicitudes_recuperacions.
     */
    data: solicitudes_recuperacionCreateManyInput | solicitudes_recuperacionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * solicitudes_recuperacion update
   */
  export type solicitudes_recuperacionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * The data needed to update a solicitudes_recuperacion.
     */
    data: XOR<solicitudes_recuperacionUpdateInput, solicitudes_recuperacionUncheckedUpdateInput>
    /**
     * Choose, which solicitudes_recuperacion to update.
     */
    where: solicitudes_recuperacionWhereUniqueInput
  }

  /**
   * solicitudes_recuperacion updateMany
   */
  export type solicitudes_recuperacionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update solicitudes_recuperacions.
     */
    data: XOR<solicitudes_recuperacionUpdateManyMutationInput, solicitudes_recuperacionUncheckedUpdateManyInput>
    /**
     * Filter which solicitudes_recuperacions to update
     */
    where?: solicitudes_recuperacionWhereInput
    /**
     * Limit how many solicitudes_recuperacions to update.
     */
    limit?: number
  }

  /**
   * solicitudes_recuperacion updateManyAndReturn
   */
  export type solicitudes_recuperacionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * The data used to update solicitudes_recuperacions.
     */
    data: XOR<solicitudes_recuperacionUpdateManyMutationInput, solicitudes_recuperacionUncheckedUpdateManyInput>
    /**
     * Filter which solicitudes_recuperacions to update
     */
    where?: solicitudes_recuperacionWhereInput
    /**
     * Limit how many solicitudes_recuperacions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * solicitudes_recuperacion upsert
   */
  export type solicitudes_recuperacionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * The filter to search for the solicitudes_recuperacion to update in case it exists.
     */
    where: solicitudes_recuperacionWhereUniqueInput
    /**
     * In case the solicitudes_recuperacion found by the `where` argument doesn't exist, create a new solicitudes_recuperacion with this data.
     */
    create: XOR<solicitudes_recuperacionCreateInput, solicitudes_recuperacionUncheckedCreateInput>
    /**
     * In case the solicitudes_recuperacion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<solicitudes_recuperacionUpdateInput, solicitudes_recuperacionUncheckedUpdateInput>
  }

  /**
   * solicitudes_recuperacion delete
   */
  export type solicitudes_recuperacionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    /**
     * Filter which solicitudes_recuperacion to delete.
     */
    where: solicitudes_recuperacionWhereUniqueInput
  }

  /**
   * solicitudes_recuperacion deleteMany
   */
  export type solicitudes_recuperacionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which solicitudes_recuperacions to delete
     */
    where?: solicitudes_recuperacionWhereInput
    /**
     * Limit how many solicitudes_recuperacions to delete.
     */
    limit?: number
  }

  /**
   * solicitudes_recuperacion.usuarios
   */
  export type solicitudes_recuperacion$usuariosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    where?: usuariosWhereInput
  }

  /**
   * solicitudes_recuperacion without action
   */
  export type solicitudes_recuperacionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
  }


  /**
   * Model usuarios
   */

  export type AggregateUsuarios = {
    _count: UsuariosCountAggregateOutputType | null
    _min: UsuariosMinAggregateOutputType | null
    _max: UsuariosMaxAggregateOutputType | null
  }

  export type UsuariosMinAggregateOutputType = {
    id_usuario: string | null
    correo_electronico: string | null
    contrasena_hash: string | null
    rol: $Enums.rol_enum | null
    estado_registro: $Enums.estado_registro_enum | null
    estado_cuenta: $Enums.estado_cuenta_enum | null
    fecha_registro: Date | null
    fecha_actualizacion: Date | null
    consentimiendo_aceptado: boolean | null
    registro_consumo_aceptado: boolean | null
    id_consentimiento: string | null
  }

  export type UsuariosMaxAggregateOutputType = {
    id_usuario: string | null
    correo_electronico: string | null
    contrasena_hash: string | null
    rol: $Enums.rol_enum | null
    estado_registro: $Enums.estado_registro_enum | null
    estado_cuenta: $Enums.estado_cuenta_enum | null
    fecha_registro: Date | null
    fecha_actualizacion: Date | null
    consentimiendo_aceptado: boolean | null
    registro_consumo_aceptado: boolean | null
    id_consentimiento: string | null
  }

  export type UsuariosCountAggregateOutputType = {
    id_usuario: number
    correo_electronico: number
    contrasena_hash: number
    rol: number
    estado_registro: number
    estado_cuenta: number
    fecha_registro: number
    fecha_actualizacion: number
    consentimiendo_aceptado: number
    registro_consumo_aceptado: number
    id_consentimiento: number
    _all: number
  }


  export type UsuariosMinAggregateInputType = {
    id_usuario?: true
    correo_electronico?: true
    contrasena_hash?: true
    rol?: true
    estado_registro?: true
    estado_cuenta?: true
    fecha_registro?: true
    fecha_actualizacion?: true
    consentimiendo_aceptado?: true
    registro_consumo_aceptado?: true
    id_consentimiento?: true
  }

  export type UsuariosMaxAggregateInputType = {
    id_usuario?: true
    correo_electronico?: true
    contrasena_hash?: true
    rol?: true
    estado_registro?: true
    estado_cuenta?: true
    fecha_registro?: true
    fecha_actualizacion?: true
    consentimiendo_aceptado?: true
    registro_consumo_aceptado?: true
    id_consentimiento?: true
  }

  export type UsuariosCountAggregateInputType = {
    id_usuario?: true
    correo_electronico?: true
    contrasena_hash?: true
    rol?: true
    estado_registro?: true
    estado_cuenta?: true
    fecha_registro?: true
    fecha_actualizacion?: true
    consentimiendo_aceptado?: true
    registro_consumo_aceptado?: true
    id_consentimiento?: true
    _all?: true
  }

  export type UsuariosAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which usuarios to aggregate.
     */
    where?: usuariosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of usuarios to fetch.
     */
    orderBy?: usuariosOrderByWithRelationInput | usuariosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: usuariosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` usuarios from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` usuarios.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned usuarios
    **/
    _count?: true | UsuariosCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UsuariosMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UsuariosMaxAggregateInputType
  }

  export type GetUsuariosAggregateType<T extends UsuariosAggregateArgs> = {
        [P in keyof T & keyof AggregateUsuarios]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUsuarios[P]>
      : GetScalarType<T[P], AggregateUsuarios[P]>
  }




  export type usuariosGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: usuariosWhereInput
    orderBy?: usuariosOrderByWithAggregationInput | usuariosOrderByWithAggregationInput[]
    by: UsuariosScalarFieldEnum[] | UsuariosScalarFieldEnum
    having?: usuariosScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UsuariosCountAggregateInputType | true
    _min?: UsuariosMinAggregateInputType
    _max?: UsuariosMaxAggregateInputType
  }

  export type UsuariosGroupByOutputType = {
    id_usuario: string
    correo_electronico: string
    contrasena_hash: string
    rol: $Enums.rol_enum
    estado_registro: $Enums.estado_registro_enum
    estado_cuenta: $Enums.estado_cuenta_enum
    fecha_registro: Date
    fecha_actualizacion: Date
    consentimiendo_aceptado: boolean | null
    registro_consumo_aceptado: boolean | null
    id_consentimiento: string
    _count: UsuariosCountAggregateOutputType | null
    _min: UsuariosMinAggregateOutputType | null
    _max: UsuariosMaxAggregateOutputType | null
  }

  type GetUsuariosGroupByPayload<T extends usuariosGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UsuariosGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UsuariosGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UsuariosGroupByOutputType[P]>
            : GetScalarType<T[P], UsuariosGroupByOutputType[P]>
        }
      >
    >


  export type usuariosSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_usuario?: boolean
    correo_electronico?: boolean
    contrasena_hash?: boolean
    rol?: boolean
    estado_registro?: boolean
    estado_cuenta?: boolean
    fecha_registro?: boolean
    fecha_actualizacion?: boolean
    consentimiendo_aceptado?: boolean
    registro_consumo_aceptado?: boolean
    id_consentimiento?: boolean
    linea_base?: boolean | usuarios$linea_baseArgs<ExtArgs>
    linea_base_historial?: boolean | usuarios$linea_base_historialArgs<ExtArgs>
    sesiones?: boolean | usuarios$sesionesArgs<ExtArgs>
    solicitudes_recuperacion?: boolean | usuarios$solicitudes_recuperacionArgs<ExtArgs>
    consentimientos?: boolean | consentimientosDefaultArgs<ExtArgs>
    _count?: boolean | UsuariosCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["usuarios"]>

  export type usuariosSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_usuario?: boolean
    correo_electronico?: boolean
    contrasena_hash?: boolean
    rol?: boolean
    estado_registro?: boolean
    estado_cuenta?: boolean
    fecha_registro?: boolean
    fecha_actualizacion?: boolean
    consentimiendo_aceptado?: boolean
    registro_consumo_aceptado?: boolean
    id_consentimiento?: boolean
    consentimientos?: boolean | consentimientosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["usuarios"]>

  export type usuariosSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id_usuario?: boolean
    correo_electronico?: boolean
    contrasena_hash?: boolean
    rol?: boolean
    estado_registro?: boolean
    estado_cuenta?: boolean
    fecha_registro?: boolean
    fecha_actualizacion?: boolean
    consentimiendo_aceptado?: boolean
    registro_consumo_aceptado?: boolean
    id_consentimiento?: boolean
    consentimientos?: boolean | consentimientosDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["usuarios"]>

  export type usuariosSelectScalar = {
    id_usuario?: boolean
    correo_electronico?: boolean
    contrasena_hash?: boolean
    rol?: boolean
    estado_registro?: boolean
    estado_cuenta?: boolean
    fecha_registro?: boolean
    fecha_actualizacion?: boolean
    consentimiendo_aceptado?: boolean
    registro_consumo_aceptado?: boolean
    id_consentimiento?: boolean
  }

  export type usuariosOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id_usuario" | "correo_electronico" | "contrasena_hash" | "rol" | "estado_registro" | "estado_cuenta" | "fecha_registro" | "fecha_actualizacion" | "consentimiendo_aceptado" | "registro_consumo_aceptado" | "id_consentimiento", ExtArgs["result"]["usuarios"]>
  export type usuariosInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    linea_base?: boolean | usuarios$linea_baseArgs<ExtArgs>
    linea_base_historial?: boolean | usuarios$linea_base_historialArgs<ExtArgs>
    sesiones?: boolean | usuarios$sesionesArgs<ExtArgs>
    solicitudes_recuperacion?: boolean | usuarios$solicitudes_recuperacionArgs<ExtArgs>
    consentimientos?: boolean | consentimientosDefaultArgs<ExtArgs>
    _count?: boolean | UsuariosCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type usuariosIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    consentimientos?: boolean | consentimientosDefaultArgs<ExtArgs>
  }
  export type usuariosIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    consentimientos?: boolean | consentimientosDefaultArgs<ExtArgs>
  }

  export type $usuariosPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "usuarios"
    objects: {
      linea_base: Prisma.$linea_basePayload<ExtArgs> | null
      linea_base_historial: Prisma.$linea_base_historialPayload<ExtArgs>[]
      sesiones: Prisma.$sesionesPayload<ExtArgs>[]
      solicitudes_recuperacion: Prisma.$solicitudes_recuperacionPayload<ExtArgs>[]
      consentimientos: Prisma.$consentimientosPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id_usuario: string
      correo_electronico: string
      contrasena_hash: string
      rol: $Enums.rol_enum
      estado_registro: $Enums.estado_registro_enum
      estado_cuenta: $Enums.estado_cuenta_enum
      fecha_registro: Date
      fecha_actualizacion: Date
      consentimiendo_aceptado: boolean | null
      registro_consumo_aceptado: boolean | null
      id_consentimiento: string
    }, ExtArgs["result"]["usuarios"]>
    composites: {}
  }

  type usuariosGetPayload<S extends boolean | null | undefined | usuariosDefaultArgs> = $Result.GetResult<Prisma.$usuariosPayload, S>

  type usuariosCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<usuariosFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UsuariosCountAggregateInputType | true
    }

  export interface usuariosDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['usuarios'], meta: { name: 'usuarios' } }
    /**
     * Find zero or one Usuarios that matches the filter.
     * @param {usuariosFindUniqueArgs} args - Arguments to find a Usuarios
     * @example
     * // Get one Usuarios
     * const usuarios = await prisma.usuarios.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends usuariosFindUniqueArgs>(args: SelectSubset<T, usuariosFindUniqueArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Usuarios that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {usuariosFindUniqueOrThrowArgs} args - Arguments to find a Usuarios
     * @example
     * // Get one Usuarios
     * const usuarios = await prisma.usuarios.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends usuariosFindUniqueOrThrowArgs>(args: SelectSubset<T, usuariosFindUniqueOrThrowArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Usuarios that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {usuariosFindFirstArgs} args - Arguments to find a Usuarios
     * @example
     * // Get one Usuarios
     * const usuarios = await prisma.usuarios.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends usuariosFindFirstArgs>(args?: SelectSubset<T, usuariosFindFirstArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Usuarios that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {usuariosFindFirstOrThrowArgs} args - Arguments to find a Usuarios
     * @example
     * // Get one Usuarios
     * const usuarios = await prisma.usuarios.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends usuariosFindFirstOrThrowArgs>(args?: SelectSubset<T, usuariosFindFirstOrThrowArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Usuarios that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {usuariosFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Usuarios
     * const usuarios = await prisma.usuarios.findMany()
     * 
     * // Get first 10 Usuarios
     * const usuarios = await prisma.usuarios.findMany({ take: 10 })
     * 
     * // Only select the `id_usuario`
     * const usuariosWithId_usuarioOnly = await prisma.usuarios.findMany({ select: { id_usuario: true } })
     * 
     */
    findMany<T extends usuariosFindManyArgs>(args?: SelectSubset<T, usuariosFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Usuarios.
     * @param {usuariosCreateArgs} args - Arguments to create a Usuarios.
     * @example
     * // Create one Usuarios
     * const Usuarios = await prisma.usuarios.create({
     *   data: {
     *     // ... data to create a Usuarios
     *   }
     * })
     * 
     */
    create<T extends usuariosCreateArgs>(args: SelectSubset<T, usuariosCreateArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Usuarios.
     * @param {usuariosCreateManyArgs} args - Arguments to create many Usuarios.
     * @example
     * // Create many Usuarios
     * const usuarios = await prisma.usuarios.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends usuariosCreateManyArgs>(args?: SelectSubset<T, usuariosCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Usuarios and returns the data saved in the database.
     * @param {usuariosCreateManyAndReturnArgs} args - Arguments to create many Usuarios.
     * @example
     * // Create many Usuarios
     * const usuarios = await prisma.usuarios.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Usuarios and only return the `id_usuario`
     * const usuariosWithId_usuarioOnly = await prisma.usuarios.createManyAndReturn({
     *   select: { id_usuario: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends usuariosCreateManyAndReturnArgs>(args?: SelectSubset<T, usuariosCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Usuarios.
     * @param {usuariosDeleteArgs} args - Arguments to delete one Usuarios.
     * @example
     * // Delete one Usuarios
     * const Usuarios = await prisma.usuarios.delete({
     *   where: {
     *     // ... filter to delete one Usuarios
     *   }
     * })
     * 
     */
    delete<T extends usuariosDeleteArgs>(args: SelectSubset<T, usuariosDeleteArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Usuarios.
     * @param {usuariosUpdateArgs} args - Arguments to update one Usuarios.
     * @example
     * // Update one Usuarios
     * const usuarios = await prisma.usuarios.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends usuariosUpdateArgs>(args: SelectSubset<T, usuariosUpdateArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Usuarios.
     * @param {usuariosDeleteManyArgs} args - Arguments to filter Usuarios to delete.
     * @example
     * // Delete a few Usuarios
     * const { count } = await prisma.usuarios.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends usuariosDeleteManyArgs>(args?: SelectSubset<T, usuariosDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Usuarios.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {usuariosUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Usuarios
     * const usuarios = await prisma.usuarios.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends usuariosUpdateManyArgs>(args: SelectSubset<T, usuariosUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Usuarios and returns the data updated in the database.
     * @param {usuariosUpdateManyAndReturnArgs} args - Arguments to update many Usuarios.
     * @example
     * // Update many Usuarios
     * const usuarios = await prisma.usuarios.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Usuarios and only return the `id_usuario`
     * const usuariosWithId_usuarioOnly = await prisma.usuarios.updateManyAndReturn({
     *   select: { id_usuario: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends usuariosUpdateManyAndReturnArgs>(args: SelectSubset<T, usuariosUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Usuarios.
     * @param {usuariosUpsertArgs} args - Arguments to update or create a Usuarios.
     * @example
     * // Update or create a Usuarios
     * const usuarios = await prisma.usuarios.upsert({
     *   create: {
     *     // ... data to create a Usuarios
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Usuarios we want to update
     *   }
     * })
     */
    upsert<T extends usuariosUpsertArgs>(args: SelectSubset<T, usuariosUpsertArgs<ExtArgs>>): Prisma__usuariosClient<$Result.GetResult<Prisma.$usuariosPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Usuarios.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {usuariosCountArgs} args - Arguments to filter Usuarios to count.
     * @example
     * // Count the number of Usuarios
     * const count = await prisma.usuarios.count({
     *   where: {
     *     // ... the filter for the Usuarios we want to count
     *   }
     * })
    **/
    count<T extends usuariosCountArgs>(
      args?: Subset<T, usuariosCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UsuariosCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Usuarios.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsuariosAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UsuariosAggregateArgs>(args: Subset<T, UsuariosAggregateArgs>): Prisma.PrismaPromise<GetUsuariosAggregateType<T>>

    /**
     * Group by Usuarios.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {usuariosGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends usuariosGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: usuariosGroupByArgs['orderBy'] }
        : { orderBy?: usuariosGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, usuariosGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUsuariosGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the usuarios model
   */
  readonly fields: usuariosFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for usuarios.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__usuariosClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    linea_base<T extends usuarios$linea_baseArgs<ExtArgs> = {}>(args?: Subset<T, usuarios$linea_baseArgs<ExtArgs>>): Prisma__linea_baseClient<$Result.GetResult<Prisma.$linea_basePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    linea_base_historial<T extends usuarios$linea_base_historialArgs<ExtArgs> = {}>(args?: Subset<T, usuarios$linea_base_historialArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$linea_base_historialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sesiones<T extends usuarios$sesionesArgs<ExtArgs> = {}>(args?: Subset<T, usuarios$sesionesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sesionesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    solicitudes_recuperacion<T extends usuarios$solicitudes_recuperacionArgs<ExtArgs> = {}>(args?: Subset<T, usuarios$solicitudes_recuperacionArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$solicitudes_recuperacionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    consentimientos<T extends consentimientosDefaultArgs<ExtArgs> = {}>(args?: Subset<T, consentimientosDefaultArgs<ExtArgs>>): Prisma__consentimientosClient<$Result.GetResult<Prisma.$consentimientosPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the usuarios model
   */
  interface usuariosFieldRefs {
    readonly id_usuario: FieldRef<"usuarios", 'String'>
    readonly correo_electronico: FieldRef<"usuarios", 'String'>
    readonly contrasena_hash: FieldRef<"usuarios", 'String'>
    readonly rol: FieldRef<"usuarios", 'rol_enum'>
    readonly estado_registro: FieldRef<"usuarios", 'estado_registro_enum'>
    readonly estado_cuenta: FieldRef<"usuarios", 'estado_cuenta_enum'>
    readonly fecha_registro: FieldRef<"usuarios", 'DateTime'>
    readonly fecha_actualizacion: FieldRef<"usuarios", 'DateTime'>
    readonly consentimiendo_aceptado: FieldRef<"usuarios", 'Boolean'>
    readonly registro_consumo_aceptado: FieldRef<"usuarios", 'Boolean'>
    readonly id_consentimiento: FieldRef<"usuarios", 'String'>
  }
    

  // Custom InputTypes
  /**
   * usuarios findUnique
   */
  export type usuariosFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * Filter, which usuarios to fetch.
     */
    where: usuariosWhereUniqueInput
  }

  /**
   * usuarios findUniqueOrThrow
   */
  export type usuariosFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * Filter, which usuarios to fetch.
     */
    where: usuariosWhereUniqueInput
  }

  /**
   * usuarios findFirst
   */
  export type usuariosFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * Filter, which usuarios to fetch.
     */
    where?: usuariosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of usuarios to fetch.
     */
    orderBy?: usuariosOrderByWithRelationInput | usuariosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for usuarios.
     */
    cursor?: usuariosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` usuarios from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` usuarios.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of usuarios.
     */
    distinct?: UsuariosScalarFieldEnum | UsuariosScalarFieldEnum[]
  }

  /**
   * usuarios findFirstOrThrow
   */
  export type usuariosFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * Filter, which usuarios to fetch.
     */
    where?: usuariosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of usuarios to fetch.
     */
    orderBy?: usuariosOrderByWithRelationInput | usuariosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for usuarios.
     */
    cursor?: usuariosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` usuarios from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` usuarios.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of usuarios.
     */
    distinct?: UsuariosScalarFieldEnum | UsuariosScalarFieldEnum[]
  }

  /**
   * usuarios findMany
   */
  export type usuariosFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * Filter, which usuarios to fetch.
     */
    where?: usuariosWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of usuarios to fetch.
     */
    orderBy?: usuariosOrderByWithRelationInput | usuariosOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing usuarios.
     */
    cursor?: usuariosWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` usuarios from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` usuarios.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of usuarios.
     */
    distinct?: UsuariosScalarFieldEnum | UsuariosScalarFieldEnum[]
  }

  /**
   * usuarios create
   */
  export type usuariosCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * The data needed to create a usuarios.
     */
    data: XOR<usuariosCreateInput, usuariosUncheckedCreateInput>
  }

  /**
   * usuarios createMany
   */
  export type usuariosCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many usuarios.
     */
    data: usuariosCreateManyInput | usuariosCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * usuarios createManyAndReturn
   */
  export type usuariosCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * The data used to create many usuarios.
     */
    data: usuariosCreateManyInput | usuariosCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * usuarios update
   */
  export type usuariosUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * The data needed to update a usuarios.
     */
    data: XOR<usuariosUpdateInput, usuariosUncheckedUpdateInput>
    /**
     * Choose, which usuarios to update.
     */
    where: usuariosWhereUniqueInput
  }

  /**
   * usuarios updateMany
   */
  export type usuariosUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update usuarios.
     */
    data: XOR<usuariosUpdateManyMutationInput, usuariosUncheckedUpdateManyInput>
    /**
     * Filter which usuarios to update
     */
    where?: usuariosWhereInput
    /**
     * Limit how many usuarios to update.
     */
    limit?: number
  }

  /**
   * usuarios updateManyAndReturn
   */
  export type usuariosUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * The data used to update usuarios.
     */
    data: XOR<usuariosUpdateManyMutationInput, usuariosUncheckedUpdateManyInput>
    /**
     * Filter which usuarios to update
     */
    where?: usuariosWhereInput
    /**
     * Limit how many usuarios to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * usuarios upsert
   */
  export type usuariosUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * The filter to search for the usuarios to update in case it exists.
     */
    where: usuariosWhereUniqueInput
    /**
     * In case the usuarios found by the `where` argument doesn't exist, create a new usuarios with this data.
     */
    create: XOR<usuariosCreateInput, usuariosUncheckedCreateInput>
    /**
     * In case the usuarios was found with the provided `where` argument, update it with this data.
     */
    update: XOR<usuariosUpdateInput, usuariosUncheckedUpdateInput>
  }

  /**
   * usuarios delete
   */
  export type usuariosDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
    /**
     * Filter which usuarios to delete.
     */
    where: usuariosWhereUniqueInput
  }

  /**
   * usuarios deleteMany
   */
  export type usuariosDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which usuarios to delete
     */
    where?: usuariosWhereInput
    /**
     * Limit how many usuarios to delete.
     */
    limit?: number
  }

  /**
   * usuarios.linea_base
   */
  export type usuarios$linea_baseArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base
     */
    select?: linea_baseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base
     */
    omit?: linea_baseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_baseInclude<ExtArgs> | null
    where?: linea_baseWhereInput
  }

  /**
   * usuarios.linea_base_historial
   */
  export type usuarios$linea_base_historialArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the linea_base_historial
     */
    select?: linea_base_historialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the linea_base_historial
     */
    omit?: linea_base_historialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: linea_base_historialInclude<ExtArgs> | null
    where?: linea_base_historialWhereInput
    orderBy?: linea_base_historialOrderByWithRelationInput | linea_base_historialOrderByWithRelationInput[]
    cursor?: linea_base_historialWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Linea_base_historialScalarFieldEnum | Linea_base_historialScalarFieldEnum[]
  }

  /**
   * usuarios.sesiones
   */
  export type usuarios$sesionesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sesiones
     */
    select?: sesionesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sesiones
     */
    omit?: sesionesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: sesionesInclude<ExtArgs> | null
    where?: sesionesWhereInput
    orderBy?: sesionesOrderByWithRelationInput | sesionesOrderByWithRelationInput[]
    cursor?: sesionesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SesionesScalarFieldEnum | SesionesScalarFieldEnum[]
  }

  /**
   * usuarios.solicitudes_recuperacion
   */
  export type usuarios$solicitudes_recuperacionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the solicitudes_recuperacion
     */
    select?: solicitudes_recuperacionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the solicitudes_recuperacion
     */
    omit?: solicitudes_recuperacionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: solicitudes_recuperacionInclude<ExtArgs> | null
    where?: solicitudes_recuperacionWhereInput
    orderBy?: solicitudes_recuperacionOrderByWithRelationInput | solicitudes_recuperacionOrderByWithRelationInput[]
    cursor?: solicitudes_recuperacionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Solicitudes_recuperacionScalarFieldEnum | Solicitudes_recuperacionScalarFieldEnum[]
  }

  /**
   * usuarios without action
   */
  export type usuariosDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the usuarios
     */
    select?: usuariosSelect<ExtArgs> | null
    /**
     * Omit specific fields from the usuarios
     */
    omit?: usuariosOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: usuariosInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ConsentimientosScalarFieldEnum: {
    id_consentimiento: 'id_consentimiento',
    version_consentimiento: 'version_consentimiento',
    vigente: 'vigente',
    fecha_invalidacion: 'fecha_invalidacion',
    motivo_invalidacion: 'motivo_invalidacion',
    url_contenido: 'url_contenido',
    titulo: 'titulo'
  };

  export type ConsentimientosScalarFieldEnum = (typeof ConsentimientosScalarFieldEnum)[keyof typeof ConsentimientosScalarFieldEnum]


  export const Linea_baseScalarFieldEnum: {
    id_linea_base: 'id_linea_base',
    id_usuario: 'id_usuario',
    entidad_educativa: 'entidad_educativa',
    programa_academico: 'programa_academico',
    semestre_cursado: 'semestre_cursado',
    nivel_academico: 'nivel_academico',
    ciudad: 'ciudad',
    fecha_inicio_consumo: 'fecha_inicio_consumo',
    motivo_inicio_consumo: 'motivo_inicio_consumo',
    fecha_ultimo_consumo: 'fecha_ultimo_consumo',
    frecuencia_consumo: 'frecuencia_consumo',
    fecha_creacion: 'fecha_creacion',
    fecha_actualizacion: 'fecha_actualizacion',
    fecha_nacimiento: 'fecha_nacimiento'
  };

  export type Linea_baseScalarFieldEnum = (typeof Linea_baseScalarFieldEnum)[keyof typeof Linea_baseScalarFieldEnum]


  export const Linea_base_historialScalarFieldEnum: {
    id_historial: 'id_historial',
    id_linea_base: 'id_linea_base',
    id_usuario: 'id_usuario',
    campos_modificados: 'campos_modificados',
    datos_anteriores: 'datos_anteriores',
    fecha_modificacion: 'fecha_modificacion'
  };

  export type Linea_base_historialScalarFieldEnum = (typeof Linea_base_historialScalarFieldEnum)[keyof typeof Linea_base_historialScalarFieldEnum]


  export const SesionesScalarFieldEnum: {
    id_sesion: 'id_sesion',
    id_usuario: 'id_usuario',
    fecha_inicio_sesion: 'fecha_inicio_sesion',
    fecha_ultima_interaccion: 'fecha_ultima_interaccion',
    limite_inactividad_minutos: 'limite_inactividad_minutos',
    estado_aplicacion: 'estado_aplicacion',
    activa: 'activa',
    fecha_cierre_sesion: 'fecha_cierre_sesion',
    motivo_cierre: 'motivo_cierre'
  };

  export type SesionesScalarFieldEnum = (typeof SesionesScalarFieldEnum)[keyof typeof SesionesScalarFieldEnum]


  export const Solicitudes_recuperacionScalarFieldEnum: {
    id_solicitud: 'id_solicitud',
    correo_electronico: 'correo_electronico',
    id_usuario: 'id_usuario',
    direccion_ip: 'direccion_ip',
    codigo_hash: 'codigo_hash',
    fecha_solicitud: 'fecha_solicitud',
    fecha_expiracion: 'fecha_expiracion',
    estado_codigo: 'estado_codigo'
  };

  export type Solicitudes_recuperacionScalarFieldEnum = (typeof Solicitudes_recuperacionScalarFieldEnum)[keyof typeof Solicitudes_recuperacionScalarFieldEnum]


  export const UsuariosScalarFieldEnum: {
    id_usuario: 'id_usuario',
    correo_electronico: 'correo_electronico',
    contrasena_hash: 'contrasena_hash',
    rol: 'rol',
    estado_registro: 'estado_registro',
    estado_cuenta: 'estado_cuenta',
    fecha_registro: 'fecha_registro',
    fecha_actualizacion: 'fecha_actualizacion',
    consentimiendo_aceptado: 'consentimiendo_aceptado',
    registro_consumo_aceptado: 'registro_consumo_aceptado',
    id_consentimiento: 'id_consentimiento'
  };

  export type UsuariosScalarFieldEnum = (typeof UsuariosScalarFieldEnum)[keyof typeof UsuariosScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'nivel_academico_enum'
   */
  export type Enumnivel_academico_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'nivel_academico_enum'>
    


  /**
   * Reference to a field of type 'nivel_academico_enum[]'
   */
  export type ListEnumnivel_academico_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'nivel_academico_enum[]'>
    


  /**
   * Reference to a field of type 'motivo_consumo_enum'
   */
  export type Enummotivo_consumo_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'motivo_consumo_enum'>
    


  /**
   * Reference to a field of type 'motivo_consumo_enum[]'
   */
  export type ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'motivo_consumo_enum[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'estado_aplicacion_enum'
   */
  export type Enumestado_aplicacion_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_aplicacion_enum'>
    


  /**
   * Reference to a field of type 'estado_aplicacion_enum[]'
   */
  export type ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_aplicacion_enum[]'>
    


  /**
   * Reference to a field of type 'motivo_cierre_enum'
   */
  export type Enummotivo_cierre_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'motivo_cierre_enum'>
    


  /**
   * Reference to a field of type 'motivo_cierre_enum[]'
   */
  export type ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'motivo_cierre_enum[]'>
    


  /**
   * Reference to a field of type 'estado_codigo_enum'
   */
  export type Enumestado_codigo_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_codigo_enum'>
    


  /**
   * Reference to a field of type 'estado_codigo_enum[]'
   */
  export type ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_codigo_enum[]'>
    


  /**
   * Reference to a field of type 'rol_enum'
   */
  export type Enumrol_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'rol_enum'>
    


  /**
   * Reference to a field of type 'rol_enum[]'
   */
  export type ListEnumrol_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'rol_enum[]'>
    


  /**
   * Reference to a field of type 'estado_registro_enum'
   */
  export type Enumestado_registro_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_registro_enum'>
    


  /**
   * Reference to a field of type 'estado_registro_enum[]'
   */
  export type ListEnumestado_registro_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_registro_enum[]'>
    


  /**
   * Reference to a field of type 'estado_cuenta_enum'
   */
  export type Enumestado_cuenta_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_cuenta_enum'>
    


  /**
   * Reference to a field of type 'estado_cuenta_enum[]'
   */
  export type ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'estado_cuenta_enum[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type consentimientosWhereInput = {
    AND?: consentimientosWhereInput | consentimientosWhereInput[]
    OR?: consentimientosWhereInput[]
    NOT?: consentimientosWhereInput | consentimientosWhereInput[]
    id_consentimiento?: UuidFilter<"consentimientos"> | string
    version_consentimiento?: StringFilter<"consentimientos"> | string
    vigente?: BoolFilter<"consentimientos"> | boolean
    fecha_invalidacion?: DateTimeNullableFilter<"consentimientos"> | Date | string | null
    motivo_invalidacion?: StringNullableFilter<"consentimientos"> | string | null
    url_contenido?: StringFilter<"consentimientos"> | string
    titulo?: StringFilter<"consentimientos"> | string
    usuarios?: UsuariosListRelationFilter
  }

  export type consentimientosOrderByWithRelationInput = {
    id_consentimiento?: SortOrder
    version_consentimiento?: SortOrder
    vigente?: SortOrder
    fecha_invalidacion?: SortOrderInput | SortOrder
    motivo_invalidacion?: SortOrderInput | SortOrder
    url_contenido?: SortOrder
    titulo?: SortOrder
    usuarios?: usuariosOrderByRelationAggregateInput
  }

  export type consentimientosWhereUniqueInput = Prisma.AtLeast<{
    id_consentimiento?: string
    AND?: consentimientosWhereInput | consentimientosWhereInput[]
    OR?: consentimientosWhereInput[]
    NOT?: consentimientosWhereInput | consentimientosWhereInput[]
    version_consentimiento?: StringFilter<"consentimientos"> | string
    vigente?: BoolFilter<"consentimientos"> | boolean
    fecha_invalidacion?: DateTimeNullableFilter<"consentimientos"> | Date | string | null
    motivo_invalidacion?: StringNullableFilter<"consentimientos"> | string | null
    url_contenido?: StringFilter<"consentimientos"> | string
    titulo?: StringFilter<"consentimientos"> | string
    usuarios?: UsuariosListRelationFilter
  }, "id_consentimiento">

  export type consentimientosOrderByWithAggregationInput = {
    id_consentimiento?: SortOrder
    version_consentimiento?: SortOrder
    vigente?: SortOrder
    fecha_invalidacion?: SortOrderInput | SortOrder
    motivo_invalidacion?: SortOrderInput | SortOrder
    url_contenido?: SortOrder
    titulo?: SortOrder
    _count?: consentimientosCountOrderByAggregateInput
    _max?: consentimientosMaxOrderByAggregateInput
    _min?: consentimientosMinOrderByAggregateInput
  }

  export type consentimientosScalarWhereWithAggregatesInput = {
    AND?: consentimientosScalarWhereWithAggregatesInput | consentimientosScalarWhereWithAggregatesInput[]
    OR?: consentimientosScalarWhereWithAggregatesInput[]
    NOT?: consentimientosScalarWhereWithAggregatesInput | consentimientosScalarWhereWithAggregatesInput[]
    id_consentimiento?: UuidWithAggregatesFilter<"consentimientos"> | string
    version_consentimiento?: StringWithAggregatesFilter<"consentimientos"> | string
    vigente?: BoolWithAggregatesFilter<"consentimientos"> | boolean
    fecha_invalidacion?: DateTimeNullableWithAggregatesFilter<"consentimientos"> | Date | string | null
    motivo_invalidacion?: StringNullableWithAggregatesFilter<"consentimientos"> | string | null
    url_contenido?: StringWithAggregatesFilter<"consentimientos"> | string
    titulo?: StringWithAggregatesFilter<"consentimientos"> | string
  }

  export type linea_baseWhereInput = {
    AND?: linea_baseWhereInput | linea_baseWhereInput[]
    OR?: linea_baseWhereInput[]
    NOT?: linea_baseWhereInput | linea_baseWhereInput[]
    id_linea_base?: UuidFilter<"linea_base"> | string
    id_usuario?: UuidFilter<"linea_base"> | string
    entidad_educativa?: StringFilter<"linea_base"> | string
    programa_academico?: StringFilter<"linea_base"> | string
    semestre_cursado?: IntFilter<"linea_base"> | number
    nivel_academico?: Enumnivel_academico_enumFilter<"linea_base"> | $Enums.nivel_academico_enum
    ciudad?: StringFilter<"linea_base"> | string
    fecha_inicio_consumo?: DateTimeFilter<"linea_base"> | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFilter<"linea_base"> | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFilter<"linea_base"> | Date | string
    frecuencia_consumo?: IntFilter<"linea_base"> | number
    fecha_creacion?: DateTimeFilter<"linea_base"> | Date | string
    fecha_actualizacion?: DateTimeFilter<"linea_base"> | Date | string
    fecha_nacimiento?: DateTimeNullableFilter<"linea_base"> | Date | string | null
    usuarios?: XOR<UsuariosScalarRelationFilter, usuariosWhereInput>
    linea_base_historial?: Linea_base_historialListRelationFilter
  }

  export type linea_baseOrderByWithRelationInput = {
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    entidad_educativa?: SortOrder
    programa_academico?: SortOrder
    semestre_cursado?: SortOrder
    nivel_academico?: SortOrder
    ciudad?: SortOrder
    fecha_inicio_consumo?: SortOrder
    motivo_inicio_consumo?: SortOrder
    fecha_ultimo_consumo?: SortOrder
    frecuencia_consumo?: SortOrder
    fecha_creacion?: SortOrder
    fecha_actualizacion?: SortOrder
    fecha_nacimiento?: SortOrderInput | SortOrder
    usuarios?: usuariosOrderByWithRelationInput
    linea_base_historial?: linea_base_historialOrderByRelationAggregateInput
  }

  export type linea_baseWhereUniqueInput = Prisma.AtLeast<{
    id_linea_base?: string
    id_usuario?: string
    AND?: linea_baseWhereInput | linea_baseWhereInput[]
    OR?: linea_baseWhereInput[]
    NOT?: linea_baseWhereInput | linea_baseWhereInput[]
    entidad_educativa?: StringFilter<"linea_base"> | string
    programa_academico?: StringFilter<"linea_base"> | string
    semestre_cursado?: IntFilter<"linea_base"> | number
    nivel_academico?: Enumnivel_academico_enumFilter<"linea_base"> | $Enums.nivel_academico_enum
    ciudad?: StringFilter<"linea_base"> | string
    fecha_inicio_consumo?: DateTimeFilter<"linea_base"> | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFilter<"linea_base"> | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFilter<"linea_base"> | Date | string
    frecuencia_consumo?: IntFilter<"linea_base"> | number
    fecha_creacion?: DateTimeFilter<"linea_base"> | Date | string
    fecha_actualizacion?: DateTimeFilter<"linea_base"> | Date | string
    fecha_nacimiento?: DateTimeNullableFilter<"linea_base"> | Date | string | null
    usuarios?: XOR<UsuariosScalarRelationFilter, usuariosWhereInput>
    linea_base_historial?: Linea_base_historialListRelationFilter
  }, "id_linea_base" | "id_usuario">

  export type linea_baseOrderByWithAggregationInput = {
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    entidad_educativa?: SortOrder
    programa_academico?: SortOrder
    semestre_cursado?: SortOrder
    nivel_academico?: SortOrder
    ciudad?: SortOrder
    fecha_inicio_consumo?: SortOrder
    motivo_inicio_consumo?: SortOrder
    fecha_ultimo_consumo?: SortOrder
    frecuencia_consumo?: SortOrder
    fecha_creacion?: SortOrder
    fecha_actualizacion?: SortOrder
    fecha_nacimiento?: SortOrderInput | SortOrder
    _count?: linea_baseCountOrderByAggregateInput
    _avg?: linea_baseAvgOrderByAggregateInput
    _max?: linea_baseMaxOrderByAggregateInput
    _min?: linea_baseMinOrderByAggregateInput
    _sum?: linea_baseSumOrderByAggregateInput
  }

  export type linea_baseScalarWhereWithAggregatesInput = {
    AND?: linea_baseScalarWhereWithAggregatesInput | linea_baseScalarWhereWithAggregatesInput[]
    OR?: linea_baseScalarWhereWithAggregatesInput[]
    NOT?: linea_baseScalarWhereWithAggregatesInput | linea_baseScalarWhereWithAggregatesInput[]
    id_linea_base?: UuidWithAggregatesFilter<"linea_base"> | string
    id_usuario?: UuidWithAggregatesFilter<"linea_base"> | string
    entidad_educativa?: StringWithAggregatesFilter<"linea_base"> | string
    programa_academico?: StringWithAggregatesFilter<"linea_base"> | string
    semestre_cursado?: IntWithAggregatesFilter<"linea_base"> | number
    nivel_academico?: Enumnivel_academico_enumWithAggregatesFilter<"linea_base"> | $Enums.nivel_academico_enum
    ciudad?: StringWithAggregatesFilter<"linea_base"> | string
    fecha_inicio_consumo?: DateTimeWithAggregatesFilter<"linea_base"> | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumWithAggregatesFilter<"linea_base"> | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeWithAggregatesFilter<"linea_base"> | Date | string
    frecuencia_consumo?: IntWithAggregatesFilter<"linea_base"> | number
    fecha_creacion?: DateTimeWithAggregatesFilter<"linea_base"> | Date | string
    fecha_actualizacion?: DateTimeWithAggregatesFilter<"linea_base"> | Date | string
    fecha_nacimiento?: DateTimeNullableWithAggregatesFilter<"linea_base"> | Date | string | null
  }

  export type linea_base_historialWhereInput = {
    AND?: linea_base_historialWhereInput | linea_base_historialWhereInput[]
    OR?: linea_base_historialWhereInput[]
    NOT?: linea_base_historialWhereInput | linea_base_historialWhereInput[]
    id_historial?: BigIntFilter<"linea_base_historial"> | bigint | number
    id_linea_base?: UuidFilter<"linea_base_historial"> | string
    id_usuario?: UuidFilter<"linea_base_historial"> | string
    campos_modificados?: StringNullableListFilter<"linea_base_historial">
    datos_anteriores?: JsonFilter<"linea_base_historial">
    fecha_modificacion?: DateTimeFilter<"linea_base_historial"> | Date | string
    linea_base?: XOR<Linea_baseScalarRelationFilter, linea_baseWhereInput>
    usuarios?: XOR<UsuariosScalarRelationFilter, usuariosWhereInput>
  }

  export type linea_base_historialOrderByWithRelationInput = {
    id_historial?: SortOrder
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    campos_modificados?: SortOrder
    datos_anteriores?: SortOrder
    fecha_modificacion?: SortOrder
    linea_base?: linea_baseOrderByWithRelationInput
    usuarios?: usuariosOrderByWithRelationInput
  }

  export type linea_base_historialWhereUniqueInput = Prisma.AtLeast<{
    id_historial?: bigint | number
    AND?: linea_base_historialWhereInput | linea_base_historialWhereInput[]
    OR?: linea_base_historialWhereInput[]
    NOT?: linea_base_historialWhereInput | linea_base_historialWhereInput[]
    id_linea_base?: UuidFilter<"linea_base_historial"> | string
    id_usuario?: UuidFilter<"linea_base_historial"> | string
    campos_modificados?: StringNullableListFilter<"linea_base_historial">
    datos_anteriores?: JsonFilter<"linea_base_historial">
    fecha_modificacion?: DateTimeFilter<"linea_base_historial"> | Date | string
    linea_base?: XOR<Linea_baseScalarRelationFilter, linea_baseWhereInput>
    usuarios?: XOR<UsuariosScalarRelationFilter, usuariosWhereInput>
  }, "id_historial">

  export type linea_base_historialOrderByWithAggregationInput = {
    id_historial?: SortOrder
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    campos_modificados?: SortOrder
    datos_anteriores?: SortOrder
    fecha_modificacion?: SortOrder
    _count?: linea_base_historialCountOrderByAggregateInput
    _avg?: linea_base_historialAvgOrderByAggregateInput
    _max?: linea_base_historialMaxOrderByAggregateInput
    _min?: linea_base_historialMinOrderByAggregateInput
    _sum?: linea_base_historialSumOrderByAggregateInput
  }

  export type linea_base_historialScalarWhereWithAggregatesInput = {
    AND?: linea_base_historialScalarWhereWithAggregatesInput | linea_base_historialScalarWhereWithAggregatesInput[]
    OR?: linea_base_historialScalarWhereWithAggregatesInput[]
    NOT?: linea_base_historialScalarWhereWithAggregatesInput | linea_base_historialScalarWhereWithAggregatesInput[]
    id_historial?: BigIntWithAggregatesFilter<"linea_base_historial"> | bigint | number
    id_linea_base?: UuidWithAggregatesFilter<"linea_base_historial"> | string
    id_usuario?: UuidWithAggregatesFilter<"linea_base_historial"> | string
    campos_modificados?: StringNullableListFilter<"linea_base_historial">
    datos_anteriores?: JsonWithAggregatesFilter<"linea_base_historial">
    fecha_modificacion?: DateTimeWithAggregatesFilter<"linea_base_historial"> | Date | string
  }

  export type sesionesWhereInput = {
    AND?: sesionesWhereInput | sesionesWhereInput[]
    OR?: sesionesWhereInput[]
    NOT?: sesionesWhereInput | sesionesWhereInput[]
    id_sesion?: UuidFilter<"sesiones"> | string
    id_usuario?: UuidFilter<"sesiones"> | string
    fecha_inicio_sesion?: DateTimeFilter<"sesiones"> | Date | string
    fecha_ultima_interaccion?: DateTimeFilter<"sesiones"> | Date | string
    limite_inactividad_minutos?: IntFilter<"sesiones"> | number
    estado_aplicacion?: Enumestado_aplicacion_enumFilter<"sesiones"> | $Enums.estado_aplicacion_enum
    activa?: BoolFilter<"sesiones"> | boolean
    fecha_cierre_sesion?: DateTimeNullableFilter<"sesiones"> | Date | string | null
    motivo_cierre?: Enummotivo_cierre_enumNullableFilter<"sesiones"> | $Enums.motivo_cierre_enum | null
    usuarios?: XOR<UsuariosScalarRelationFilter, usuariosWhereInput>
  }

  export type sesionesOrderByWithRelationInput = {
    id_sesion?: SortOrder
    id_usuario?: SortOrder
    fecha_inicio_sesion?: SortOrder
    fecha_ultima_interaccion?: SortOrder
    limite_inactividad_minutos?: SortOrder
    estado_aplicacion?: SortOrder
    activa?: SortOrder
    fecha_cierre_sesion?: SortOrderInput | SortOrder
    motivo_cierre?: SortOrderInput | SortOrder
    usuarios?: usuariosOrderByWithRelationInput
  }

  export type sesionesWhereUniqueInput = Prisma.AtLeast<{
    id_sesion?: string
    AND?: sesionesWhereInput | sesionesWhereInput[]
    OR?: sesionesWhereInput[]
    NOT?: sesionesWhereInput | sesionesWhereInput[]
    id_usuario?: UuidFilter<"sesiones"> | string
    fecha_inicio_sesion?: DateTimeFilter<"sesiones"> | Date | string
    fecha_ultima_interaccion?: DateTimeFilter<"sesiones"> | Date | string
    limite_inactividad_minutos?: IntFilter<"sesiones"> | number
    estado_aplicacion?: Enumestado_aplicacion_enumFilter<"sesiones"> | $Enums.estado_aplicacion_enum
    activa?: BoolFilter<"sesiones"> | boolean
    fecha_cierre_sesion?: DateTimeNullableFilter<"sesiones"> | Date | string | null
    motivo_cierre?: Enummotivo_cierre_enumNullableFilter<"sesiones"> | $Enums.motivo_cierre_enum | null
    usuarios?: XOR<UsuariosScalarRelationFilter, usuariosWhereInput>
  }, "id_sesion">

  export type sesionesOrderByWithAggregationInput = {
    id_sesion?: SortOrder
    id_usuario?: SortOrder
    fecha_inicio_sesion?: SortOrder
    fecha_ultima_interaccion?: SortOrder
    limite_inactividad_minutos?: SortOrder
    estado_aplicacion?: SortOrder
    activa?: SortOrder
    fecha_cierre_sesion?: SortOrderInput | SortOrder
    motivo_cierre?: SortOrderInput | SortOrder
    _count?: sesionesCountOrderByAggregateInput
    _avg?: sesionesAvgOrderByAggregateInput
    _max?: sesionesMaxOrderByAggregateInput
    _min?: sesionesMinOrderByAggregateInput
    _sum?: sesionesSumOrderByAggregateInput
  }

  export type sesionesScalarWhereWithAggregatesInput = {
    AND?: sesionesScalarWhereWithAggregatesInput | sesionesScalarWhereWithAggregatesInput[]
    OR?: sesionesScalarWhereWithAggregatesInput[]
    NOT?: sesionesScalarWhereWithAggregatesInput | sesionesScalarWhereWithAggregatesInput[]
    id_sesion?: UuidWithAggregatesFilter<"sesiones"> | string
    id_usuario?: UuidWithAggregatesFilter<"sesiones"> | string
    fecha_inicio_sesion?: DateTimeWithAggregatesFilter<"sesiones"> | Date | string
    fecha_ultima_interaccion?: DateTimeWithAggregatesFilter<"sesiones"> | Date | string
    limite_inactividad_minutos?: IntWithAggregatesFilter<"sesiones"> | number
    estado_aplicacion?: Enumestado_aplicacion_enumWithAggregatesFilter<"sesiones"> | $Enums.estado_aplicacion_enum
    activa?: BoolWithAggregatesFilter<"sesiones"> | boolean
    fecha_cierre_sesion?: DateTimeNullableWithAggregatesFilter<"sesiones"> | Date | string | null
    motivo_cierre?: Enummotivo_cierre_enumNullableWithAggregatesFilter<"sesiones"> | $Enums.motivo_cierre_enum | null
  }

  export type solicitudes_recuperacionWhereInput = {
    AND?: solicitudes_recuperacionWhereInput | solicitudes_recuperacionWhereInput[]
    OR?: solicitudes_recuperacionWhereInput[]
    NOT?: solicitudes_recuperacionWhereInput | solicitudes_recuperacionWhereInput[]
    id_solicitud?: UuidFilter<"solicitudes_recuperacion"> | string
    correo_electronico?: StringFilter<"solicitudes_recuperacion"> | string
    id_usuario?: UuidNullableFilter<"solicitudes_recuperacion"> | string | null
    direccion_ip?: StringFilter<"solicitudes_recuperacion"> | string
    codigo_hash?: StringNullableFilter<"solicitudes_recuperacion"> | string | null
    fecha_solicitud?: DateTimeFilter<"solicitudes_recuperacion"> | Date | string
    fecha_expiracion?: DateTimeNullableFilter<"solicitudes_recuperacion"> | Date | string | null
    estado_codigo?: Enumestado_codigo_enumNullableFilter<"solicitudes_recuperacion"> | $Enums.estado_codigo_enum | null
    usuarios?: XOR<UsuariosNullableScalarRelationFilter, usuariosWhereInput> | null
  }

  export type solicitudes_recuperacionOrderByWithRelationInput = {
    id_solicitud?: SortOrder
    correo_electronico?: SortOrder
    id_usuario?: SortOrderInput | SortOrder
    direccion_ip?: SortOrder
    codigo_hash?: SortOrderInput | SortOrder
    fecha_solicitud?: SortOrder
    fecha_expiracion?: SortOrderInput | SortOrder
    estado_codigo?: SortOrderInput | SortOrder
    usuarios?: usuariosOrderByWithRelationInput
  }

  export type solicitudes_recuperacionWhereUniqueInput = Prisma.AtLeast<{
    id_solicitud?: string
    AND?: solicitudes_recuperacionWhereInput | solicitudes_recuperacionWhereInput[]
    OR?: solicitudes_recuperacionWhereInput[]
    NOT?: solicitudes_recuperacionWhereInput | solicitudes_recuperacionWhereInput[]
    correo_electronico?: StringFilter<"solicitudes_recuperacion"> | string
    id_usuario?: UuidNullableFilter<"solicitudes_recuperacion"> | string | null
    direccion_ip?: StringFilter<"solicitudes_recuperacion"> | string
    codigo_hash?: StringNullableFilter<"solicitudes_recuperacion"> | string | null
    fecha_solicitud?: DateTimeFilter<"solicitudes_recuperacion"> | Date | string
    fecha_expiracion?: DateTimeNullableFilter<"solicitudes_recuperacion"> | Date | string | null
    estado_codigo?: Enumestado_codigo_enumNullableFilter<"solicitudes_recuperacion"> | $Enums.estado_codigo_enum | null
    usuarios?: XOR<UsuariosNullableScalarRelationFilter, usuariosWhereInput> | null
  }, "id_solicitud">

  export type solicitudes_recuperacionOrderByWithAggregationInput = {
    id_solicitud?: SortOrder
    correo_electronico?: SortOrder
    id_usuario?: SortOrderInput | SortOrder
    direccion_ip?: SortOrder
    codigo_hash?: SortOrderInput | SortOrder
    fecha_solicitud?: SortOrder
    fecha_expiracion?: SortOrderInput | SortOrder
    estado_codigo?: SortOrderInput | SortOrder
    _count?: solicitudes_recuperacionCountOrderByAggregateInput
    _max?: solicitudes_recuperacionMaxOrderByAggregateInput
    _min?: solicitudes_recuperacionMinOrderByAggregateInput
  }

  export type solicitudes_recuperacionScalarWhereWithAggregatesInput = {
    AND?: solicitudes_recuperacionScalarWhereWithAggregatesInput | solicitudes_recuperacionScalarWhereWithAggregatesInput[]
    OR?: solicitudes_recuperacionScalarWhereWithAggregatesInput[]
    NOT?: solicitudes_recuperacionScalarWhereWithAggregatesInput | solicitudes_recuperacionScalarWhereWithAggregatesInput[]
    id_solicitud?: UuidWithAggregatesFilter<"solicitudes_recuperacion"> | string
    correo_electronico?: StringWithAggregatesFilter<"solicitudes_recuperacion"> | string
    id_usuario?: UuidNullableWithAggregatesFilter<"solicitudes_recuperacion"> | string | null
    direccion_ip?: StringWithAggregatesFilter<"solicitudes_recuperacion"> | string
    codigo_hash?: StringNullableWithAggregatesFilter<"solicitudes_recuperacion"> | string | null
    fecha_solicitud?: DateTimeWithAggregatesFilter<"solicitudes_recuperacion"> | Date | string
    fecha_expiracion?: DateTimeNullableWithAggregatesFilter<"solicitudes_recuperacion"> | Date | string | null
    estado_codigo?: Enumestado_codigo_enumNullableWithAggregatesFilter<"solicitudes_recuperacion"> | $Enums.estado_codigo_enum | null
  }

  export type usuariosWhereInput = {
    AND?: usuariosWhereInput | usuariosWhereInput[]
    OR?: usuariosWhereInput[]
    NOT?: usuariosWhereInput | usuariosWhereInput[]
    id_usuario?: UuidFilter<"usuarios"> | string
    correo_electronico?: StringFilter<"usuarios"> | string
    contrasena_hash?: StringFilter<"usuarios"> | string
    rol?: Enumrol_enumFilter<"usuarios"> | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFilter<"usuarios"> | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFilter<"usuarios"> | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFilter<"usuarios"> | Date | string
    fecha_actualizacion?: DateTimeFilter<"usuarios"> | Date | string
    consentimiendo_aceptado?: BoolNullableFilter<"usuarios"> | boolean | null
    registro_consumo_aceptado?: BoolNullableFilter<"usuarios"> | boolean | null
    id_consentimiento?: UuidFilter<"usuarios"> | string
    linea_base?: XOR<Linea_baseNullableScalarRelationFilter, linea_baseWhereInput> | null
    linea_base_historial?: Linea_base_historialListRelationFilter
    sesiones?: SesionesListRelationFilter
    solicitudes_recuperacion?: Solicitudes_recuperacionListRelationFilter
    consentimientos?: XOR<ConsentimientosScalarRelationFilter, consentimientosWhereInput>
  }

  export type usuariosOrderByWithRelationInput = {
    id_usuario?: SortOrder
    correo_electronico?: SortOrder
    contrasena_hash?: SortOrder
    rol?: SortOrder
    estado_registro?: SortOrder
    estado_cuenta?: SortOrder
    fecha_registro?: SortOrder
    fecha_actualizacion?: SortOrder
    consentimiendo_aceptado?: SortOrderInput | SortOrder
    registro_consumo_aceptado?: SortOrderInput | SortOrder
    id_consentimiento?: SortOrder
    linea_base?: linea_baseOrderByWithRelationInput
    linea_base_historial?: linea_base_historialOrderByRelationAggregateInput
    sesiones?: sesionesOrderByRelationAggregateInput
    solicitudes_recuperacion?: solicitudes_recuperacionOrderByRelationAggregateInput
    consentimientos?: consentimientosOrderByWithRelationInput
  }

  export type usuariosWhereUniqueInput = Prisma.AtLeast<{
    id_usuario?: string
    correo_electronico?: string
    AND?: usuariosWhereInput | usuariosWhereInput[]
    OR?: usuariosWhereInput[]
    NOT?: usuariosWhereInput | usuariosWhereInput[]
    contrasena_hash?: StringFilter<"usuarios"> | string
    rol?: Enumrol_enumFilter<"usuarios"> | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFilter<"usuarios"> | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFilter<"usuarios"> | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFilter<"usuarios"> | Date | string
    fecha_actualizacion?: DateTimeFilter<"usuarios"> | Date | string
    consentimiendo_aceptado?: BoolNullableFilter<"usuarios"> | boolean | null
    registro_consumo_aceptado?: BoolNullableFilter<"usuarios"> | boolean | null
    id_consentimiento?: UuidFilter<"usuarios"> | string
    linea_base?: XOR<Linea_baseNullableScalarRelationFilter, linea_baseWhereInput> | null
    linea_base_historial?: Linea_base_historialListRelationFilter
    sesiones?: SesionesListRelationFilter
    solicitudes_recuperacion?: Solicitudes_recuperacionListRelationFilter
    consentimientos?: XOR<ConsentimientosScalarRelationFilter, consentimientosWhereInput>
  }, "id_usuario" | "correo_electronico">

  export type usuariosOrderByWithAggregationInput = {
    id_usuario?: SortOrder
    correo_electronico?: SortOrder
    contrasena_hash?: SortOrder
    rol?: SortOrder
    estado_registro?: SortOrder
    estado_cuenta?: SortOrder
    fecha_registro?: SortOrder
    fecha_actualizacion?: SortOrder
    consentimiendo_aceptado?: SortOrderInput | SortOrder
    registro_consumo_aceptado?: SortOrderInput | SortOrder
    id_consentimiento?: SortOrder
    _count?: usuariosCountOrderByAggregateInput
    _max?: usuariosMaxOrderByAggregateInput
    _min?: usuariosMinOrderByAggregateInput
  }

  export type usuariosScalarWhereWithAggregatesInput = {
    AND?: usuariosScalarWhereWithAggregatesInput | usuariosScalarWhereWithAggregatesInput[]
    OR?: usuariosScalarWhereWithAggregatesInput[]
    NOT?: usuariosScalarWhereWithAggregatesInput | usuariosScalarWhereWithAggregatesInput[]
    id_usuario?: UuidWithAggregatesFilter<"usuarios"> | string
    correo_electronico?: StringWithAggregatesFilter<"usuarios"> | string
    contrasena_hash?: StringWithAggregatesFilter<"usuarios"> | string
    rol?: Enumrol_enumWithAggregatesFilter<"usuarios"> | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumWithAggregatesFilter<"usuarios"> | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumWithAggregatesFilter<"usuarios"> | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeWithAggregatesFilter<"usuarios"> | Date | string
    fecha_actualizacion?: DateTimeWithAggregatesFilter<"usuarios"> | Date | string
    consentimiendo_aceptado?: BoolNullableWithAggregatesFilter<"usuarios"> | boolean | null
    registro_consumo_aceptado?: BoolNullableWithAggregatesFilter<"usuarios"> | boolean | null
    id_consentimiento?: UuidWithAggregatesFilter<"usuarios"> | string
  }

  export type consentimientosCreateInput = {
    id_consentimiento?: string
    version_consentimiento: string
    vigente?: boolean
    fecha_invalidacion?: Date | string | null
    motivo_invalidacion?: string | null
    url_contenido: string
    titulo: string
    usuarios?: usuariosCreateNestedManyWithoutConsentimientosInput
  }

  export type consentimientosUncheckedCreateInput = {
    id_consentimiento?: string
    version_consentimiento: string
    vigente?: boolean
    fecha_invalidacion?: Date | string | null
    motivo_invalidacion?: string | null
    url_contenido: string
    titulo: string
    usuarios?: usuariosUncheckedCreateNestedManyWithoutConsentimientosInput
  }

  export type consentimientosUpdateInput = {
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    version_consentimiento?: StringFieldUpdateOperationsInput | string
    vigente?: BoolFieldUpdateOperationsInput | boolean
    fecha_invalidacion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_invalidacion?: NullableStringFieldUpdateOperationsInput | string | null
    url_contenido?: StringFieldUpdateOperationsInput | string
    titulo?: StringFieldUpdateOperationsInput | string
    usuarios?: usuariosUpdateManyWithoutConsentimientosNestedInput
  }

  export type consentimientosUncheckedUpdateInput = {
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    version_consentimiento?: StringFieldUpdateOperationsInput | string
    vigente?: BoolFieldUpdateOperationsInput | boolean
    fecha_invalidacion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_invalidacion?: NullableStringFieldUpdateOperationsInput | string | null
    url_contenido?: StringFieldUpdateOperationsInput | string
    titulo?: StringFieldUpdateOperationsInput | string
    usuarios?: usuariosUncheckedUpdateManyWithoutConsentimientosNestedInput
  }

  export type consentimientosCreateManyInput = {
    id_consentimiento?: string
    version_consentimiento: string
    vigente?: boolean
    fecha_invalidacion?: Date | string | null
    motivo_invalidacion?: string | null
    url_contenido: string
    titulo: string
  }

  export type consentimientosUpdateManyMutationInput = {
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    version_consentimiento?: StringFieldUpdateOperationsInput | string
    vigente?: BoolFieldUpdateOperationsInput | boolean
    fecha_invalidacion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_invalidacion?: NullableStringFieldUpdateOperationsInput | string | null
    url_contenido?: StringFieldUpdateOperationsInput | string
    titulo?: StringFieldUpdateOperationsInput | string
  }

  export type consentimientosUncheckedUpdateManyInput = {
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    version_consentimiento?: StringFieldUpdateOperationsInput | string
    vigente?: BoolFieldUpdateOperationsInput | boolean
    fecha_invalidacion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_invalidacion?: NullableStringFieldUpdateOperationsInput | string | null
    url_contenido?: StringFieldUpdateOperationsInput | string
    titulo?: StringFieldUpdateOperationsInput | string
  }

  export type linea_baseCreateInput = {
    id_linea_base?: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date | string
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date | string
    frecuencia_consumo: number
    fecha_creacion?: Date | string
    fecha_actualizacion?: Date | string
    fecha_nacimiento?: Date | string | null
    usuarios: usuariosCreateNestedOneWithoutLinea_baseInput
    linea_base_historial?: linea_base_historialCreateNestedManyWithoutLinea_baseInput
  }

  export type linea_baseUncheckedCreateInput = {
    id_linea_base?: string
    id_usuario: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date | string
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date | string
    frecuencia_consumo: number
    fecha_creacion?: Date | string
    fecha_actualizacion?: Date | string
    fecha_nacimiento?: Date | string | null
    linea_base_historial?: linea_base_historialUncheckedCreateNestedManyWithoutLinea_baseInput
  }

  export type linea_baseUpdateInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    usuarios?: usuariosUpdateOneRequiredWithoutLinea_baseNestedInput
    linea_base_historial?: linea_base_historialUpdateManyWithoutLinea_baseNestedInput
  }

  export type linea_baseUncheckedUpdateInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    id_usuario?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    linea_base_historial?: linea_base_historialUncheckedUpdateManyWithoutLinea_baseNestedInput
  }

  export type linea_baseCreateManyInput = {
    id_linea_base?: string
    id_usuario: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date | string
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date | string
    frecuencia_consumo: number
    fecha_creacion?: Date | string
    fecha_actualizacion?: Date | string
    fecha_nacimiento?: Date | string | null
  }

  export type linea_baseUpdateManyMutationInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type linea_baseUncheckedUpdateManyInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    id_usuario?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type linea_base_historialCreateInput = {
    id_historial?: bigint | number
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
    linea_base: linea_baseCreateNestedOneWithoutLinea_base_historialInput
    usuarios: usuariosCreateNestedOneWithoutLinea_base_historialInput
  }

  export type linea_base_historialUncheckedCreateInput = {
    id_historial?: bigint | number
    id_linea_base: string
    id_usuario: string
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
  }

  export type linea_base_historialUpdateInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
    linea_base?: linea_baseUpdateOneRequiredWithoutLinea_base_historialNestedInput
    usuarios?: usuariosUpdateOneRequiredWithoutLinea_base_historialNestedInput
  }

  export type linea_base_historialUncheckedUpdateInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    id_linea_base?: StringFieldUpdateOperationsInput | string
    id_usuario?: StringFieldUpdateOperationsInput | string
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type linea_base_historialCreateManyInput = {
    id_historial?: bigint | number
    id_linea_base: string
    id_usuario: string
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
  }

  export type linea_base_historialUpdateManyMutationInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type linea_base_historialUncheckedUpdateManyInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    id_linea_base?: StringFieldUpdateOperationsInput | string
    id_usuario?: StringFieldUpdateOperationsInput | string
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sesionesCreateInput = {
    id_sesion?: string
    fecha_inicio_sesion?: Date | string
    fecha_ultima_interaccion?: Date | string
    limite_inactividad_minutos?: number
    estado_aplicacion?: $Enums.estado_aplicacion_enum
    activa?: boolean
    fecha_cierre_sesion?: Date | string | null
    motivo_cierre?: $Enums.motivo_cierre_enum | null
    usuarios: usuariosCreateNestedOneWithoutSesionesInput
  }

  export type sesionesUncheckedCreateInput = {
    id_sesion?: string
    id_usuario: string
    fecha_inicio_sesion?: Date | string
    fecha_ultima_interaccion?: Date | string
    limite_inactividad_minutos?: number
    estado_aplicacion?: $Enums.estado_aplicacion_enum
    activa?: boolean
    fecha_cierre_sesion?: Date | string | null
    motivo_cierre?: $Enums.motivo_cierre_enum | null
  }

  export type sesionesUpdateInput = {
    id_sesion?: StringFieldUpdateOperationsInput | string
    fecha_inicio_sesion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_ultima_interaccion?: DateTimeFieldUpdateOperationsInput | Date | string
    limite_inactividad_minutos?: IntFieldUpdateOperationsInput | number
    estado_aplicacion?: Enumestado_aplicacion_enumFieldUpdateOperationsInput | $Enums.estado_aplicacion_enum
    activa?: BoolFieldUpdateOperationsInput | boolean
    fecha_cierre_sesion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_cierre?: NullableEnummotivo_cierre_enumFieldUpdateOperationsInput | $Enums.motivo_cierre_enum | null
    usuarios?: usuariosUpdateOneRequiredWithoutSesionesNestedInput
  }

  export type sesionesUncheckedUpdateInput = {
    id_sesion?: StringFieldUpdateOperationsInput | string
    id_usuario?: StringFieldUpdateOperationsInput | string
    fecha_inicio_sesion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_ultima_interaccion?: DateTimeFieldUpdateOperationsInput | Date | string
    limite_inactividad_minutos?: IntFieldUpdateOperationsInput | number
    estado_aplicacion?: Enumestado_aplicacion_enumFieldUpdateOperationsInput | $Enums.estado_aplicacion_enum
    activa?: BoolFieldUpdateOperationsInput | boolean
    fecha_cierre_sesion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_cierre?: NullableEnummotivo_cierre_enumFieldUpdateOperationsInput | $Enums.motivo_cierre_enum | null
  }

  export type sesionesCreateManyInput = {
    id_sesion?: string
    id_usuario: string
    fecha_inicio_sesion?: Date | string
    fecha_ultima_interaccion?: Date | string
    limite_inactividad_minutos?: number
    estado_aplicacion?: $Enums.estado_aplicacion_enum
    activa?: boolean
    fecha_cierre_sesion?: Date | string | null
    motivo_cierre?: $Enums.motivo_cierre_enum | null
  }

  export type sesionesUpdateManyMutationInput = {
    id_sesion?: StringFieldUpdateOperationsInput | string
    fecha_inicio_sesion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_ultima_interaccion?: DateTimeFieldUpdateOperationsInput | Date | string
    limite_inactividad_minutos?: IntFieldUpdateOperationsInput | number
    estado_aplicacion?: Enumestado_aplicacion_enumFieldUpdateOperationsInput | $Enums.estado_aplicacion_enum
    activa?: BoolFieldUpdateOperationsInput | boolean
    fecha_cierre_sesion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_cierre?: NullableEnummotivo_cierre_enumFieldUpdateOperationsInput | $Enums.motivo_cierre_enum | null
  }

  export type sesionesUncheckedUpdateManyInput = {
    id_sesion?: StringFieldUpdateOperationsInput | string
    id_usuario?: StringFieldUpdateOperationsInput | string
    fecha_inicio_sesion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_ultima_interaccion?: DateTimeFieldUpdateOperationsInput | Date | string
    limite_inactividad_minutos?: IntFieldUpdateOperationsInput | number
    estado_aplicacion?: Enumestado_aplicacion_enumFieldUpdateOperationsInput | $Enums.estado_aplicacion_enum
    activa?: BoolFieldUpdateOperationsInput | boolean
    fecha_cierre_sesion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_cierre?: NullableEnummotivo_cierre_enumFieldUpdateOperationsInput | $Enums.motivo_cierre_enum | null
  }

  export type solicitudes_recuperacionCreateInput = {
    id_solicitud?: string
    correo_electronico: string
    direccion_ip: string
    codigo_hash?: string | null
    fecha_solicitud?: Date | string
    fecha_expiracion?: Date | string | null
    estado_codigo?: $Enums.estado_codigo_enum | null
    usuarios?: usuariosCreateNestedOneWithoutSolicitudes_recuperacionInput
  }

  export type solicitudes_recuperacionUncheckedCreateInput = {
    id_solicitud?: string
    correo_electronico: string
    id_usuario?: string | null
    direccion_ip: string
    codigo_hash?: string | null
    fecha_solicitud?: Date | string
    fecha_expiracion?: Date | string | null
    estado_codigo?: $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionUpdateInput = {
    id_solicitud?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    direccion_ip?: StringFieldUpdateOperationsInput | string
    codigo_hash?: NullableStringFieldUpdateOperationsInput | string | null
    fecha_solicitud?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_expiracion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estado_codigo?: NullableEnumestado_codigo_enumFieldUpdateOperationsInput | $Enums.estado_codigo_enum | null
    usuarios?: usuariosUpdateOneWithoutSolicitudes_recuperacionNestedInput
  }

  export type solicitudes_recuperacionUncheckedUpdateInput = {
    id_solicitud?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    id_usuario?: NullableStringFieldUpdateOperationsInput | string | null
    direccion_ip?: StringFieldUpdateOperationsInput | string
    codigo_hash?: NullableStringFieldUpdateOperationsInput | string | null
    fecha_solicitud?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_expiracion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estado_codigo?: NullableEnumestado_codigo_enumFieldUpdateOperationsInput | $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionCreateManyInput = {
    id_solicitud?: string
    correo_electronico: string
    id_usuario?: string | null
    direccion_ip: string
    codigo_hash?: string | null
    fecha_solicitud?: Date | string
    fecha_expiracion?: Date | string | null
    estado_codigo?: $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionUpdateManyMutationInput = {
    id_solicitud?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    direccion_ip?: StringFieldUpdateOperationsInput | string
    codigo_hash?: NullableStringFieldUpdateOperationsInput | string | null
    fecha_solicitud?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_expiracion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estado_codigo?: NullableEnumestado_codigo_enumFieldUpdateOperationsInput | $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionUncheckedUpdateManyInput = {
    id_solicitud?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    id_usuario?: NullableStringFieldUpdateOperationsInput | string | null
    direccion_ip?: StringFieldUpdateOperationsInput | string
    codigo_hash?: NullableStringFieldUpdateOperationsInput | string | null
    fecha_solicitud?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_expiracion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estado_codigo?: NullableEnumestado_codigo_enumFieldUpdateOperationsInput | $Enums.estado_codigo_enum | null
  }

  export type usuariosCreateInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    linea_base?: linea_baseCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionCreateNestedManyWithoutUsuariosInput
    consentimientos: consentimientosCreateNestedOneWithoutUsuariosInput
  }

  export type usuariosUncheckedCreateInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    id_consentimiento: string
    linea_base?: linea_baseUncheckedCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialUncheckedCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesUncheckedCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedCreateNestedManyWithoutUsuariosInput
  }

  export type usuariosUpdateInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    linea_base?: linea_baseUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUpdateManyWithoutUsuariosNestedInput
    consentimientos?: consentimientosUpdateOneRequiredWithoutUsuariosNestedInput
  }

  export type usuariosUncheckedUpdateInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    linea_base?: linea_baseUncheckedUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUncheckedUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUncheckedUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosNestedInput
  }

  export type usuariosCreateManyInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    id_consentimiento: string
  }

  export type usuariosUpdateManyMutationInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type usuariosUncheckedUpdateManyInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    id_consentimiento?: StringFieldUpdateOperationsInput | string
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type UsuariosListRelationFilter = {
    every?: usuariosWhereInput
    some?: usuariosWhereInput
    none?: usuariosWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type usuariosOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type consentimientosCountOrderByAggregateInput = {
    id_consentimiento?: SortOrder
    version_consentimiento?: SortOrder
    vigente?: SortOrder
    fecha_invalidacion?: SortOrder
    motivo_invalidacion?: SortOrder
    url_contenido?: SortOrder
    titulo?: SortOrder
  }

  export type consentimientosMaxOrderByAggregateInput = {
    id_consentimiento?: SortOrder
    version_consentimiento?: SortOrder
    vigente?: SortOrder
    fecha_invalidacion?: SortOrder
    motivo_invalidacion?: SortOrder
    url_contenido?: SortOrder
    titulo?: SortOrder
  }

  export type consentimientosMinOrderByAggregateInput = {
    id_consentimiento?: SortOrder
    version_consentimiento?: SortOrder
    vigente?: SortOrder
    fecha_invalidacion?: SortOrder
    motivo_invalidacion?: SortOrder
    url_contenido?: SortOrder
    titulo?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type Enumnivel_academico_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.nivel_academico_enum | Enumnivel_academico_enumFieldRefInput<$PrismaModel>
    in?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumnivel_academico_enumFilter<$PrismaModel> | $Enums.nivel_academico_enum
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type Enummotivo_consumo_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_consumo_enum | Enummotivo_consumo_enumFieldRefInput<$PrismaModel>
    in?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    not?: NestedEnummotivo_consumo_enumFilter<$PrismaModel> | $Enums.motivo_consumo_enum
  }

  export type UsuariosScalarRelationFilter = {
    is?: usuariosWhereInput
    isNot?: usuariosWhereInput
  }

  export type Linea_base_historialListRelationFilter = {
    every?: linea_base_historialWhereInput
    some?: linea_base_historialWhereInput
    none?: linea_base_historialWhereInput
  }

  export type linea_base_historialOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type linea_baseCountOrderByAggregateInput = {
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    entidad_educativa?: SortOrder
    programa_academico?: SortOrder
    semestre_cursado?: SortOrder
    nivel_academico?: SortOrder
    ciudad?: SortOrder
    fecha_inicio_consumo?: SortOrder
    motivo_inicio_consumo?: SortOrder
    fecha_ultimo_consumo?: SortOrder
    frecuencia_consumo?: SortOrder
    fecha_creacion?: SortOrder
    fecha_actualizacion?: SortOrder
    fecha_nacimiento?: SortOrder
  }

  export type linea_baseAvgOrderByAggregateInput = {
    semestre_cursado?: SortOrder
    frecuencia_consumo?: SortOrder
  }

  export type linea_baseMaxOrderByAggregateInput = {
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    entidad_educativa?: SortOrder
    programa_academico?: SortOrder
    semestre_cursado?: SortOrder
    nivel_academico?: SortOrder
    ciudad?: SortOrder
    fecha_inicio_consumo?: SortOrder
    motivo_inicio_consumo?: SortOrder
    fecha_ultimo_consumo?: SortOrder
    frecuencia_consumo?: SortOrder
    fecha_creacion?: SortOrder
    fecha_actualizacion?: SortOrder
    fecha_nacimiento?: SortOrder
  }

  export type linea_baseMinOrderByAggregateInput = {
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    entidad_educativa?: SortOrder
    programa_academico?: SortOrder
    semestre_cursado?: SortOrder
    nivel_academico?: SortOrder
    ciudad?: SortOrder
    fecha_inicio_consumo?: SortOrder
    motivo_inicio_consumo?: SortOrder
    fecha_ultimo_consumo?: SortOrder
    frecuencia_consumo?: SortOrder
    fecha_creacion?: SortOrder
    fecha_actualizacion?: SortOrder
    fecha_nacimiento?: SortOrder
  }

  export type linea_baseSumOrderByAggregateInput = {
    semestre_cursado?: SortOrder
    frecuencia_consumo?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type Enumnivel_academico_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.nivel_academico_enum | Enumnivel_academico_enumFieldRefInput<$PrismaModel>
    in?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumnivel_academico_enumWithAggregatesFilter<$PrismaModel> | $Enums.nivel_academico_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumnivel_academico_enumFilter<$PrismaModel>
    _max?: NestedEnumnivel_academico_enumFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type Enummotivo_consumo_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_consumo_enum | Enummotivo_consumo_enumFieldRefInput<$PrismaModel>
    in?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    not?: NestedEnummotivo_consumo_enumWithAggregatesFilter<$PrismaModel> | $Enums.motivo_consumo_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnummotivo_consumo_enumFilter<$PrismaModel>
    _max?: NestedEnummotivo_consumo_enumFilter<$PrismaModel>
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type Linea_baseScalarRelationFilter = {
    is?: linea_baseWhereInput
    isNot?: linea_baseWhereInput
  }

  export type linea_base_historialCountOrderByAggregateInput = {
    id_historial?: SortOrder
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    campos_modificados?: SortOrder
    datos_anteriores?: SortOrder
    fecha_modificacion?: SortOrder
  }

  export type linea_base_historialAvgOrderByAggregateInput = {
    id_historial?: SortOrder
  }

  export type linea_base_historialMaxOrderByAggregateInput = {
    id_historial?: SortOrder
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    fecha_modificacion?: SortOrder
  }

  export type linea_base_historialMinOrderByAggregateInput = {
    id_historial?: SortOrder
    id_linea_base?: SortOrder
    id_usuario?: SortOrder
    fecha_modificacion?: SortOrder
  }

  export type linea_base_historialSumOrderByAggregateInput = {
    id_historial?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type Enumestado_aplicacion_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_aplicacion_enum | Enumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_aplicacion_enumFilter<$PrismaModel> | $Enums.estado_aplicacion_enum
  }

  export type Enummotivo_cierre_enumNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_cierre_enum | Enummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnummotivo_cierre_enumNullableFilter<$PrismaModel> | $Enums.motivo_cierre_enum | null
  }

  export type sesionesCountOrderByAggregateInput = {
    id_sesion?: SortOrder
    id_usuario?: SortOrder
    fecha_inicio_sesion?: SortOrder
    fecha_ultima_interaccion?: SortOrder
    limite_inactividad_minutos?: SortOrder
    estado_aplicacion?: SortOrder
    activa?: SortOrder
    fecha_cierre_sesion?: SortOrder
    motivo_cierre?: SortOrder
  }

  export type sesionesAvgOrderByAggregateInput = {
    limite_inactividad_minutos?: SortOrder
  }

  export type sesionesMaxOrderByAggregateInput = {
    id_sesion?: SortOrder
    id_usuario?: SortOrder
    fecha_inicio_sesion?: SortOrder
    fecha_ultima_interaccion?: SortOrder
    limite_inactividad_minutos?: SortOrder
    estado_aplicacion?: SortOrder
    activa?: SortOrder
    fecha_cierre_sesion?: SortOrder
    motivo_cierre?: SortOrder
  }

  export type sesionesMinOrderByAggregateInput = {
    id_sesion?: SortOrder
    id_usuario?: SortOrder
    fecha_inicio_sesion?: SortOrder
    fecha_ultima_interaccion?: SortOrder
    limite_inactividad_minutos?: SortOrder
    estado_aplicacion?: SortOrder
    activa?: SortOrder
    fecha_cierre_sesion?: SortOrder
    motivo_cierre?: SortOrder
  }

  export type sesionesSumOrderByAggregateInput = {
    limite_inactividad_minutos?: SortOrder
  }

  export type Enumestado_aplicacion_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_aplicacion_enum | Enumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_aplicacion_enumWithAggregatesFilter<$PrismaModel> | $Enums.estado_aplicacion_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumestado_aplicacion_enumFilter<$PrismaModel>
    _max?: NestedEnumestado_aplicacion_enumFilter<$PrismaModel>
  }

  export type Enummotivo_cierre_enumNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_cierre_enum | Enummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnummotivo_cierre_enumNullableWithAggregatesFilter<$PrismaModel> | $Enums.motivo_cierre_enum | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnummotivo_cierre_enumNullableFilter<$PrismaModel>
    _max?: NestedEnummotivo_cierre_enumNullableFilter<$PrismaModel>
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type Enumestado_codigo_enumNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_codigo_enum | Enumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnumestado_codigo_enumNullableFilter<$PrismaModel> | $Enums.estado_codigo_enum | null
  }

  export type UsuariosNullableScalarRelationFilter = {
    is?: usuariosWhereInput | null
    isNot?: usuariosWhereInput | null
  }

  export type solicitudes_recuperacionCountOrderByAggregateInput = {
    id_solicitud?: SortOrder
    correo_electronico?: SortOrder
    id_usuario?: SortOrder
    direccion_ip?: SortOrder
    codigo_hash?: SortOrder
    fecha_solicitud?: SortOrder
    fecha_expiracion?: SortOrder
    estado_codigo?: SortOrder
  }

  export type solicitudes_recuperacionMaxOrderByAggregateInput = {
    id_solicitud?: SortOrder
    correo_electronico?: SortOrder
    id_usuario?: SortOrder
    direccion_ip?: SortOrder
    codigo_hash?: SortOrder
    fecha_solicitud?: SortOrder
    fecha_expiracion?: SortOrder
    estado_codigo?: SortOrder
  }

  export type solicitudes_recuperacionMinOrderByAggregateInput = {
    id_solicitud?: SortOrder
    correo_electronico?: SortOrder
    id_usuario?: SortOrder
    direccion_ip?: SortOrder
    codigo_hash?: SortOrder
    fecha_solicitud?: SortOrder
    fecha_expiracion?: SortOrder
    estado_codigo?: SortOrder
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type Enumestado_codigo_enumNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_codigo_enum | Enumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnumestado_codigo_enumNullableWithAggregatesFilter<$PrismaModel> | $Enums.estado_codigo_enum | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumestado_codigo_enumNullableFilter<$PrismaModel>
    _max?: NestedEnumestado_codigo_enumNullableFilter<$PrismaModel>
  }

  export type Enumrol_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.rol_enum | Enumrol_enumFieldRefInput<$PrismaModel>
    in?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumrol_enumFilter<$PrismaModel> | $Enums.rol_enum
  }

  export type Enumestado_registro_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_registro_enum | Enumestado_registro_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_registro_enumFilter<$PrismaModel> | $Enums.estado_registro_enum
  }

  export type Enumestado_cuenta_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_cuenta_enum | Enumestado_cuenta_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_cuenta_enumFilter<$PrismaModel> | $Enums.estado_cuenta_enum
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type Linea_baseNullableScalarRelationFilter = {
    is?: linea_baseWhereInput | null
    isNot?: linea_baseWhereInput | null
  }

  export type SesionesListRelationFilter = {
    every?: sesionesWhereInput
    some?: sesionesWhereInput
    none?: sesionesWhereInput
  }

  export type Solicitudes_recuperacionListRelationFilter = {
    every?: solicitudes_recuperacionWhereInput
    some?: solicitudes_recuperacionWhereInput
    none?: solicitudes_recuperacionWhereInput
  }

  export type ConsentimientosScalarRelationFilter = {
    is?: consentimientosWhereInput
    isNot?: consentimientosWhereInput
  }

  export type sesionesOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type solicitudes_recuperacionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type usuariosCountOrderByAggregateInput = {
    id_usuario?: SortOrder
    correo_electronico?: SortOrder
    contrasena_hash?: SortOrder
    rol?: SortOrder
    estado_registro?: SortOrder
    estado_cuenta?: SortOrder
    fecha_registro?: SortOrder
    fecha_actualizacion?: SortOrder
    consentimiendo_aceptado?: SortOrder
    registro_consumo_aceptado?: SortOrder
    id_consentimiento?: SortOrder
  }

  export type usuariosMaxOrderByAggregateInput = {
    id_usuario?: SortOrder
    correo_electronico?: SortOrder
    contrasena_hash?: SortOrder
    rol?: SortOrder
    estado_registro?: SortOrder
    estado_cuenta?: SortOrder
    fecha_registro?: SortOrder
    fecha_actualizacion?: SortOrder
    consentimiendo_aceptado?: SortOrder
    registro_consumo_aceptado?: SortOrder
    id_consentimiento?: SortOrder
  }

  export type usuariosMinOrderByAggregateInput = {
    id_usuario?: SortOrder
    correo_electronico?: SortOrder
    contrasena_hash?: SortOrder
    rol?: SortOrder
    estado_registro?: SortOrder
    estado_cuenta?: SortOrder
    fecha_registro?: SortOrder
    fecha_actualizacion?: SortOrder
    consentimiendo_aceptado?: SortOrder
    registro_consumo_aceptado?: SortOrder
    id_consentimiento?: SortOrder
  }

  export type Enumrol_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.rol_enum | Enumrol_enumFieldRefInput<$PrismaModel>
    in?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumrol_enumWithAggregatesFilter<$PrismaModel> | $Enums.rol_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumrol_enumFilter<$PrismaModel>
    _max?: NestedEnumrol_enumFilter<$PrismaModel>
  }

  export type Enumestado_registro_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_registro_enum | Enumestado_registro_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_registro_enumWithAggregatesFilter<$PrismaModel> | $Enums.estado_registro_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumestado_registro_enumFilter<$PrismaModel>
    _max?: NestedEnumestado_registro_enumFilter<$PrismaModel>
  }

  export type Enumestado_cuenta_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_cuenta_enum | Enumestado_cuenta_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_cuenta_enumWithAggregatesFilter<$PrismaModel> | $Enums.estado_cuenta_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumestado_cuenta_enumFilter<$PrismaModel>
    _max?: NestedEnumestado_cuenta_enumFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type usuariosCreateNestedManyWithoutConsentimientosInput = {
    create?: XOR<usuariosCreateWithoutConsentimientosInput, usuariosUncheckedCreateWithoutConsentimientosInput> | usuariosCreateWithoutConsentimientosInput[] | usuariosUncheckedCreateWithoutConsentimientosInput[]
    connectOrCreate?: usuariosCreateOrConnectWithoutConsentimientosInput | usuariosCreateOrConnectWithoutConsentimientosInput[]
    createMany?: usuariosCreateManyConsentimientosInputEnvelope
    connect?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
  }

  export type usuariosUncheckedCreateNestedManyWithoutConsentimientosInput = {
    create?: XOR<usuariosCreateWithoutConsentimientosInput, usuariosUncheckedCreateWithoutConsentimientosInput> | usuariosCreateWithoutConsentimientosInput[] | usuariosUncheckedCreateWithoutConsentimientosInput[]
    connectOrCreate?: usuariosCreateOrConnectWithoutConsentimientosInput | usuariosCreateOrConnectWithoutConsentimientosInput[]
    createMany?: usuariosCreateManyConsentimientosInputEnvelope
    connect?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type usuariosUpdateManyWithoutConsentimientosNestedInput = {
    create?: XOR<usuariosCreateWithoutConsentimientosInput, usuariosUncheckedCreateWithoutConsentimientosInput> | usuariosCreateWithoutConsentimientosInput[] | usuariosUncheckedCreateWithoutConsentimientosInput[]
    connectOrCreate?: usuariosCreateOrConnectWithoutConsentimientosInput | usuariosCreateOrConnectWithoutConsentimientosInput[]
    upsert?: usuariosUpsertWithWhereUniqueWithoutConsentimientosInput | usuariosUpsertWithWhereUniqueWithoutConsentimientosInput[]
    createMany?: usuariosCreateManyConsentimientosInputEnvelope
    set?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    disconnect?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    delete?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    connect?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    update?: usuariosUpdateWithWhereUniqueWithoutConsentimientosInput | usuariosUpdateWithWhereUniqueWithoutConsentimientosInput[]
    updateMany?: usuariosUpdateManyWithWhereWithoutConsentimientosInput | usuariosUpdateManyWithWhereWithoutConsentimientosInput[]
    deleteMany?: usuariosScalarWhereInput | usuariosScalarWhereInput[]
  }

  export type usuariosUncheckedUpdateManyWithoutConsentimientosNestedInput = {
    create?: XOR<usuariosCreateWithoutConsentimientosInput, usuariosUncheckedCreateWithoutConsentimientosInput> | usuariosCreateWithoutConsentimientosInput[] | usuariosUncheckedCreateWithoutConsentimientosInput[]
    connectOrCreate?: usuariosCreateOrConnectWithoutConsentimientosInput | usuariosCreateOrConnectWithoutConsentimientosInput[]
    upsert?: usuariosUpsertWithWhereUniqueWithoutConsentimientosInput | usuariosUpsertWithWhereUniqueWithoutConsentimientosInput[]
    createMany?: usuariosCreateManyConsentimientosInputEnvelope
    set?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    disconnect?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    delete?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    connect?: usuariosWhereUniqueInput | usuariosWhereUniqueInput[]
    update?: usuariosUpdateWithWhereUniqueWithoutConsentimientosInput | usuariosUpdateWithWhereUniqueWithoutConsentimientosInput[]
    updateMany?: usuariosUpdateManyWithWhereWithoutConsentimientosInput | usuariosUpdateManyWithWhereWithoutConsentimientosInput[]
    deleteMany?: usuariosScalarWhereInput | usuariosScalarWhereInput[]
  }

  export type usuariosCreateNestedOneWithoutLinea_baseInput = {
    create?: XOR<usuariosCreateWithoutLinea_baseInput, usuariosUncheckedCreateWithoutLinea_baseInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutLinea_baseInput
    connect?: usuariosWhereUniqueInput
  }

  export type linea_base_historialCreateNestedManyWithoutLinea_baseInput = {
    create?: XOR<linea_base_historialCreateWithoutLinea_baseInput, linea_base_historialUncheckedCreateWithoutLinea_baseInput> | linea_base_historialCreateWithoutLinea_baseInput[] | linea_base_historialUncheckedCreateWithoutLinea_baseInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutLinea_baseInput | linea_base_historialCreateOrConnectWithoutLinea_baseInput[]
    createMany?: linea_base_historialCreateManyLinea_baseInputEnvelope
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
  }

  export type linea_base_historialUncheckedCreateNestedManyWithoutLinea_baseInput = {
    create?: XOR<linea_base_historialCreateWithoutLinea_baseInput, linea_base_historialUncheckedCreateWithoutLinea_baseInput> | linea_base_historialCreateWithoutLinea_baseInput[] | linea_base_historialUncheckedCreateWithoutLinea_baseInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutLinea_baseInput | linea_base_historialCreateOrConnectWithoutLinea_baseInput[]
    createMany?: linea_base_historialCreateManyLinea_baseInputEnvelope
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type Enumnivel_academico_enumFieldUpdateOperationsInput = {
    set?: $Enums.nivel_academico_enum
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type Enummotivo_consumo_enumFieldUpdateOperationsInput = {
    set?: $Enums.motivo_consumo_enum
  }

  export type usuariosUpdateOneRequiredWithoutLinea_baseNestedInput = {
    create?: XOR<usuariosCreateWithoutLinea_baseInput, usuariosUncheckedCreateWithoutLinea_baseInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutLinea_baseInput
    upsert?: usuariosUpsertWithoutLinea_baseInput
    connect?: usuariosWhereUniqueInput
    update?: XOR<XOR<usuariosUpdateToOneWithWhereWithoutLinea_baseInput, usuariosUpdateWithoutLinea_baseInput>, usuariosUncheckedUpdateWithoutLinea_baseInput>
  }

  export type linea_base_historialUpdateManyWithoutLinea_baseNestedInput = {
    create?: XOR<linea_base_historialCreateWithoutLinea_baseInput, linea_base_historialUncheckedCreateWithoutLinea_baseInput> | linea_base_historialCreateWithoutLinea_baseInput[] | linea_base_historialUncheckedCreateWithoutLinea_baseInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutLinea_baseInput | linea_base_historialCreateOrConnectWithoutLinea_baseInput[]
    upsert?: linea_base_historialUpsertWithWhereUniqueWithoutLinea_baseInput | linea_base_historialUpsertWithWhereUniqueWithoutLinea_baseInput[]
    createMany?: linea_base_historialCreateManyLinea_baseInputEnvelope
    set?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    disconnect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    delete?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    update?: linea_base_historialUpdateWithWhereUniqueWithoutLinea_baseInput | linea_base_historialUpdateWithWhereUniqueWithoutLinea_baseInput[]
    updateMany?: linea_base_historialUpdateManyWithWhereWithoutLinea_baseInput | linea_base_historialUpdateManyWithWhereWithoutLinea_baseInput[]
    deleteMany?: linea_base_historialScalarWhereInput | linea_base_historialScalarWhereInput[]
  }

  export type linea_base_historialUncheckedUpdateManyWithoutLinea_baseNestedInput = {
    create?: XOR<linea_base_historialCreateWithoutLinea_baseInput, linea_base_historialUncheckedCreateWithoutLinea_baseInput> | linea_base_historialCreateWithoutLinea_baseInput[] | linea_base_historialUncheckedCreateWithoutLinea_baseInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutLinea_baseInput | linea_base_historialCreateOrConnectWithoutLinea_baseInput[]
    upsert?: linea_base_historialUpsertWithWhereUniqueWithoutLinea_baseInput | linea_base_historialUpsertWithWhereUniqueWithoutLinea_baseInput[]
    createMany?: linea_base_historialCreateManyLinea_baseInputEnvelope
    set?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    disconnect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    delete?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    update?: linea_base_historialUpdateWithWhereUniqueWithoutLinea_baseInput | linea_base_historialUpdateWithWhereUniqueWithoutLinea_baseInput[]
    updateMany?: linea_base_historialUpdateManyWithWhereWithoutLinea_baseInput | linea_base_historialUpdateManyWithWhereWithoutLinea_baseInput[]
    deleteMany?: linea_base_historialScalarWhereInput | linea_base_historialScalarWhereInput[]
  }

  export type linea_base_historialCreatecampos_modificadosInput = {
    set: string[]
  }

  export type linea_baseCreateNestedOneWithoutLinea_base_historialInput = {
    create?: XOR<linea_baseCreateWithoutLinea_base_historialInput, linea_baseUncheckedCreateWithoutLinea_base_historialInput>
    connectOrCreate?: linea_baseCreateOrConnectWithoutLinea_base_historialInput
    connect?: linea_baseWhereUniqueInput
  }

  export type usuariosCreateNestedOneWithoutLinea_base_historialInput = {
    create?: XOR<usuariosCreateWithoutLinea_base_historialInput, usuariosUncheckedCreateWithoutLinea_base_historialInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutLinea_base_historialInput
    connect?: usuariosWhereUniqueInput
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type linea_base_historialUpdatecampos_modificadosInput = {
    set?: string[]
    push?: string | string[]
  }

  export type linea_baseUpdateOneRequiredWithoutLinea_base_historialNestedInput = {
    create?: XOR<linea_baseCreateWithoutLinea_base_historialInput, linea_baseUncheckedCreateWithoutLinea_base_historialInput>
    connectOrCreate?: linea_baseCreateOrConnectWithoutLinea_base_historialInput
    upsert?: linea_baseUpsertWithoutLinea_base_historialInput
    connect?: linea_baseWhereUniqueInput
    update?: XOR<XOR<linea_baseUpdateToOneWithWhereWithoutLinea_base_historialInput, linea_baseUpdateWithoutLinea_base_historialInput>, linea_baseUncheckedUpdateWithoutLinea_base_historialInput>
  }

  export type usuariosUpdateOneRequiredWithoutLinea_base_historialNestedInput = {
    create?: XOR<usuariosCreateWithoutLinea_base_historialInput, usuariosUncheckedCreateWithoutLinea_base_historialInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutLinea_base_historialInput
    upsert?: usuariosUpsertWithoutLinea_base_historialInput
    connect?: usuariosWhereUniqueInput
    update?: XOR<XOR<usuariosUpdateToOneWithWhereWithoutLinea_base_historialInput, usuariosUpdateWithoutLinea_base_historialInput>, usuariosUncheckedUpdateWithoutLinea_base_historialInput>
  }

  export type usuariosCreateNestedOneWithoutSesionesInput = {
    create?: XOR<usuariosCreateWithoutSesionesInput, usuariosUncheckedCreateWithoutSesionesInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutSesionesInput
    connect?: usuariosWhereUniqueInput
  }

  export type Enumestado_aplicacion_enumFieldUpdateOperationsInput = {
    set?: $Enums.estado_aplicacion_enum
  }

  export type NullableEnummotivo_cierre_enumFieldUpdateOperationsInput = {
    set?: $Enums.motivo_cierre_enum | null
  }

  export type usuariosUpdateOneRequiredWithoutSesionesNestedInput = {
    create?: XOR<usuariosCreateWithoutSesionesInput, usuariosUncheckedCreateWithoutSesionesInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutSesionesInput
    upsert?: usuariosUpsertWithoutSesionesInput
    connect?: usuariosWhereUniqueInput
    update?: XOR<XOR<usuariosUpdateToOneWithWhereWithoutSesionesInput, usuariosUpdateWithoutSesionesInput>, usuariosUncheckedUpdateWithoutSesionesInput>
  }

  export type usuariosCreateNestedOneWithoutSolicitudes_recuperacionInput = {
    create?: XOR<usuariosCreateWithoutSolicitudes_recuperacionInput, usuariosUncheckedCreateWithoutSolicitudes_recuperacionInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutSolicitudes_recuperacionInput
    connect?: usuariosWhereUniqueInput
  }

  export type NullableEnumestado_codigo_enumFieldUpdateOperationsInput = {
    set?: $Enums.estado_codigo_enum | null
  }

  export type usuariosUpdateOneWithoutSolicitudes_recuperacionNestedInput = {
    create?: XOR<usuariosCreateWithoutSolicitudes_recuperacionInput, usuariosUncheckedCreateWithoutSolicitudes_recuperacionInput>
    connectOrCreate?: usuariosCreateOrConnectWithoutSolicitudes_recuperacionInput
    upsert?: usuariosUpsertWithoutSolicitudes_recuperacionInput
    disconnect?: usuariosWhereInput | boolean
    delete?: usuariosWhereInput | boolean
    connect?: usuariosWhereUniqueInput
    update?: XOR<XOR<usuariosUpdateToOneWithWhereWithoutSolicitudes_recuperacionInput, usuariosUpdateWithoutSolicitudes_recuperacionInput>, usuariosUncheckedUpdateWithoutSolicitudes_recuperacionInput>
  }

  export type linea_baseCreateNestedOneWithoutUsuariosInput = {
    create?: XOR<linea_baseCreateWithoutUsuariosInput, linea_baseUncheckedCreateWithoutUsuariosInput>
    connectOrCreate?: linea_baseCreateOrConnectWithoutUsuariosInput
    connect?: linea_baseWhereUniqueInput
  }

  export type linea_base_historialCreateNestedManyWithoutUsuariosInput = {
    create?: XOR<linea_base_historialCreateWithoutUsuariosInput, linea_base_historialUncheckedCreateWithoutUsuariosInput> | linea_base_historialCreateWithoutUsuariosInput[] | linea_base_historialUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutUsuariosInput | linea_base_historialCreateOrConnectWithoutUsuariosInput[]
    createMany?: linea_base_historialCreateManyUsuariosInputEnvelope
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
  }

  export type sesionesCreateNestedManyWithoutUsuariosInput = {
    create?: XOR<sesionesCreateWithoutUsuariosInput, sesionesUncheckedCreateWithoutUsuariosInput> | sesionesCreateWithoutUsuariosInput[] | sesionesUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: sesionesCreateOrConnectWithoutUsuariosInput | sesionesCreateOrConnectWithoutUsuariosInput[]
    createMany?: sesionesCreateManyUsuariosInputEnvelope
    connect?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
  }

  export type solicitudes_recuperacionCreateNestedManyWithoutUsuariosInput = {
    create?: XOR<solicitudes_recuperacionCreateWithoutUsuariosInput, solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput> | solicitudes_recuperacionCreateWithoutUsuariosInput[] | solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput | solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput[]
    createMany?: solicitudes_recuperacionCreateManyUsuariosInputEnvelope
    connect?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
  }

  export type consentimientosCreateNestedOneWithoutUsuariosInput = {
    create?: XOR<consentimientosCreateWithoutUsuariosInput, consentimientosUncheckedCreateWithoutUsuariosInput>
    connectOrCreate?: consentimientosCreateOrConnectWithoutUsuariosInput
    connect?: consentimientosWhereUniqueInput
  }

  export type linea_baseUncheckedCreateNestedOneWithoutUsuariosInput = {
    create?: XOR<linea_baseCreateWithoutUsuariosInput, linea_baseUncheckedCreateWithoutUsuariosInput>
    connectOrCreate?: linea_baseCreateOrConnectWithoutUsuariosInput
    connect?: linea_baseWhereUniqueInput
  }

  export type linea_base_historialUncheckedCreateNestedManyWithoutUsuariosInput = {
    create?: XOR<linea_base_historialCreateWithoutUsuariosInput, linea_base_historialUncheckedCreateWithoutUsuariosInput> | linea_base_historialCreateWithoutUsuariosInput[] | linea_base_historialUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutUsuariosInput | linea_base_historialCreateOrConnectWithoutUsuariosInput[]
    createMany?: linea_base_historialCreateManyUsuariosInputEnvelope
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
  }

  export type sesionesUncheckedCreateNestedManyWithoutUsuariosInput = {
    create?: XOR<sesionesCreateWithoutUsuariosInput, sesionesUncheckedCreateWithoutUsuariosInput> | sesionesCreateWithoutUsuariosInput[] | sesionesUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: sesionesCreateOrConnectWithoutUsuariosInput | sesionesCreateOrConnectWithoutUsuariosInput[]
    createMany?: sesionesCreateManyUsuariosInputEnvelope
    connect?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
  }

  export type solicitudes_recuperacionUncheckedCreateNestedManyWithoutUsuariosInput = {
    create?: XOR<solicitudes_recuperacionCreateWithoutUsuariosInput, solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput> | solicitudes_recuperacionCreateWithoutUsuariosInput[] | solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput | solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput[]
    createMany?: solicitudes_recuperacionCreateManyUsuariosInputEnvelope
    connect?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
  }

  export type Enumrol_enumFieldUpdateOperationsInput = {
    set?: $Enums.rol_enum
  }

  export type Enumestado_registro_enumFieldUpdateOperationsInput = {
    set?: $Enums.estado_registro_enum
  }

  export type Enumestado_cuenta_enumFieldUpdateOperationsInput = {
    set?: $Enums.estado_cuenta_enum
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type linea_baseUpdateOneWithoutUsuariosNestedInput = {
    create?: XOR<linea_baseCreateWithoutUsuariosInput, linea_baseUncheckedCreateWithoutUsuariosInput>
    connectOrCreate?: linea_baseCreateOrConnectWithoutUsuariosInput
    upsert?: linea_baseUpsertWithoutUsuariosInput
    disconnect?: linea_baseWhereInput | boolean
    delete?: linea_baseWhereInput | boolean
    connect?: linea_baseWhereUniqueInput
    update?: XOR<XOR<linea_baseUpdateToOneWithWhereWithoutUsuariosInput, linea_baseUpdateWithoutUsuariosInput>, linea_baseUncheckedUpdateWithoutUsuariosInput>
  }

  export type linea_base_historialUpdateManyWithoutUsuariosNestedInput = {
    create?: XOR<linea_base_historialCreateWithoutUsuariosInput, linea_base_historialUncheckedCreateWithoutUsuariosInput> | linea_base_historialCreateWithoutUsuariosInput[] | linea_base_historialUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutUsuariosInput | linea_base_historialCreateOrConnectWithoutUsuariosInput[]
    upsert?: linea_base_historialUpsertWithWhereUniqueWithoutUsuariosInput | linea_base_historialUpsertWithWhereUniqueWithoutUsuariosInput[]
    createMany?: linea_base_historialCreateManyUsuariosInputEnvelope
    set?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    disconnect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    delete?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    update?: linea_base_historialUpdateWithWhereUniqueWithoutUsuariosInput | linea_base_historialUpdateWithWhereUniqueWithoutUsuariosInput[]
    updateMany?: linea_base_historialUpdateManyWithWhereWithoutUsuariosInput | linea_base_historialUpdateManyWithWhereWithoutUsuariosInput[]
    deleteMany?: linea_base_historialScalarWhereInput | linea_base_historialScalarWhereInput[]
  }

  export type sesionesUpdateManyWithoutUsuariosNestedInput = {
    create?: XOR<sesionesCreateWithoutUsuariosInput, sesionesUncheckedCreateWithoutUsuariosInput> | sesionesCreateWithoutUsuariosInput[] | sesionesUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: sesionesCreateOrConnectWithoutUsuariosInput | sesionesCreateOrConnectWithoutUsuariosInput[]
    upsert?: sesionesUpsertWithWhereUniqueWithoutUsuariosInput | sesionesUpsertWithWhereUniqueWithoutUsuariosInput[]
    createMany?: sesionesCreateManyUsuariosInputEnvelope
    set?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    disconnect?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    delete?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    connect?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    update?: sesionesUpdateWithWhereUniqueWithoutUsuariosInput | sesionesUpdateWithWhereUniqueWithoutUsuariosInput[]
    updateMany?: sesionesUpdateManyWithWhereWithoutUsuariosInput | sesionesUpdateManyWithWhereWithoutUsuariosInput[]
    deleteMany?: sesionesScalarWhereInput | sesionesScalarWhereInput[]
  }

  export type solicitudes_recuperacionUpdateManyWithoutUsuariosNestedInput = {
    create?: XOR<solicitudes_recuperacionCreateWithoutUsuariosInput, solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput> | solicitudes_recuperacionCreateWithoutUsuariosInput[] | solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput | solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput[]
    upsert?: solicitudes_recuperacionUpsertWithWhereUniqueWithoutUsuariosInput | solicitudes_recuperacionUpsertWithWhereUniqueWithoutUsuariosInput[]
    createMany?: solicitudes_recuperacionCreateManyUsuariosInputEnvelope
    set?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    disconnect?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    delete?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    connect?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    update?: solicitudes_recuperacionUpdateWithWhereUniqueWithoutUsuariosInput | solicitudes_recuperacionUpdateWithWhereUniqueWithoutUsuariosInput[]
    updateMany?: solicitudes_recuperacionUpdateManyWithWhereWithoutUsuariosInput | solicitudes_recuperacionUpdateManyWithWhereWithoutUsuariosInput[]
    deleteMany?: solicitudes_recuperacionScalarWhereInput | solicitudes_recuperacionScalarWhereInput[]
  }

  export type consentimientosUpdateOneRequiredWithoutUsuariosNestedInput = {
    create?: XOR<consentimientosCreateWithoutUsuariosInput, consentimientosUncheckedCreateWithoutUsuariosInput>
    connectOrCreate?: consentimientosCreateOrConnectWithoutUsuariosInput
    upsert?: consentimientosUpsertWithoutUsuariosInput
    connect?: consentimientosWhereUniqueInput
    update?: XOR<XOR<consentimientosUpdateToOneWithWhereWithoutUsuariosInput, consentimientosUpdateWithoutUsuariosInput>, consentimientosUncheckedUpdateWithoutUsuariosInput>
  }

  export type linea_baseUncheckedUpdateOneWithoutUsuariosNestedInput = {
    create?: XOR<linea_baseCreateWithoutUsuariosInput, linea_baseUncheckedCreateWithoutUsuariosInput>
    connectOrCreate?: linea_baseCreateOrConnectWithoutUsuariosInput
    upsert?: linea_baseUpsertWithoutUsuariosInput
    disconnect?: linea_baseWhereInput | boolean
    delete?: linea_baseWhereInput | boolean
    connect?: linea_baseWhereUniqueInput
    update?: XOR<XOR<linea_baseUpdateToOneWithWhereWithoutUsuariosInput, linea_baseUpdateWithoutUsuariosInput>, linea_baseUncheckedUpdateWithoutUsuariosInput>
  }

  export type linea_base_historialUncheckedUpdateManyWithoutUsuariosNestedInput = {
    create?: XOR<linea_base_historialCreateWithoutUsuariosInput, linea_base_historialUncheckedCreateWithoutUsuariosInput> | linea_base_historialCreateWithoutUsuariosInput[] | linea_base_historialUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: linea_base_historialCreateOrConnectWithoutUsuariosInput | linea_base_historialCreateOrConnectWithoutUsuariosInput[]
    upsert?: linea_base_historialUpsertWithWhereUniqueWithoutUsuariosInput | linea_base_historialUpsertWithWhereUniqueWithoutUsuariosInput[]
    createMany?: linea_base_historialCreateManyUsuariosInputEnvelope
    set?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    disconnect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    delete?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    connect?: linea_base_historialWhereUniqueInput | linea_base_historialWhereUniqueInput[]
    update?: linea_base_historialUpdateWithWhereUniqueWithoutUsuariosInput | linea_base_historialUpdateWithWhereUniqueWithoutUsuariosInput[]
    updateMany?: linea_base_historialUpdateManyWithWhereWithoutUsuariosInput | linea_base_historialUpdateManyWithWhereWithoutUsuariosInput[]
    deleteMany?: linea_base_historialScalarWhereInput | linea_base_historialScalarWhereInput[]
  }

  export type sesionesUncheckedUpdateManyWithoutUsuariosNestedInput = {
    create?: XOR<sesionesCreateWithoutUsuariosInput, sesionesUncheckedCreateWithoutUsuariosInput> | sesionesCreateWithoutUsuariosInput[] | sesionesUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: sesionesCreateOrConnectWithoutUsuariosInput | sesionesCreateOrConnectWithoutUsuariosInput[]
    upsert?: sesionesUpsertWithWhereUniqueWithoutUsuariosInput | sesionesUpsertWithWhereUniqueWithoutUsuariosInput[]
    createMany?: sesionesCreateManyUsuariosInputEnvelope
    set?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    disconnect?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    delete?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    connect?: sesionesWhereUniqueInput | sesionesWhereUniqueInput[]
    update?: sesionesUpdateWithWhereUniqueWithoutUsuariosInput | sesionesUpdateWithWhereUniqueWithoutUsuariosInput[]
    updateMany?: sesionesUpdateManyWithWhereWithoutUsuariosInput | sesionesUpdateManyWithWhereWithoutUsuariosInput[]
    deleteMany?: sesionesScalarWhereInput | sesionesScalarWhereInput[]
  }

  export type solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosNestedInput = {
    create?: XOR<solicitudes_recuperacionCreateWithoutUsuariosInput, solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput> | solicitudes_recuperacionCreateWithoutUsuariosInput[] | solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput[]
    connectOrCreate?: solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput | solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput[]
    upsert?: solicitudes_recuperacionUpsertWithWhereUniqueWithoutUsuariosInput | solicitudes_recuperacionUpsertWithWhereUniqueWithoutUsuariosInput[]
    createMany?: solicitudes_recuperacionCreateManyUsuariosInputEnvelope
    set?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    disconnect?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    delete?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    connect?: solicitudes_recuperacionWhereUniqueInput | solicitudes_recuperacionWhereUniqueInput[]
    update?: solicitudes_recuperacionUpdateWithWhereUniqueWithoutUsuariosInput | solicitudes_recuperacionUpdateWithWhereUniqueWithoutUsuariosInput[]
    updateMany?: solicitudes_recuperacionUpdateManyWithWhereWithoutUsuariosInput | solicitudes_recuperacionUpdateManyWithWhereWithoutUsuariosInput[]
    deleteMany?: solicitudes_recuperacionScalarWhereInput | solicitudes_recuperacionScalarWhereInput[]
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedEnumnivel_academico_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.nivel_academico_enum | Enumnivel_academico_enumFieldRefInput<$PrismaModel>
    in?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumnivel_academico_enumFilter<$PrismaModel> | $Enums.nivel_academico_enum
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnummotivo_consumo_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_consumo_enum | Enummotivo_consumo_enumFieldRefInput<$PrismaModel>
    in?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    not?: NestedEnummotivo_consumo_enumFilter<$PrismaModel> | $Enums.motivo_consumo_enum
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumnivel_academico_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.nivel_academico_enum | Enumnivel_academico_enumFieldRefInput<$PrismaModel>
    in?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.nivel_academico_enum[] | ListEnumnivel_academico_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumnivel_academico_enumWithAggregatesFilter<$PrismaModel> | $Enums.nivel_academico_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumnivel_academico_enumFilter<$PrismaModel>
    _max?: NestedEnumnivel_academico_enumFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnummotivo_consumo_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_consumo_enum | Enummotivo_consumo_enumFieldRefInput<$PrismaModel>
    in?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.motivo_consumo_enum[] | ListEnummotivo_consumo_enumFieldRefInput<$PrismaModel>
    not?: NestedEnummotivo_consumo_enumWithAggregatesFilter<$PrismaModel> | $Enums.motivo_consumo_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnummotivo_consumo_enumFilter<$PrismaModel>
    _max?: NestedEnummotivo_consumo_enumFilter<$PrismaModel>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumestado_aplicacion_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_aplicacion_enum | Enumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_aplicacion_enumFilter<$PrismaModel> | $Enums.estado_aplicacion_enum
  }

  export type NestedEnummotivo_cierre_enumNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_cierre_enum | Enummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnummotivo_cierre_enumNullableFilter<$PrismaModel> | $Enums.motivo_cierre_enum | null
  }

  export type NestedEnumestado_aplicacion_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_aplicacion_enum | Enumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_aplicacion_enum[] | ListEnumestado_aplicacion_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_aplicacion_enumWithAggregatesFilter<$PrismaModel> | $Enums.estado_aplicacion_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumestado_aplicacion_enumFilter<$PrismaModel>
    _max?: NestedEnumestado_aplicacion_enumFilter<$PrismaModel>
  }

  export type NestedEnummotivo_cierre_enumNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.motivo_cierre_enum | Enummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.motivo_cierre_enum[] | ListEnummotivo_cierre_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnummotivo_cierre_enumNullableWithAggregatesFilter<$PrismaModel> | $Enums.motivo_cierre_enum | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnummotivo_cierre_enumNullableFilter<$PrismaModel>
    _max?: NestedEnummotivo_cierre_enumNullableFilter<$PrismaModel>
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumestado_codigo_enumNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_codigo_enum | Enumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnumestado_codigo_enumNullableFilter<$PrismaModel> | $Enums.estado_codigo_enum | null
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedEnumestado_codigo_enumNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_codigo_enum | Enumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    in?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.estado_codigo_enum[] | ListEnumestado_codigo_enumFieldRefInput<$PrismaModel> | null
    not?: NestedEnumestado_codigo_enumNullableWithAggregatesFilter<$PrismaModel> | $Enums.estado_codigo_enum | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumestado_codigo_enumNullableFilter<$PrismaModel>
    _max?: NestedEnumestado_codigo_enumNullableFilter<$PrismaModel>
  }

  export type NestedEnumrol_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.rol_enum | Enumrol_enumFieldRefInput<$PrismaModel>
    in?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumrol_enumFilter<$PrismaModel> | $Enums.rol_enum
  }

  export type NestedEnumestado_registro_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_registro_enum | Enumestado_registro_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_registro_enumFilter<$PrismaModel> | $Enums.estado_registro_enum
  }

  export type NestedEnumestado_cuenta_enumFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_cuenta_enum | Enumestado_cuenta_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_cuenta_enumFilter<$PrismaModel> | $Enums.estado_cuenta_enum
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedEnumrol_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.rol_enum | Enumrol_enumFieldRefInput<$PrismaModel>
    in?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.rol_enum[] | ListEnumrol_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumrol_enumWithAggregatesFilter<$PrismaModel> | $Enums.rol_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumrol_enumFilter<$PrismaModel>
    _max?: NestedEnumrol_enumFilter<$PrismaModel>
  }

  export type NestedEnumestado_registro_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_registro_enum | Enumestado_registro_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_registro_enum[] | ListEnumestado_registro_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_registro_enumWithAggregatesFilter<$PrismaModel> | $Enums.estado_registro_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumestado_registro_enumFilter<$PrismaModel>
    _max?: NestedEnumestado_registro_enumFilter<$PrismaModel>
  }

  export type NestedEnumestado_cuenta_enumWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.estado_cuenta_enum | Enumestado_cuenta_enumFieldRefInput<$PrismaModel>
    in?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    notIn?: $Enums.estado_cuenta_enum[] | ListEnumestado_cuenta_enumFieldRefInput<$PrismaModel>
    not?: NestedEnumestado_cuenta_enumWithAggregatesFilter<$PrismaModel> | $Enums.estado_cuenta_enum
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumestado_cuenta_enumFilter<$PrismaModel>
    _max?: NestedEnumestado_cuenta_enumFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type usuariosCreateWithoutConsentimientosInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    linea_base?: linea_baseCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionCreateNestedManyWithoutUsuariosInput
  }

  export type usuariosUncheckedCreateWithoutConsentimientosInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    linea_base?: linea_baseUncheckedCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialUncheckedCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesUncheckedCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedCreateNestedManyWithoutUsuariosInput
  }

  export type usuariosCreateOrConnectWithoutConsentimientosInput = {
    where: usuariosWhereUniqueInput
    create: XOR<usuariosCreateWithoutConsentimientosInput, usuariosUncheckedCreateWithoutConsentimientosInput>
  }

  export type usuariosCreateManyConsentimientosInputEnvelope = {
    data: usuariosCreateManyConsentimientosInput | usuariosCreateManyConsentimientosInput[]
    skipDuplicates?: boolean
  }

  export type usuariosUpsertWithWhereUniqueWithoutConsentimientosInput = {
    where: usuariosWhereUniqueInput
    update: XOR<usuariosUpdateWithoutConsentimientosInput, usuariosUncheckedUpdateWithoutConsentimientosInput>
    create: XOR<usuariosCreateWithoutConsentimientosInput, usuariosUncheckedCreateWithoutConsentimientosInput>
  }

  export type usuariosUpdateWithWhereUniqueWithoutConsentimientosInput = {
    where: usuariosWhereUniqueInput
    data: XOR<usuariosUpdateWithoutConsentimientosInput, usuariosUncheckedUpdateWithoutConsentimientosInput>
  }

  export type usuariosUpdateManyWithWhereWithoutConsentimientosInput = {
    where: usuariosScalarWhereInput
    data: XOR<usuariosUpdateManyMutationInput, usuariosUncheckedUpdateManyWithoutConsentimientosInput>
  }

  export type usuariosScalarWhereInput = {
    AND?: usuariosScalarWhereInput | usuariosScalarWhereInput[]
    OR?: usuariosScalarWhereInput[]
    NOT?: usuariosScalarWhereInput | usuariosScalarWhereInput[]
    id_usuario?: UuidFilter<"usuarios"> | string
    correo_electronico?: StringFilter<"usuarios"> | string
    contrasena_hash?: StringFilter<"usuarios"> | string
    rol?: Enumrol_enumFilter<"usuarios"> | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFilter<"usuarios"> | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFilter<"usuarios"> | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFilter<"usuarios"> | Date | string
    fecha_actualizacion?: DateTimeFilter<"usuarios"> | Date | string
    consentimiendo_aceptado?: BoolNullableFilter<"usuarios"> | boolean | null
    registro_consumo_aceptado?: BoolNullableFilter<"usuarios"> | boolean | null
    id_consentimiento?: UuidFilter<"usuarios"> | string
  }

  export type usuariosCreateWithoutLinea_baseInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    linea_base_historial?: linea_base_historialCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionCreateNestedManyWithoutUsuariosInput
    consentimientos: consentimientosCreateNestedOneWithoutUsuariosInput
  }

  export type usuariosUncheckedCreateWithoutLinea_baseInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    id_consentimiento: string
    linea_base_historial?: linea_base_historialUncheckedCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesUncheckedCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedCreateNestedManyWithoutUsuariosInput
  }

  export type usuariosCreateOrConnectWithoutLinea_baseInput = {
    where: usuariosWhereUniqueInput
    create: XOR<usuariosCreateWithoutLinea_baseInput, usuariosUncheckedCreateWithoutLinea_baseInput>
  }

  export type linea_base_historialCreateWithoutLinea_baseInput = {
    id_historial?: bigint | number
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
    usuarios: usuariosCreateNestedOneWithoutLinea_base_historialInput
  }

  export type linea_base_historialUncheckedCreateWithoutLinea_baseInput = {
    id_historial?: bigint | number
    id_usuario: string
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
  }

  export type linea_base_historialCreateOrConnectWithoutLinea_baseInput = {
    where: linea_base_historialWhereUniqueInput
    create: XOR<linea_base_historialCreateWithoutLinea_baseInput, linea_base_historialUncheckedCreateWithoutLinea_baseInput>
  }

  export type linea_base_historialCreateManyLinea_baseInputEnvelope = {
    data: linea_base_historialCreateManyLinea_baseInput | linea_base_historialCreateManyLinea_baseInput[]
    skipDuplicates?: boolean
  }

  export type usuariosUpsertWithoutLinea_baseInput = {
    update: XOR<usuariosUpdateWithoutLinea_baseInput, usuariosUncheckedUpdateWithoutLinea_baseInput>
    create: XOR<usuariosCreateWithoutLinea_baseInput, usuariosUncheckedCreateWithoutLinea_baseInput>
    where?: usuariosWhereInput
  }

  export type usuariosUpdateToOneWithWhereWithoutLinea_baseInput = {
    where?: usuariosWhereInput
    data: XOR<usuariosUpdateWithoutLinea_baseInput, usuariosUncheckedUpdateWithoutLinea_baseInput>
  }

  export type usuariosUpdateWithoutLinea_baseInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    linea_base_historial?: linea_base_historialUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUpdateManyWithoutUsuariosNestedInput
    consentimientos?: consentimientosUpdateOneRequiredWithoutUsuariosNestedInput
  }

  export type usuariosUncheckedUpdateWithoutLinea_baseInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    linea_base_historial?: linea_base_historialUncheckedUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUncheckedUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosNestedInput
  }

  export type linea_base_historialUpsertWithWhereUniqueWithoutLinea_baseInput = {
    where: linea_base_historialWhereUniqueInput
    update: XOR<linea_base_historialUpdateWithoutLinea_baseInput, linea_base_historialUncheckedUpdateWithoutLinea_baseInput>
    create: XOR<linea_base_historialCreateWithoutLinea_baseInput, linea_base_historialUncheckedCreateWithoutLinea_baseInput>
  }

  export type linea_base_historialUpdateWithWhereUniqueWithoutLinea_baseInput = {
    where: linea_base_historialWhereUniqueInput
    data: XOR<linea_base_historialUpdateWithoutLinea_baseInput, linea_base_historialUncheckedUpdateWithoutLinea_baseInput>
  }

  export type linea_base_historialUpdateManyWithWhereWithoutLinea_baseInput = {
    where: linea_base_historialScalarWhereInput
    data: XOR<linea_base_historialUpdateManyMutationInput, linea_base_historialUncheckedUpdateManyWithoutLinea_baseInput>
  }

  export type linea_base_historialScalarWhereInput = {
    AND?: linea_base_historialScalarWhereInput | linea_base_historialScalarWhereInput[]
    OR?: linea_base_historialScalarWhereInput[]
    NOT?: linea_base_historialScalarWhereInput | linea_base_historialScalarWhereInput[]
    id_historial?: BigIntFilter<"linea_base_historial"> | bigint | number
    id_linea_base?: UuidFilter<"linea_base_historial"> | string
    id_usuario?: UuidFilter<"linea_base_historial"> | string
    campos_modificados?: StringNullableListFilter<"linea_base_historial">
    datos_anteriores?: JsonFilter<"linea_base_historial">
    fecha_modificacion?: DateTimeFilter<"linea_base_historial"> | Date | string
  }

  export type linea_baseCreateWithoutLinea_base_historialInput = {
    id_linea_base?: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date | string
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date | string
    frecuencia_consumo: number
    fecha_creacion?: Date | string
    fecha_actualizacion?: Date | string
    fecha_nacimiento?: Date | string | null
    usuarios: usuariosCreateNestedOneWithoutLinea_baseInput
  }

  export type linea_baseUncheckedCreateWithoutLinea_base_historialInput = {
    id_linea_base?: string
    id_usuario: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date | string
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date | string
    frecuencia_consumo: number
    fecha_creacion?: Date | string
    fecha_actualizacion?: Date | string
    fecha_nacimiento?: Date | string | null
  }

  export type linea_baseCreateOrConnectWithoutLinea_base_historialInput = {
    where: linea_baseWhereUniqueInput
    create: XOR<linea_baseCreateWithoutLinea_base_historialInput, linea_baseUncheckedCreateWithoutLinea_base_historialInput>
  }

  export type usuariosCreateWithoutLinea_base_historialInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    linea_base?: linea_baseCreateNestedOneWithoutUsuariosInput
    sesiones?: sesionesCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionCreateNestedManyWithoutUsuariosInput
    consentimientos: consentimientosCreateNestedOneWithoutUsuariosInput
  }

  export type usuariosUncheckedCreateWithoutLinea_base_historialInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    id_consentimiento: string
    linea_base?: linea_baseUncheckedCreateNestedOneWithoutUsuariosInput
    sesiones?: sesionesUncheckedCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedCreateNestedManyWithoutUsuariosInput
  }

  export type usuariosCreateOrConnectWithoutLinea_base_historialInput = {
    where: usuariosWhereUniqueInput
    create: XOR<usuariosCreateWithoutLinea_base_historialInput, usuariosUncheckedCreateWithoutLinea_base_historialInput>
  }

  export type linea_baseUpsertWithoutLinea_base_historialInput = {
    update: XOR<linea_baseUpdateWithoutLinea_base_historialInput, linea_baseUncheckedUpdateWithoutLinea_base_historialInput>
    create: XOR<linea_baseCreateWithoutLinea_base_historialInput, linea_baseUncheckedCreateWithoutLinea_base_historialInput>
    where?: linea_baseWhereInput
  }

  export type linea_baseUpdateToOneWithWhereWithoutLinea_base_historialInput = {
    where?: linea_baseWhereInput
    data: XOR<linea_baseUpdateWithoutLinea_base_historialInput, linea_baseUncheckedUpdateWithoutLinea_base_historialInput>
  }

  export type linea_baseUpdateWithoutLinea_base_historialInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    usuarios?: usuariosUpdateOneRequiredWithoutLinea_baseNestedInput
  }

  export type linea_baseUncheckedUpdateWithoutLinea_base_historialInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    id_usuario?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type usuariosUpsertWithoutLinea_base_historialInput = {
    update: XOR<usuariosUpdateWithoutLinea_base_historialInput, usuariosUncheckedUpdateWithoutLinea_base_historialInput>
    create: XOR<usuariosCreateWithoutLinea_base_historialInput, usuariosUncheckedCreateWithoutLinea_base_historialInput>
    where?: usuariosWhereInput
  }

  export type usuariosUpdateToOneWithWhereWithoutLinea_base_historialInput = {
    where?: usuariosWhereInput
    data: XOR<usuariosUpdateWithoutLinea_base_historialInput, usuariosUncheckedUpdateWithoutLinea_base_historialInput>
  }

  export type usuariosUpdateWithoutLinea_base_historialInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    linea_base?: linea_baseUpdateOneWithoutUsuariosNestedInput
    sesiones?: sesionesUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUpdateManyWithoutUsuariosNestedInput
    consentimientos?: consentimientosUpdateOneRequiredWithoutUsuariosNestedInput
  }

  export type usuariosUncheckedUpdateWithoutLinea_base_historialInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    linea_base?: linea_baseUncheckedUpdateOneWithoutUsuariosNestedInput
    sesiones?: sesionesUncheckedUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosNestedInput
  }

  export type usuariosCreateWithoutSesionesInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    linea_base?: linea_baseCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionCreateNestedManyWithoutUsuariosInput
    consentimientos: consentimientosCreateNestedOneWithoutUsuariosInput
  }

  export type usuariosUncheckedCreateWithoutSesionesInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    id_consentimiento: string
    linea_base?: linea_baseUncheckedCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialUncheckedCreateNestedManyWithoutUsuariosInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedCreateNestedManyWithoutUsuariosInput
  }

  export type usuariosCreateOrConnectWithoutSesionesInput = {
    where: usuariosWhereUniqueInput
    create: XOR<usuariosCreateWithoutSesionesInput, usuariosUncheckedCreateWithoutSesionesInput>
  }

  export type usuariosUpsertWithoutSesionesInput = {
    update: XOR<usuariosUpdateWithoutSesionesInput, usuariosUncheckedUpdateWithoutSesionesInput>
    create: XOR<usuariosCreateWithoutSesionesInput, usuariosUncheckedCreateWithoutSesionesInput>
    where?: usuariosWhereInput
  }

  export type usuariosUpdateToOneWithWhereWithoutSesionesInput = {
    where?: usuariosWhereInput
    data: XOR<usuariosUpdateWithoutSesionesInput, usuariosUncheckedUpdateWithoutSesionesInput>
  }

  export type usuariosUpdateWithoutSesionesInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    linea_base?: linea_baseUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUpdateManyWithoutUsuariosNestedInput
    consentimientos?: consentimientosUpdateOneRequiredWithoutUsuariosNestedInput
  }

  export type usuariosUncheckedUpdateWithoutSesionesInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    linea_base?: linea_baseUncheckedUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUncheckedUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosNestedInput
  }

  export type usuariosCreateWithoutSolicitudes_recuperacionInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    linea_base?: linea_baseCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesCreateNestedManyWithoutUsuariosInput
    consentimientos: consentimientosCreateNestedOneWithoutUsuariosInput
  }

  export type usuariosUncheckedCreateWithoutSolicitudes_recuperacionInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
    id_consentimiento: string
    linea_base?: linea_baseUncheckedCreateNestedOneWithoutUsuariosInput
    linea_base_historial?: linea_base_historialUncheckedCreateNestedManyWithoutUsuariosInput
    sesiones?: sesionesUncheckedCreateNestedManyWithoutUsuariosInput
  }

  export type usuariosCreateOrConnectWithoutSolicitudes_recuperacionInput = {
    where: usuariosWhereUniqueInput
    create: XOR<usuariosCreateWithoutSolicitudes_recuperacionInput, usuariosUncheckedCreateWithoutSolicitudes_recuperacionInput>
  }

  export type usuariosUpsertWithoutSolicitudes_recuperacionInput = {
    update: XOR<usuariosUpdateWithoutSolicitudes_recuperacionInput, usuariosUncheckedUpdateWithoutSolicitudes_recuperacionInput>
    create: XOR<usuariosCreateWithoutSolicitudes_recuperacionInput, usuariosUncheckedCreateWithoutSolicitudes_recuperacionInput>
    where?: usuariosWhereInput
  }

  export type usuariosUpdateToOneWithWhereWithoutSolicitudes_recuperacionInput = {
    where?: usuariosWhereInput
    data: XOR<usuariosUpdateWithoutSolicitudes_recuperacionInput, usuariosUncheckedUpdateWithoutSolicitudes_recuperacionInput>
  }

  export type usuariosUpdateWithoutSolicitudes_recuperacionInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    linea_base?: linea_baseUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUpdateManyWithoutUsuariosNestedInput
    consentimientos?: consentimientosUpdateOneRequiredWithoutUsuariosNestedInput
  }

  export type usuariosUncheckedUpdateWithoutSolicitudes_recuperacionInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    linea_base?: linea_baseUncheckedUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUncheckedUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUncheckedUpdateManyWithoutUsuariosNestedInput
  }

  export type linea_baseCreateWithoutUsuariosInput = {
    id_linea_base?: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date | string
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date | string
    frecuencia_consumo: number
    fecha_creacion?: Date | string
    fecha_actualizacion?: Date | string
    fecha_nacimiento?: Date | string | null
    linea_base_historial?: linea_base_historialCreateNestedManyWithoutLinea_baseInput
  }

  export type linea_baseUncheckedCreateWithoutUsuariosInput = {
    id_linea_base?: string
    entidad_educativa: string
    programa_academico: string
    semestre_cursado: number
    nivel_academico: $Enums.nivel_academico_enum
    ciudad: string
    fecha_inicio_consumo: Date | string
    motivo_inicio_consumo: $Enums.motivo_consumo_enum
    fecha_ultimo_consumo: Date | string
    frecuencia_consumo: number
    fecha_creacion?: Date | string
    fecha_actualizacion?: Date | string
    fecha_nacimiento?: Date | string | null
    linea_base_historial?: linea_base_historialUncheckedCreateNestedManyWithoutLinea_baseInput
  }

  export type linea_baseCreateOrConnectWithoutUsuariosInput = {
    where: linea_baseWhereUniqueInput
    create: XOR<linea_baseCreateWithoutUsuariosInput, linea_baseUncheckedCreateWithoutUsuariosInput>
  }

  export type linea_base_historialCreateWithoutUsuariosInput = {
    id_historial?: bigint | number
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
    linea_base: linea_baseCreateNestedOneWithoutLinea_base_historialInput
  }

  export type linea_base_historialUncheckedCreateWithoutUsuariosInput = {
    id_historial?: bigint | number
    id_linea_base: string
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
  }

  export type linea_base_historialCreateOrConnectWithoutUsuariosInput = {
    where: linea_base_historialWhereUniqueInput
    create: XOR<linea_base_historialCreateWithoutUsuariosInput, linea_base_historialUncheckedCreateWithoutUsuariosInput>
  }

  export type linea_base_historialCreateManyUsuariosInputEnvelope = {
    data: linea_base_historialCreateManyUsuariosInput | linea_base_historialCreateManyUsuariosInput[]
    skipDuplicates?: boolean
  }

  export type sesionesCreateWithoutUsuariosInput = {
    id_sesion?: string
    fecha_inicio_sesion?: Date | string
    fecha_ultima_interaccion?: Date | string
    limite_inactividad_minutos?: number
    estado_aplicacion?: $Enums.estado_aplicacion_enum
    activa?: boolean
    fecha_cierre_sesion?: Date | string | null
    motivo_cierre?: $Enums.motivo_cierre_enum | null
  }

  export type sesionesUncheckedCreateWithoutUsuariosInput = {
    id_sesion?: string
    fecha_inicio_sesion?: Date | string
    fecha_ultima_interaccion?: Date | string
    limite_inactividad_minutos?: number
    estado_aplicacion?: $Enums.estado_aplicacion_enum
    activa?: boolean
    fecha_cierre_sesion?: Date | string | null
    motivo_cierre?: $Enums.motivo_cierre_enum | null
  }

  export type sesionesCreateOrConnectWithoutUsuariosInput = {
    where: sesionesWhereUniqueInput
    create: XOR<sesionesCreateWithoutUsuariosInput, sesionesUncheckedCreateWithoutUsuariosInput>
  }

  export type sesionesCreateManyUsuariosInputEnvelope = {
    data: sesionesCreateManyUsuariosInput | sesionesCreateManyUsuariosInput[]
    skipDuplicates?: boolean
  }

  export type solicitudes_recuperacionCreateWithoutUsuariosInput = {
    id_solicitud?: string
    correo_electronico: string
    direccion_ip: string
    codigo_hash?: string | null
    fecha_solicitud?: Date | string
    fecha_expiracion?: Date | string | null
    estado_codigo?: $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput = {
    id_solicitud?: string
    correo_electronico: string
    direccion_ip: string
    codigo_hash?: string | null
    fecha_solicitud?: Date | string
    fecha_expiracion?: Date | string | null
    estado_codigo?: $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionCreateOrConnectWithoutUsuariosInput = {
    where: solicitudes_recuperacionWhereUniqueInput
    create: XOR<solicitudes_recuperacionCreateWithoutUsuariosInput, solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput>
  }

  export type solicitudes_recuperacionCreateManyUsuariosInputEnvelope = {
    data: solicitudes_recuperacionCreateManyUsuariosInput | solicitudes_recuperacionCreateManyUsuariosInput[]
    skipDuplicates?: boolean
  }

  export type consentimientosCreateWithoutUsuariosInput = {
    id_consentimiento?: string
    version_consentimiento: string
    vigente?: boolean
    fecha_invalidacion?: Date | string | null
    motivo_invalidacion?: string | null
    url_contenido: string
    titulo: string
  }

  export type consentimientosUncheckedCreateWithoutUsuariosInput = {
    id_consentimiento?: string
    version_consentimiento: string
    vigente?: boolean
    fecha_invalidacion?: Date | string | null
    motivo_invalidacion?: string | null
    url_contenido: string
    titulo: string
  }

  export type consentimientosCreateOrConnectWithoutUsuariosInput = {
    where: consentimientosWhereUniqueInput
    create: XOR<consentimientosCreateWithoutUsuariosInput, consentimientosUncheckedCreateWithoutUsuariosInput>
  }

  export type linea_baseUpsertWithoutUsuariosInput = {
    update: XOR<linea_baseUpdateWithoutUsuariosInput, linea_baseUncheckedUpdateWithoutUsuariosInput>
    create: XOR<linea_baseCreateWithoutUsuariosInput, linea_baseUncheckedCreateWithoutUsuariosInput>
    where?: linea_baseWhereInput
  }

  export type linea_baseUpdateToOneWithWhereWithoutUsuariosInput = {
    where?: linea_baseWhereInput
    data: XOR<linea_baseUpdateWithoutUsuariosInput, linea_baseUncheckedUpdateWithoutUsuariosInput>
  }

  export type linea_baseUpdateWithoutUsuariosInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    linea_base_historial?: linea_base_historialUpdateManyWithoutLinea_baseNestedInput
  }

  export type linea_baseUncheckedUpdateWithoutUsuariosInput = {
    id_linea_base?: StringFieldUpdateOperationsInput | string
    entidad_educativa?: StringFieldUpdateOperationsInput | string
    programa_academico?: StringFieldUpdateOperationsInput | string
    semestre_cursado?: IntFieldUpdateOperationsInput | number
    nivel_academico?: Enumnivel_academico_enumFieldUpdateOperationsInput | $Enums.nivel_academico_enum
    ciudad?: StringFieldUpdateOperationsInput | string
    fecha_inicio_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    motivo_inicio_consumo?: Enummotivo_consumo_enumFieldUpdateOperationsInput | $Enums.motivo_consumo_enum
    fecha_ultimo_consumo?: DateTimeFieldUpdateOperationsInput | Date | string
    frecuencia_consumo?: IntFieldUpdateOperationsInput | number
    fecha_creacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_nacimiento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    linea_base_historial?: linea_base_historialUncheckedUpdateManyWithoutLinea_baseNestedInput
  }

  export type linea_base_historialUpsertWithWhereUniqueWithoutUsuariosInput = {
    where: linea_base_historialWhereUniqueInput
    update: XOR<linea_base_historialUpdateWithoutUsuariosInput, linea_base_historialUncheckedUpdateWithoutUsuariosInput>
    create: XOR<linea_base_historialCreateWithoutUsuariosInput, linea_base_historialUncheckedCreateWithoutUsuariosInput>
  }

  export type linea_base_historialUpdateWithWhereUniqueWithoutUsuariosInput = {
    where: linea_base_historialWhereUniqueInput
    data: XOR<linea_base_historialUpdateWithoutUsuariosInput, linea_base_historialUncheckedUpdateWithoutUsuariosInput>
  }

  export type linea_base_historialUpdateManyWithWhereWithoutUsuariosInput = {
    where: linea_base_historialScalarWhereInput
    data: XOR<linea_base_historialUpdateManyMutationInput, linea_base_historialUncheckedUpdateManyWithoutUsuariosInput>
  }

  export type sesionesUpsertWithWhereUniqueWithoutUsuariosInput = {
    where: sesionesWhereUniqueInput
    update: XOR<sesionesUpdateWithoutUsuariosInput, sesionesUncheckedUpdateWithoutUsuariosInput>
    create: XOR<sesionesCreateWithoutUsuariosInput, sesionesUncheckedCreateWithoutUsuariosInput>
  }

  export type sesionesUpdateWithWhereUniqueWithoutUsuariosInput = {
    where: sesionesWhereUniqueInput
    data: XOR<sesionesUpdateWithoutUsuariosInput, sesionesUncheckedUpdateWithoutUsuariosInput>
  }

  export type sesionesUpdateManyWithWhereWithoutUsuariosInput = {
    where: sesionesScalarWhereInput
    data: XOR<sesionesUpdateManyMutationInput, sesionesUncheckedUpdateManyWithoutUsuariosInput>
  }

  export type sesionesScalarWhereInput = {
    AND?: sesionesScalarWhereInput | sesionesScalarWhereInput[]
    OR?: sesionesScalarWhereInput[]
    NOT?: sesionesScalarWhereInput | sesionesScalarWhereInput[]
    id_sesion?: UuidFilter<"sesiones"> | string
    id_usuario?: UuidFilter<"sesiones"> | string
    fecha_inicio_sesion?: DateTimeFilter<"sesiones"> | Date | string
    fecha_ultima_interaccion?: DateTimeFilter<"sesiones"> | Date | string
    limite_inactividad_minutos?: IntFilter<"sesiones"> | number
    estado_aplicacion?: Enumestado_aplicacion_enumFilter<"sesiones"> | $Enums.estado_aplicacion_enum
    activa?: BoolFilter<"sesiones"> | boolean
    fecha_cierre_sesion?: DateTimeNullableFilter<"sesiones"> | Date | string | null
    motivo_cierre?: Enummotivo_cierre_enumNullableFilter<"sesiones"> | $Enums.motivo_cierre_enum | null
  }

  export type solicitudes_recuperacionUpsertWithWhereUniqueWithoutUsuariosInput = {
    where: solicitudes_recuperacionWhereUniqueInput
    update: XOR<solicitudes_recuperacionUpdateWithoutUsuariosInput, solicitudes_recuperacionUncheckedUpdateWithoutUsuariosInput>
    create: XOR<solicitudes_recuperacionCreateWithoutUsuariosInput, solicitudes_recuperacionUncheckedCreateWithoutUsuariosInput>
  }

  export type solicitudes_recuperacionUpdateWithWhereUniqueWithoutUsuariosInput = {
    where: solicitudes_recuperacionWhereUniqueInput
    data: XOR<solicitudes_recuperacionUpdateWithoutUsuariosInput, solicitudes_recuperacionUncheckedUpdateWithoutUsuariosInput>
  }

  export type solicitudes_recuperacionUpdateManyWithWhereWithoutUsuariosInput = {
    where: solicitudes_recuperacionScalarWhereInput
    data: XOR<solicitudes_recuperacionUpdateManyMutationInput, solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosInput>
  }

  export type solicitudes_recuperacionScalarWhereInput = {
    AND?: solicitudes_recuperacionScalarWhereInput | solicitudes_recuperacionScalarWhereInput[]
    OR?: solicitudes_recuperacionScalarWhereInput[]
    NOT?: solicitudes_recuperacionScalarWhereInput | solicitudes_recuperacionScalarWhereInput[]
    id_solicitud?: UuidFilter<"solicitudes_recuperacion"> | string
    correo_electronico?: StringFilter<"solicitudes_recuperacion"> | string
    id_usuario?: UuidNullableFilter<"solicitudes_recuperacion"> | string | null
    direccion_ip?: StringFilter<"solicitudes_recuperacion"> | string
    codigo_hash?: StringNullableFilter<"solicitudes_recuperacion"> | string | null
    fecha_solicitud?: DateTimeFilter<"solicitudes_recuperacion"> | Date | string
    fecha_expiracion?: DateTimeNullableFilter<"solicitudes_recuperacion"> | Date | string | null
    estado_codigo?: Enumestado_codigo_enumNullableFilter<"solicitudes_recuperacion"> | $Enums.estado_codigo_enum | null
  }

  export type consentimientosUpsertWithoutUsuariosInput = {
    update: XOR<consentimientosUpdateWithoutUsuariosInput, consentimientosUncheckedUpdateWithoutUsuariosInput>
    create: XOR<consentimientosCreateWithoutUsuariosInput, consentimientosUncheckedCreateWithoutUsuariosInput>
    where?: consentimientosWhereInput
  }

  export type consentimientosUpdateToOneWithWhereWithoutUsuariosInput = {
    where?: consentimientosWhereInput
    data: XOR<consentimientosUpdateWithoutUsuariosInput, consentimientosUncheckedUpdateWithoutUsuariosInput>
  }

  export type consentimientosUpdateWithoutUsuariosInput = {
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    version_consentimiento?: StringFieldUpdateOperationsInput | string
    vigente?: BoolFieldUpdateOperationsInput | boolean
    fecha_invalidacion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_invalidacion?: NullableStringFieldUpdateOperationsInput | string | null
    url_contenido?: StringFieldUpdateOperationsInput | string
    titulo?: StringFieldUpdateOperationsInput | string
  }

  export type consentimientosUncheckedUpdateWithoutUsuariosInput = {
    id_consentimiento?: StringFieldUpdateOperationsInput | string
    version_consentimiento?: StringFieldUpdateOperationsInput | string
    vigente?: BoolFieldUpdateOperationsInput | boolean
    fecha_invalidacion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_invalidacion?: NullableStringFieldUpdateOperationsInput | string | null
    url_contenido?: StringFieldUpdateOperationsInput | string
    titulo?: StringFieldUpdateOperationsInput | string
  }

  export type usuariosCreateManyConsentimientosInput = {
    id_usuario?: string
    correo_electronico: string
    contrasena_hash: string
    rol?: $Enums.rol_enum
    estado_registro?: $Enums.estado_registro_enum
    estado_cuenta?: $Enums.estado_cuenta_enum
    fecha_registro?: Date | string
    fecha_actualizacion?: Date | string
    consentimiendo_aceptado?: boolean | null
    registro_consumo_aceptado?: boolean | null
  }

  export type usuariosUpdateWithoutConsentimientosInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    linea_base?: linea_baseUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUpdateManyWithoutUsuariosNestedInput
  }

  export type usuariosUncheckedUpdateWithoutConsentimientosInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    linea_base?: linea_baseUncheckedUpdateOneWithoutUsuariosNestedInput
    linea_base_historial?: linea_base_historialUncheckedUpdateManyWithoutUsuariosNestedInput
    sesiones?: sesionesUncheckedUpdateManyWithoutUsuariosNestedInput
    solicitudes_recuperacion?: solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosNestedInput
  }

  export type usuariosUncheckedUpdateManyWithoutConsentimientosInput = {
    id_usuario?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    contrasena_hash?: StringFieldUpdateOperationsInput | string
    rol?: Enumrol_enumFieldUpdateOperationsInput | $Enums.rol_enum
    estado_registro?: Enumestado_registro_enumFieldUpdateOperationsInput | $Enums.estado_registro_enum
    estado_cuenta?: Enumestado_cuenta_enumFieldUpdateOperationsInput | $Enums.estado_cuenta_enum
    fecha_registro?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_actualizacion?: DateTimeFieldUpdateOperationsInput | Date | string
    consentimiendo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
    registro_consumo_aceptado?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type linea_base_historialCreateManyLinea_baseInput = {
    id_historial?: bigint | number
    id_usuario: string
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
  }

  export type linea_base_historialUpdateWithoutLinea_baseInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
    usuarios?: usuariosUpdateOneRequiredWithoutLinea_base_historialNestedInput
  }

  export type linea_base_historialUncheckedUpdateWithoutLinea_baseInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    id_usuario?: StringFieldUpdateOperationsInput | string
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type linea_base_historialUncheckedUpdateManyWithoutLinea_baseInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    id_usuario?: StringFieldUpdateOperationsInput | string
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type linea_base_historialCreateManyUsuariosInput = {
    id_historial?: bigint | number
    id_linea_base: string
    campos_modificados?: linea_base_historialCreatecampos_modificadosInput | string[]
    datos_anteriores: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: Date | string
  }

  export type sesionesCreateManyUsuariosInput = {
    id_sesion?: string
    fecha_inicio_sesion?: Date | string
    fecha_ultima_interaccion?: Date | string
    limite_inactividad_minutos?: number
    estado_aplicacion?: $Enums.estado_aplicacion_enum
    activa?: boolean
    fecha_cierre_sesion?: Date | string | null
    motivo_cierre?: $Enums.motivo_cierre_enum | null
  }

  export type solicitudes_recuperacionCreateManyUsuariosInput = {
    id_solicitud?: string
    correo_electronico: string
    direccion_ip: string
    codigo_hash?: string | null
    fecha_solicitud?: Date | string
    fecha_expiracion?: Date | string | null
    estado_codigo?: $Enums.estado_codigo_enum | null
  }

  export type linea_base_historialUpdateWithoutUsuariosInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
    linea_base?: linea_baseUpdateOneRequiredWithoutLinea_base_historialNestedInput
  }

  export type linea_base_historialUncheckedUpdateWithoutUsuariosInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    id_linea_base?: StringFieldUpdateOperationsInput | string
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type linea_base_historialUncheckedUpdateManyWithoutUsuariosInput = {
    id_historial?: BigIntFieldUpdateOperationsInput | bigint | number
    id_linea_base?: StringFieldUpdateOperationsInput | string
    campos_modificados?: linea_base_historialUpdatecampos_modificadosInput | string[]
    datos_anteriores?: JsonNullValueInput | InputJsonValue
    fecha_modificacion?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sesionesUpdateWithoutUsuariosInput = {
    id_sesion?: StringFieldUpdateOperationsInput | string
    fecha_inicio_sesion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_ultima_interaccion?: DateTimeFieldUpdateOperationsInput | Date | string
    limite_inactividad_minutos?: IntFieldUpdateOperationsInput | number
    estado_aplicacion?: Enumestado_aplicacion_enumFieldUpdateOperationsInput | $Enums.estado_aplicacion_enum
    activa?: BoolFieldUpdateOperationsInput | boolean
    fecha_cierre_sesion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_cierre?: NullableEnummotivo_cierre_enumFieldUpdateOperationsInput | $Enums.motivo_cierre_enum | null
  }

  export type sesionesUncheckedUpdateWithoutUsuariosInput = {
    id_sesion?: StringFieldUpdateOperationsInput | string
    fecha_inicio_sesion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_ultima_interaccion?: DateTimeFieldUpdateOperationsInput | Date | string
    limite_inactividad_minutos?: IntFieldUpdateOperationsInput | number
    estado_aplicacion?: Enumestado_aplicacion_enumFieldUpdateOperationsInput | $Enums.estado_aplicacion_enum
    activa?: BoolFieldUpdateOperationsInput | boolean
    fecha_cierre_sesion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_cierre?: NullableEnummotivo_cierre_enumFieldUpdateOperationsInput | $Enums.motivo_cierre_enum | null
  }

  export type sesionesUncheckedUpdateManyWithoutUsuariosInput = {
    id_sesion?: StringFieldUpdateOperationsInput | string
    fecha_inicio_sesion?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_ultima_interaccion?: DateTimeFieldUpdateOperationsInput | Date | string
    limite_inactividad_minutos?: IntFieldUpdateOperationsInput | number
    estado_aplicacion?: Enumestado_aplicacion_enumFieldUpdateOperationsInput | $Enums.estado_aplicacion_enum
    activa?: BoolFieldUpdateOperationsInput | boolean
    fecha_cierre_sesion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    motivo_cierre?: NullableEnummotivo_cierre_enumFieldUpdateOperationsInput | $Enums.motivo_cierre_enum | null
  }

  export type solicitudes_recuperacionUpdateWithoutUsuariosInput = {
    id_solicitud?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    direccion_ip?: StringFieldUpdateOperationsInput | string
    codigo_hash?: NullableStringFieldUpdateOperationsInput | string | null
    fecha_solicitud?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_expiracion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estado_codigo?: NullableEnumestado_codigo_enumFieldUpdateOperationsInput | $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionUncheckedUpdateWithoutUsuariosInput = {
    id_solicitud?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    direccion_ip?: StringFieldUpdateOperationsInput | string
    codigo_hash?: NullableStringFieldUpdateOperationsInput | string | null
    fecha_solicitud?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_expiracion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estado_codigo?: NullableEnumestado_codigo_enumFieldUpdateOperationsInput | $Enums.estado_codigo_enum | null
  }

  export type solicitudes_recuperacionUncheckedUpdateManyWithoutUsuariosInput = {
    id_solicitud?: StringFieldUpdateOperationsInput | string
    correo_electronico?: StringFieldUpdateOperationsInput | string
    direccion_ip?: StringFieldUpdateOperationsInput | string
    codigo_hash?: NullableStringFieldUpdateOperationsInput | string | null
    fecha_solicitud?: DateTimeFieldUpdateOperationsInput | Date | string
    fecha_expiracion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estado_codigo?: NullableEnumestado_codigo_enumFieldUpdateOperationsInput | $Enums.estado_codigo_enum | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}