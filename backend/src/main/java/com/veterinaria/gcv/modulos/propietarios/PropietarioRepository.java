package com.veterinaria.gcv.modulos.propietarios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PropietarioRepository extends JpaRepository<Propietario, Long> {

    boolean existsByDui(String dui);

    Optional<Propietario> findByDui(String dui);
}