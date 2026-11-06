package com.veterinaria.gcv.modulos.tratamientos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TratamientoRepository extends JpaRepository<Tratamiento, Long> {
    List<Tratamiento> findByIdConsultaOrderByIdTratamientoAsc(Long idConsulta);
}
