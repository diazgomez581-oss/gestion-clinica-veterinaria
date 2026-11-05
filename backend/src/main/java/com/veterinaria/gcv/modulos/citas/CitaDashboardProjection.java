
package com.veterinaria.gcv.modulos.citas;

import java.time.LocalDate;
import java.time.LocalTime;

public interface CitaDashboardProjection {

    Long getIdCita();
    LocalDate getFecha();
    LocalTime getHora();
    String getMotivo();
    String getEstado();
    LocalTime getHoraLlegada();

    Long getIdMascota();
    Long getIdVeterinario();

    String getNombreMascota();
    String getNombrePropietario();
    String getNombreVeterinario();
}
