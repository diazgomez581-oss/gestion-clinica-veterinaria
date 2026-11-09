package com.veterinaria.gcv.modulos.historial;

import com.veterinaria.gcv.modulos.citas.VeterinarioRepository;
import com.veterinaria.gcv.modulos.consultas.Consulta;
import com.veterinaria.gcv.modulos.consultas.ConsultaRepository;
import com.veterinaria.gcv.modulos.historial.HistorialClinicoResponse.ConsultaDetalle;
import com.veterinaria.gcv.modulos.historial.HistorialClinicoResponse.EventoHistorial;
import com.veterinaria.gcv.modulos.historial.HistorialClinicoResponse.MascotaResumen;
import com.veterinaria.gcv.modulos.historial.HistorialClinicoResponse.PropietarioResumen;
import com.veterinaria.gcv.modulos.historial.HistorialClinicoResponse.ResumenHistorial;
import com.veterinaria.gcv.modulos.historial.HistorialClinicoResponse.TratamientoDetalle;
import com.veterinaria.gcv.modulos.historial.HistorialClinicoResponse.VacunaDetalle;
import com.veterinaria.gcv.modulos.mascotas.Mascota;
import com.veterinaria.gcv.modulos.mascotas.MascotaRepository;
import com.veterinaria.gcv.modulos.propietarios.Propietario;
import com.veterinaria.gcv.modulos.tratamientos.Tratamiento;
import com.veterinaria.gcv.modulos.tratamientos.TratamientoRepository;
import com.veterinaria.gcv.modulos.vacunas.AplicacionVacuna;
import com.veterinaria.gcv.modulos.vacunas.AplicacionVacunaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class HistorialClinicoService {

    private final MascotaRepository mascotaRepository;
    private final ConsultaRepository consultaRepository;
    private final TratamientoRepository tratamientoRepository;
    private final AplicacionVacunaRepository aplicacionVacunaRepository;
    private final VeterinarioRepository veterinarioRepository;

    public HistorialClinicoService(
            MascotaRepository mascotaRepository,
            ConsultaRepository consultaRepository,
            TratamientoRepository tratamientoRepository,
            AplicacionVacunaRepository aplicacionVacunaRepository,
            VeterinarioRepository veterinarioRepository) {
        this.mascotaRepository = mascotaRepository;
        this.consultaRepository = consultaRepository;
        this.tratamientoRepository = tratamientoRepository;
        this.aplicacionVacunaRepository = aplicacionVacunaRepository;
        this.veterinarioRepository = veterinarioRepository;
    }

    @Transactional(readOnly = true)
    public HistorialClinicoResponse obtenerPorMascota(Long idMascota) {
        Mascota mascota = mascotaRepository.findById(idMascota)
                .orElseThrow(() -> new IllegalArgumentException("La mascota indicada no existe."));

        List<Consulta> consultas = consultaRepository
                .findByIdMascotaOrderByFechaHoraDesc(idMascota)
                .stream()
                .filter(consulta -> Boolean.TRUE.equals(consulta.getFinalizada()))
                .toList();

        List<AplicacionVacuna> vacunas = aplicacionVacunaRepository
                .findByMascotaIdMascotaOrderByFechaAplicacionDesc(idMascota);

        List<EventoHistorial> eventos = new ArrayList<>();
        int totalTratamientos = 0;

        for (Consulta consulta : consultas) {
            List<Tratamiento> tratamientos = tratamientoRepository
                    .findByIdConsultaOrderByIdTratamientoAsc(consulta.getIdConsulta());
            totalTratamientos += tratamientos.size();

            eventos.add(new EventoHistorial(
                    "CONSULTA",
                    consulta.getFechaHora(),
                    consulta.getIdConsulta(),
                    "Consulta médica",
                    nombreVeterinario(consulta.getIdVeterinario()),
                    new ConsultaDetalle(
                            consulta.getMotivoConsulta(),
                            consulta.getAnamnesis(),
                            consulta.getTemperatura(),
                            consulta.getPesoActual(),
                            consulta.getFrecuenciaCardiaca(),
                            consulta.getExamenFisico(),
                            consulta.getDiagnostico(),
                            consulta.getObservaciones()),
                    tratamientos.stream().map(this::mapearTratamiento).toList(),
                    null));
        }

        for (AplicacionVacuna vacuna : vacunas) {
            String veterinario = vacuna.getVeterinario() != null
                    ? vacuna.getVeterinario().getNombre()
                    : "Veterinario no identificado";

            eventos.add(new EventoHistorial(
                    "VACUNA",
                    vacuna.getFechaAplicacion().atStartOfDay(),
                    vacuna.getIdAplicacionVacuna(),
                    "Vacuna: " + vacuna.getNombreTipoVacuna(),
                    veterinario,
                    null,
                    List.of(),
                    new VacunaDetalle(
                            vacuna.getNombreTipoVacuna(),
                            vacuna.getLote(),
                            vacuna.getFechaAplicacion(),
                            vacuna.getProximaDosis())));
        }

        eventos.sort(Comparator.comparing(EventoHistorial::fechaHora).reversed());

        Propietario propietario = mascota.getPropietario();
        PropietarioResumen propietarioResumen = propietario == null
                ? null
                : new PropietarioResumen(
                        propietario.getIdPropietario(),
                        (propietario.getNombres() + " " + propietario.getApellidos()).trim(),
                        propietario.getTelefono(),
                        propietario.getCorreo());

        return new HistorialClinicoResponse(
                new MascotaResumen(
                        mascota.getIdMascota(),
                        mascota.getCodigoExpediente(),
                        mascota.getNombre(),
                        mascota.getEspecie(),
                        mascota.getRaza(),
                        mascota.getSexo(),
                        mascota.getFechaNacimiento(),
                        mascota.getEdadEstimada(),
                        mascota.getColor(),
                        mascota.getPesoInicial()),
                propietarioResumen,
                new ResumenHistorial(
                        consultas.size(),
                        totalTratamientos,
                        vacunas.size()),
                eventos);
    }

    private TratamientoDetalle mapearTratamiento(Tratamiento tratamiento) {
        return new TratamientoDetalle(
                tratamiento.getIdTratamiento(),
                tratamiento.getMedicamento(),
                tratamiento.getDosis(),
                tratamiento.getFrecuencia(),
                tratamiento.getDuracion(),
                tratamiento.getIndicaciones());
    }

    private String nombreVeterinario(Long idVeterinario) {
        return veterinarioRepository.findById(idVeterinario)
                .map(veterinario -> veterinario.getNombre())
                .orElse("Veterinario no identificado");
    }
}
