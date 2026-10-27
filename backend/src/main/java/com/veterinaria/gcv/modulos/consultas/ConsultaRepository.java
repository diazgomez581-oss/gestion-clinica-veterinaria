package com.veterinaria.gcv.modulos.consultas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    boolean existsByIdCita(Long idCita);

    Optional<Consulta> findByIdCita(Long idCita);

    List<Consulta> findByIdMascotaOrderByFechaHoraDesc(Long idMascota);
}
