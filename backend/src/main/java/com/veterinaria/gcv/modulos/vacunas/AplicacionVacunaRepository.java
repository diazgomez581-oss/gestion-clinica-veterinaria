package com.veterinaria.gcv.modulos.vacunas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AplicacionVacunaRepository extends JpaRepository<AplicacionVacuna, Long> {

    // Cartilla de vacunación: aplicaciones de una mascota, de la más reciente a la más antigua
    List<AplicacionVacuna> findByMascotaIdMascotaOrderByFechaAplicacionDesc(Long idMascota);

    // Refuerzos sin aplicar hasta la fecha indicada, incluidos los vencidos (quedan primeros al ordenar por fecha).
    // Un refuerzo está aplicado si la mascota recibió la misma vacuna en una fecha posterior.
    @Query("""
        SELECT new com.veterinaria.gcv.modulos.vacunas.ProximaVacuna(
            a.idAplicacionVacuna, a.nombreTipoVacuna, a.proximaDosis,
            m.nombre, CONCAT(p.nombres, ' ', p.apellidos), p.telefono)
        FROM AplicacionVacuna a
        JOIN a.mascota m
        JOIN m.propietario p
        WHERE a.proximaDosis <= :hasta
          AND NOT EXISTS (
              SELECT 1 FROM AplicacionVacuna refuerzo
              WHERE refuerzo.mascota = a.mascota
                AND LOWER(TRIM(refuerzo.nombreTipoVacuna)) = LOWER(TRIM(a.nombreTipoVacuna))
                AND refuerzo.fechaAplicacion > a.fechaAplicacion)
        ORDER BY a.proximaDosis
        """)
    List<ProximaVacuna> listarProximas(@Param("hasta") LocalDate hasta);
}
