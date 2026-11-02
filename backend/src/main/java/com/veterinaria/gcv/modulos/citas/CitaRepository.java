package com.veterinaria.gcv.modulos.citas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    // RN-02: Comprueba traslape para un mismo veterinario, fecha y hora (omitiendo citas canceladas)
    boolean existsByIdVeterinarioAndFechaAndHoraAndEstadoNot(
        Long idVeterinario,
        LocalDate fecha,
        LocalTime hora,
        String estado
    );

        // Listado de citas de un día ordenadas cronológicamente
        List<Cita> findByFechaOrderByHoraAsc(LocalDate fecha);
        @Query(value = """
        SELECT
            c.id_cita AS idCita,
            c.fecha AS fecha,
            c.hora AS hora,
            c.motivo AS motivo,
            c.estado AS estado,
            c.hora_llegada AS horaLlegada,
            c.id_mascota AS idMascota,
            c.id_veterinario AS idVeterinario,
            m.nombre AS nombreMascota,
            p.nombres || ' ' || p.apellidos AS nombrePropietario
        FROM citas c
        JOIN mascotas m ON c.id_mascota = m.id_mascota
        JOIN propietarios p ON m.id_propietario = p.id_propietario
        WHERE c.fecha = :fecha
        ORDER BY c.hora ASC
        """, nativeQuery = true)
    List<CitaDashboardProjection> obtenerCitasDashboard(
        @Param("fecha") LocalDate fecha
    );
}