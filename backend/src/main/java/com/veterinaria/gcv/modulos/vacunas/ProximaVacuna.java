package com.veterinaria.gcv.modulos.vacunas;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

public record ProximaVacuna(
        Long idAplicacionVacuna,
        String nombreTipoVacuna,
        LocalDate proximaDosis,
        long diasRestantes,
        String nombreMascota,
        String nombrePropietario,
        String telefonoPropietario,
        Long idMascota,
        Long idPropietario,
        Long idCitaAgendada
) {

    public ProximaVacuna(
            Long idAplicacionVacuna,
            String nombreTipoVacuna,
            LocalDate proximaDosis,
            String nombreMascota,
            String nombrePropietario,
            String telefonoPropietario,
            Long idMascota,
            Long idPropietario,
            Long idCitaAgendada) {

        this(
                idAplicacionVacuna,
                nombreTipoVacuna,
                proximaDosis,
                ChronoUnit.DAYS.between(
                        LocalDate.now(ZoneId.of("America/El_Salvador")),
                        proximaDosis),
                nombreMascota,
                nombrePropietario,
                telefonoPropietario,
                idMascota,
                idPropietario,
                idCitaAgendada
        );
    }

    public ProximaVacuna(
            Long idAplicacionVacuna,
            String nombreTipoVacuna,
            LocalDate proximaDosis,
            String nombreMascota,
            String nombrePropietario,
            String telefonoPropietario) {

        this(
                idAplicacionVacuna,
                nombreTipoVacuna,
                proximaDosis,
                nombreMascota,
                nombrePropietario,
                telefonoPropietario,
                null,
                null,
                null
        );
    }
}