package com.veterinaria.gcv.modulos.tratamientos;

import com.veterinaria.gcv.modulos.citas.Cita;
import com.veterinaria.gcv.modulos.citas.CitaRepository;
import com.veterinaria.gcv.modulos.consultas.Consulta;
import com.veterinaria.gcv.modulos.consultas.ConsultaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TratamientoService {

    private final TratamientoRepository tratamientoRepository;
    private final ConsultaRepository consultaRepository;
    private final CitaRepository citaRepository;

    public TratamientoService(
            TratamientoRepository tratamientoRepository,
            ConsultaRepository consultaRepository,
            CitaRepository citaRepository) {
        this.tratamientoRepository = tratamientoRepository;
        this.consultaRepository = consultaRepository;
        this.citaRepository = citaRepository;
    }

    public List<Tratamiento> listarPorConsulta(Long idConsulta) {
        if (!consultaRepository.existsById(idConsulta)) {
            throw new IllegalArgumentException("La consulta médica indicada no existe.");
        }
        return tratamientoRepository.findByIdConsultaOrderByIdTratamientoAsc(idConsulta);
    }

    @Transactional
    public Tratamiento registrar(Tratamiento tratamiento) {
        validarTratamiento(tratamiento);
        obtenerConsultaEditable(tratamiento.getIdConsulta());
        limpiarCampos(tratamiento);
        tratamiento.setIdTratamiento(null);
        return tratamientoRepository.save(tratamiento);
    }

    @Transactional
    public Tratamiento actualizar(Long idTratamiento, Tratamiento datos) {
        Tratamiento tratamiento = tratamientoRepository.findById(idTratamiento)
                .orElseThrow(() -> new IllegalArgumentException("El tratamiento indicado no existe."));

        obtenerConsultaEditable(tratamiento.getIdConsulta());

        datos.setIdConsulta(tratamiento.getIdConsulta());
        validarTratamiento(datos);

        tratamiento.setMedicamento(datos.getMedicamento());
        tratamiento.setDosis(datos.getDosis());
        tratamiento.setFrecuencia(datos.getFrecuencia());
        tratamiento.setDuracion(datos.getDuracion());
        tratamiento.setIndicaciones(datos.getIndicaciones());
        limpiarCampos(tratamiento);

        return tratamientoRepository.save(tratamiento);
    }

    @Transactional
    public void eliminar(Long idTratamiento) {
        Tratamiento tratamiento = tratamientoRepository.findById(idTratamiento)
                .orElseThrow(() -> new IllegalArgumentException("El tratamiento indicado no existe."));

        obtenerConsultaEditable(tratamiento.getIdConsulta());
        tratamientoRepository.delete(tratamiento);
    }

    private Consulta obtenerConsultaEditable(Long idConsulta) {
        if (idConsulta == null) {
            throw new IllegalArgumentException("El tratamiento debe estar vinculado a una consulta médica.");
        }

        Consulta consulta = consultaRepository.findById(idConsulta)
                .orElseThrow(() -> new IllegalArgumentException("La consulta médica indicada no existe."));

        if (Boolean.TRUE.equals(consulta.getFinalizada())) {
            throw new IllegalStateException("No se puede modificar el tratamiento de una consulta finalizada.");
        }

        Cita cita = citaRepository.findById(consulta.getIdCita())
                .orElseThrow(() -> new IllegalArgumentException("La cita asociada a la consulta no existe."));

        if (!"En Consulta".equalsIgnoreCase(cita.getEstado())) {
            throw new IllegalStateException("Los tratamientos solo pueden modificarse mientras la cita esté En Consulta.");
        }

        return consulta;
    }

    private void validarTratamiento(Tratamiento tratamiento) {
        validarTexto(tratamiento.getMedicamento(), "El medicamento es obligatorio.");
        validarTexto(tratamiento.getDosis(), "La dosis es obligatoria.");
        validarTexto(tratamiento.getFrecuencia(), "La frecuencia es obligatoria.");
        validarTexto(tratamiento.getDuracion(), "La duración del tratamiento es obligatoria.");
    }

    private void validarTexto(String valor, String mensaje) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException(mensaje);
        }
    }

    private void limpiarCampos(Tratamiento tratamiento) {
        tratamiento.setMedicamento(tratamiento.getMedicamento().trim());
        tratamiento.setDosis(tratamiento.getDosis().trim());
        tratamiento.setFrecuencia(tratamiento.getFrecuencia().trim());
        tratamiento.setDuracion(tratamiento.getDuracion().trim());
        tratamiento.setIndicaciones(limpiarOpcional(tratamiento.getIndicaciones()));
    }

    private String limpiarOpcional(String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        return valor.trim();
    }
}
