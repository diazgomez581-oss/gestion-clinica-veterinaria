package com.veterinaria.gcv.modulos.mascotas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MascotaRepository extends JpaRepository<Mascota, Long> {
    // Buscar todas las mascotas vinculadas a un propietario específico
    List<Mascota> findByPropietarioId(Long propietarioId);
}