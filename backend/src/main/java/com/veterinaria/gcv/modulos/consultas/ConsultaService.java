package com.veterinaria.gcv.modulos.consultas;

import com.veterinaria.gcv.modulos.citas.Cita;
import com.veterinaria.gcv.modulos.citas.CitaRepository;
import com.veterinaria.gcv.modulos.citas.VeterinarioRepository;
import com.veterinaria.gcv.modulos.mascotas.MascotaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConsultaService {

    private final ConsultaRepository consultaRepository;
    private final CitaRepository citaRepository;
    private final MascotaRepository mascotaRepository;
    private final VeterinarioRepository veterinarioRepository;

    public ConsultaService(
            ConsultaRepository consultaRepository,
            CitaRepository citaRepository,
            MascotaRepository mascotaRepository,
            VeterinarioRepository veterinarioRepository) {
        this.consultaRepository = consultaRepository;
        this.citaRepository = citaRepository;
        this.mascotaRepository = mascotaRepository;
        this.veterinarioRepository = veterinarioRepository;
    }

    public List<Consulta> listarTodas() {
        return consultaRepository.findAll();
    }

    public List<Consulta> historialPorMascota(Long idMascota) {
        if (!mascotaRepository.existsById(idMascota)) {
            throw new IllegalArgumentException("La mascota indicada no existe.");
        }
        return consultaRepository.findByIdMascotaOrderByFechaHoraDesc(idMascota);
    }

    public Consulta registrarConsulta(Consulta consulta) {
        validarTextoObligatorio(consulta.getMotivoConsulta(), "El motivo de consulta es obligatorio.");
        validarTextoObligatorio(consulta.getDiagnostico(), "El diagnóstico médico es obligatorio.");
        validarTextoObligatorio(consulta.getObservaciones(), "Las observaciones son obligatorias.");

        if (consulta.getIdCita() == null) {
            throw new IllegalArgumentException("La consulta debe estar vinculada a una cita.");
        }

        Cita cita = citaRepository.findById(consulta.getIdCita())
                .orElseThrow(() -> new IllegalArgumentException("La cita indicada no existe."));

        if (!"En Sala de Espera".equalsIgnoreCase(cita.getEstado()) &&
            !"En espera".equalsIgnoreCase(cita.getEstado())) {
            throw new IllegalStateException(
                    "La consulta solo puede iniciarse cuando la cita se encuentra en sala de espera.");
        }

        if (consultaRepository.existsByIdCita(cita.getIdCita())) {
            throw new IllegalStateException("Ya existe una consulta registrada para esta cita.");
        }

        if (consulta.getIdMascota() == null || !mascotaRepository.existsById(consulta.getIdMascota())) {
            throw new IllegalArgumentException("La mascota indicada no existe.");
        }

        if (consulta.getIdVeterinario() == null || !veterinarioRepository.existsById(consulta.getIdVeterinario())) {
            throw new IllegalArgumentException("El veterinario indicado no existe.");
        }

        if (!cita.getIdMascota().equals(consulta.getIdMascota())) {
            throw new IllegalArgumentException("La mascota de la consulta no coincide con la mascota asignada a la cita.");
        }

        if (!cita.getIdVeterinario().equals(consulta.getIdVeterinario())) {
            throw new IllegalArgumentException("El veterinario de la consulta no coincide con el veterinario asignado a la cita.");
        }

        if (consulta.getTemperatura() != null && (consulta.getTemperatura() < 30 || consulta.getTemperatura() > 45)) {
            throw new IllegalArgumentException("La temperatura registrada está fuera del rango permitido (30 °C a 45 °C).");
        }

        if (consulta.getPesoActual() != null && consulta.getPesoActual() <= 0) {
            throw new IllegalArgumentException("El peso actual debe ser mayor que cero.");
        }

        if (consulta.getFrecuenciaCardiaca() != null && consulta.getFrecuenciaCardiaca() <= 0) {
            throw new IllegalArgumentException("La frecuencia cardíaca debe ser mayor que cero.");
        }

        consulta.setMotivoConsulta(consulta.getMotivoConsulta().trim());
        consulta.setDiagnostico(consulta.getDiagnostico().trim());
        consulta.setObservaciones(consulta.getObservaciones().trim());
        consulta.setAnamnesis(limpiarOpcional(consulta.getAnamnesis()));
        consulta.setExamenFisico(limpiarOpcional(consulta.getExamenFisico()));
        consulta.setFechaHora(LocalDateTime.now());
        consulta.setFinalizada(false);

        return consultaRepository.save(consulta);
    }

    private void validarTextoObligatorio(String valor, String mensaje) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException(mensaje);
        }
    }

    private String limpiarOpcional(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        return valor.trim();
    }
}
