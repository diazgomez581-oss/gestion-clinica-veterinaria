package com.veterinaria.gcv.modulos.citas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

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
}