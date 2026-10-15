package com.veterinaria.gcv.modulos.citas;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "citas")
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Long idCita;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Column(name = "motivo", nullable = false, length = 255)
    private String motivo;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "Programada";

    @Column(name = "hora_llegada")
    private LocalTime horaLlegada;

    @Column(name = "id_mascota", nullable = false)
    private Long idMascota;

    @Column(name = "id_veterinario", nullable = false)
    private Long idVeterinario;

    public Cita() {
    }

    public Cita(LocalDate fecha, LocalTime hora, String motivo, Long idMascota, Long idVeterinario) {
        this.fecha = fecha;
        this.hora = hora;
        this.motivo = motivo;
        this.idMascota = idMascota;
        this.idVeterinario = idVeterinario;
        this.estado = "Programada";
    }

    // Getters y Setters
    public Long getIdCita() {
        return idCita;
    }

    public void setIdCita(Long idCita) {
        this.idCita = idCita;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalTime getHora() {
        return hora;
    }

    public void setHora(LocalTime hora) {
        this.hora = hora;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalTime getHoraLlegada() {
        return horaLlegada;
    }

    public void setHoraLlegada(LocalTime horaLlegada) {
        this.horaLlegada = horaLlegada;
    }

    public Long getIdMascota() {
        return idMascota;
    }

    public void setIdMascota(Long idMascota) {
        this.idMascota = idMascota;
    }

    public Long getIdVeterinario() {
        return idVeterinario;
    }

    public void setIdVeterinario(Long idVeterinario) {
        this.idVeterinario = idVeterinario;
    }
}