package com.veterinaria.gcv.modulos.mascotas;

import com.veterinaria.gcv.modulos.propietarios.Propietario;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "mascotas")
public class Mascota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mascota")
    private Long idMascota;

    @Column(name = "codigo_expediente", nullable = false, unique = true)
    private String codigoExpediente;

    private String nombre;
    private String especie;
    private String raza;
    private String sexo;
    
    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;
    
    @Column(name = "edad_estimada")
    private String edadEstimada;
    
    private String color;
    
    @Column(name = "peso_inicial")
    private Double pesoInicial;

    @ManyToOne
    @JoinColumn(name = "id_propietario", nullable = false)
    @JsonIgnore
    private Propietario propietario;

    public Mascota() {}

    // Getters y Setters
    public Long getIdMascota() { return idMascota; }
    public void setIdMascota(Long idMascota) { this.idMascota = idMascota; }

    public String getCodigoExpediente() { return codigoExpediente; }
    public void setCodigoExpediente(String codigoExpediente) { this.codigoExpediente = codigoExpediente; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEspecie() { return especie; }
    public void setEspecie(String especie) { this.especie = especie; }

    public String getRaza() { return raza; }
    public void setRaza(String raza) { this.raza = raza; }

    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }

    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public String getEdadEstimada() { return edadEstimada; }
    public void setEdadEstimada(String edadEstimada) { this.edadEstimada = edadEstimada; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Double getPesoInicial() { return pesoInicial; }
    public void setPesoInicial(Double pesoInicial) { this.pesoInicial = pesoInicial; }

    public Propietario getPropietario() { return propietario; }
    public void setPropietario(Propietario propietario) { this.propietario = propietario; }
}