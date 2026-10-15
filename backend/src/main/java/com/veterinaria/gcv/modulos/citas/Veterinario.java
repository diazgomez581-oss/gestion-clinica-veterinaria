package com.veterinaria.gcv.modulos.citas;

import jakarta.persistence.*;

@Entity
@Table(name = "veterinarios")
public class Veterinario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_veterinario")
    private Long idVeterinario;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    public Veterinario() {}

    public Veterinario(Long idVeterinario, String nombre) {
        this.idVeterinario = idVeterinario;
        this.nombre = nombre;
    }

    public Long getIdVeterinario() {
        return idVeterinario;
    }

    public void setIdVeterinario(Long idVeterinario) {
        this.idVeterinario = idVeterinario;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}