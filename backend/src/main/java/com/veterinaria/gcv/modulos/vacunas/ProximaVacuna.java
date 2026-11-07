package com.veterinaria.gcv.modulos.vacunas;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record ProximaVacuna(
        Long idAplicacionVacuna,
        String nombreTipoVacuna,
        LocalDate proximaDosis,
        long diasRestantes,
        String nombreMascota,
        String nombrePropietario,
        String telefonoPropietario
) {

    // Constructor usado por la consulta del repositorio; los días son negativos si el refuerzo ya venció
    public ProximaVacuna(Long idAplicacionVacuna, String nombreTipoVacuna, LocalDate proximaDosis,
                         String nombreMascota, String nombrePropietario, String telefonoPropietario) {
        this(idAplicacionVacuna, nombreTipoVacuna, proximaDosis,
             ChronoUnit.DAYS.between(LocalDate.now(), proximaDosis),
             nombreMascota, nombrePropietario, telefonoPropietario);
    }
}
