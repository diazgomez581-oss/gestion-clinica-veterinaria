package com.veterinaria.gcv.modulos.vacunas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AplicacionVacunaRepository extends JpaRepository<AplicacionVacuna, Long> {

    // Cartilla de vacunación: aplicaciones de una mascota, de la más reciente a la más antigua
    List<AplicacionVacuna> findByMascotaIdMascotaOrderByFechaAplicacionDesc(Long idMascota);
}
