package com.veterinaria.gcv.modulos.historial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record HistorialClinicoResponse(
        MascotaResumen mascota,
        PropietarioResumen propietario,
        ResumenHistorial resumen,
        List<EventoHistorial> eventos) {

    public record MascotaResumen(
            Long idMascota,
            String codigoExpediente,
            String nombre,
            String especie,
            String raza,
            String sexo,
            LocalDate fechaNacimiento,
            String edadEstimada,
            String color,
            BigDecimal pesoInicial) {
    }

    public record PropietarioResumen(
            Long idPropietario,
            String nombreCompleto,
            String telefono,
            String correo) {
    }

    public record ResumenHistorial(
            int totalConsultas,
            int totalTratamientos,
            int totalVacunas) {
    }

    public record EventoHistorial(
            String tipo,
            LocalDateTime fechaHora,
            Long idReferencia,
            String titulo,
            String veterinario,
            ConsultaDetalle consulta,
            List<TratamientoDetalle> tratamientos,
            VacunaDetalle vacuna) {
    }

    public record ConsultaDetalle(
            String motivoConsulta,
            String anamnesis,
            Double temperatura,
            Double pesoActual,
            Integer frecuenciaCardiaca,
            String examenFisico,
            String diagnostico,
            String observaciones) {
    }

    public record TratamientoDetalle(
            Long idTratamiento,
            String medicamento,
            String dosis,
            String frecuencia,
            String duracion,
            String indicaciones) {
    }

    public record VacunaDetalle(
            String nombreTipoVacuna,
            String lote,
            LocalDate fechaAplicacion,
            LocalDate proximaDosis) {
    }
}
