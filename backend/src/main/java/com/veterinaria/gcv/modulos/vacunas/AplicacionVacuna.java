package com.veterinaria.gcv.modulos.vacunas;

import com.veterinaria.gcv.modulos.citas.Veterinario;
import com.veterinaria.gcv.modulos.mascotas.Mascota;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Entity
@Table(name = "aplicaciones_vacuna")
public class AplicacionVacuna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_aplicacion_vacuna")
    private Long idAplicacionVacuna;

    @NotBlank(message = "El nombre o tipo de vacuna es obligatorio.")
    @Size(max = 100, message = "El nombre o tipo de vacuna no puede exceder 100 caracteres.")
    @Column(name = "nombre_tipo_vacuna", nullable = false, length = 100)
    private String nombreTipoVacuna;

    @NotBlank(message = "El lote es obligatorio.")
    @Size(max = 50, message = "El lote no puede exceder 50 caracteres.")
    @Column(name = "lote", nullable = false, length = 50)
    private String lote;

    @NotNull(message = "La fecha de aplicación es obligatoria.")
    @PastOrPresent(message = "La fecha de aplicación no puede ser futura.")
    @Column(name = "fecha_aplicacion", nullable = false)
    private LocalDate fechaAplicacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_mascota", nullable = false)
    @JsonIgnore
    private Mascota mascota;

    @NotNull(message = "El veterinario es obligatorio.")
    @ManyToOne
    @JoinColumn(name = "id_veterinario", nullable = false)
    private Veterinario veterinario;

    public AplicacionVacuna() {}

    // Getters y Setters (sin setter de id: el JSON no puede sobrescribir registros existentes)
    public Long getIdAplicacionVacuna() { return idAplicacionVacuna; }

    public String getNombreTipoVacuna() { return nombreTipoVacuna; }
    public void setNombreTipoVacuna(String nombreTipoVacuna) { this.nombreTipoVacuna = nombreTipoVacuna; }

    public String getLote() { return lote; }
    public void setLote(String lote) { this.lote = lote; }

    public LocalDate getFechaAplicacion() { return fechaAplicacion; }
    public void setFechaAplicacion(LocalDate fechaAplicacion) { this.fechaAplicacion = fechaAplicacion; }

    public void setMascota(Mascota mascota) { this.mascota = mascota; }

    public Veterinario getVeterinario() { return veterinario; }
    public void setVeterinario(Veterinario veterinario) { this.veterinario = veterinario; }
}
