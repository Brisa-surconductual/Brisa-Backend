import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import {
  EstadoSesionIniciadaInterceptor,
  SinContenidoInterceptor,
} from './estado-http.interceptors';
import {
  RespuestaHttp,
  RespuestaHttpInterceptor,
} from './respuesta-http.interceptor';

describe('Interceptores de respuesta del chat', () => {
  const llamar = (valor: unknown): CallHandler => ({ handle: () => of(valor) });
  const contexto = (respuesta: { status: jest.Mock }, manejador = () => 1) =>
    ({
      getHandler: () => manejador,
      switchToHttp: () => ({ getResponse: () => respuesta }),
    }) as unknown as ExecutionContext;

  describe('RespuestaHttpInterceptor', () => {
    class Proyeccion {
      static desde(origen: { a: number; b: number }) {
        return { a: origen.a };
      }
    }
    const reflector = new Reflector();
    const interceptor = new RespuestaHttpInterceptor(reflector);

    // Aplica el decorador sobre un manejador de prueba para poblar la metadata.
    const manejadorCon = (opciones: Parameters<typeof RespuestaHttp>[0]) => {
      class Controlador {
        metodo() {
          return 1;
        }
      }
      const descriptor = Object.getOwnPropertyDescriptor(
        Controlador.prototype,
        'metodo',
      )!;
      RespuestaHttp(opciones)(Controlador.prototype, 'metodo', descriptor);
      return Controlador.prototype.metodo;
    };

    it('proyecta con el DTO y envuelve en data', async () => {
      const manejador = manejadorCon({ dto: Proyeccion, envolver: true });

      const resultado = await lastValueFrom(
        interceptor.intercept(
          contexto({ status: jest.fn() }, manejador),
          llamar({ a: 1, b: 2 }),
        ),
      );

      expect(resultado).toEqual({ data: { a: 1 } });
    });

    it('sin opciones entrega el resultado tal cual', async () => {
      const manejador = manejadorCon({});

      await expect(
        lastValueFrom(
          interceptor.intercept(
            contexto({ status: jest.fn() }, manejador),
            llamar({ a: 1 }),
          ),
        ),
      ).resolves.toEqual({ a: 1 });
    });
  });

  describe('EstadoSesionIniciadaInterceptor', () => {
    it.each([
      [true, HttpStatus.OK],
      [false, HttpStatus.CREATED],
    ])('reanudada=%s responde %s', async (reanudada, estado) => {
      const respuesta = { status: jest.fn() };

      await lastValueFrom(
        new EstadoSesionIniciadaInterceptor().intercept(
          contexto(respuesta),
          llamar({ reanudada }),
        ),
      );

      expect(respuesta.status).toHaveBeenCalledWith(estado);
    });
  });

  describe('SinContenidoInterceptor', () => {
    it('responde 204 cuando no hay resultados', async () => {
      const respuesta = { status: jest.fn() };

      await lastValueFrom(
        new SinContenidoInterceptor().intercept(
          contexto(respuesta),
          llamar([]),
        ),
      );

      expect(respuesta.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    });

    it('conserva el estado cuando hay resultados', async () => {
      const respuesta = { status: jest.fn() };

      await lastValueFrom(
        new SinContenidoInterceptor().intercept(
          contexto(respuesta),
          llamar([1]),
        ),
      );

      expect(respuesta.status).not.toHaveBeenCalled();
    });
  });
});
