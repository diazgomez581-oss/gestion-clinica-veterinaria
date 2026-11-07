
package com.veterinaria.gcv.modulos.citas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    // Verifica si el veterinario tiene una cita
    // en la misma fecha y hora, excluyendo canceladas.
    boolean existsByIdVeterinarioAndFechaAndHoraAndEstadoNot(
        Long idVeterinario,
        LocalDate fecha,
        LocalTime hora,
        String estado
    );

    // Listado de citas del día, ordenadas por hora
    List<Cita> findByFechaOrderByHoraAsc(LocalDate fecha);

    // Citas con información completa
    // de mascota, propietario y veterinario.
    @Query(value = """
        SELECT
            c.id_cita AS "idCita",
            c.fecha AS "fecha",
            c.hora AS "hora",
            c.motivo AS "motivo",
            c.estado AS "estado",
            c.hora_llegada AS "horaLlegada",
            c.id_mascota AS "idMascota",
            c.id_veterinario AS "idVeterinario",
            m.nombre AS "nombreMascota",
            CONCAT(p.nombres, ' ', p.apellidos)
                AS "nombrePropietario",
            v.nombre AS "nombreVeterinario"
        FROM citas c
        JOIN mascotas m
            ON c.id_mascota = m.id_mascota
        JOIN propietarios p
            ON m.id_propietario = p.id_propietario
        LEFT JOIN veterinarios v
            ON c.id_veterinario = v.id_veterinario
        WHERE c.fecha = :fecha
        ORDER BY c.hora ASC
        """, nativeQuery = true)
    List<CitaDashboardProjection> obtenerCitasDashboard(
        @Param("fecha") LocalDate fecha
    );
}
