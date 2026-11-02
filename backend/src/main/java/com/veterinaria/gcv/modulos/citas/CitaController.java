package com.veterinaria.gcv.modulos.citas;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "http://localhost:5173")
public class CitaController {

    private final CitaRepository citaRepository;
    private final VeterinarioRepository veterinarioRepository;

    public CitaController(CitaRepository citaRepository, VeterinarioRepository veterinarioRepository) {
        this.citaRepository = citaRepository;
        this.veterinarioRepository = veterinarioRepository;
    }


    // GET /api/citas -> Devuelve TODAS las citas registradas en la BD (Para el Calendario y Agenda General)
    @GetMapping
    public List<Cita> listarTodasLasCitas() {
        return citaRepository.findAll();
    }

    // GET /api/citas/hoy -> Alimenta el Dashboard con las citas del día actual
    @GetMapping("/hoy")
    public List<Cita> listarCitasHoy() {
        return citaRepository.findByFechaOrderByHoraAsc(LocalDate.now());
    }

    // GCV-7 [CIT-03]: Citas del día con nombres reales
    @GetMapping("/hoy/detalle")
    public List<CitaDashboardProjection> listarCitasHoyConDetalle() {
        return citaRepository.obtenerCitasDashboard(LocalDate.now());
    }

    // GET /api/citas/veterinarios -> Devuelve los veterinarios registrados en PostgreSQL
    @GetMapping("/veterinarios")
    public List<Veterinario> listarVeterinarios() {
        return veterinarioRepository.findAll();
    }

    // POST /api/citas -> HU GCV-5 [CIT-01]: Programar Cita con validación RN-02
    @PostMapping
    public ResponseEntity<?> programarCita(@RequestBody Cita cita) {
        boolean ocupado = citaRepository.existsByIdVeterinarioAndFechaAndHoraAndEstadoNot(
            cita.getIdVeterinario(),
            cita.getFecha(),
            cita.getHora(),
            "Cancelada"
        );

        if (ocupado) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Conflicto de Agenda (RN-02): El médico ya cuenta con una cita en esa fecha y hora.");
        }

        cita.setEstado("Programada");
        Cita guardada = citaRepository.save(cita);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    // PATCH /api/citas/{id}/check-in -> HU GCV-6 [CIT-02]: Check-in de llegada
   
        @PatchMapping("/{id}/check-in")
        public ResponseEntity<?> registrarCheckIn(@PathVariable Long id) {

            return citaRepository.findById(id).map(cita -> {

                if (!"Programada".equals(cita.getEstado())) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Solo se puede registrar check-in de una cita programada.");
                }

                cita.setEstado("En Sala de Espera");
                cita.setHoraLlegada(LocalTime.now());

                return ResponseEntity.ok(citaRepository.save(cita));

            }).orElseGet(() ->
                ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontró la cita.")
            );
        }

    
    // GCV-7 [CIT-03]: Control y actualización de estados
    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> datos) {

        String nuevoEstado = datos.get("estado");

        if (nuevoEstado == null ||
            !java.util.List.of(
                "Cancelada",
                "No Asistió",
                "En Consulta"
            ).contains(nuevoEstado)) {

            return ResponseEntity.badRequest()
                .body("El estado solicitado no es válido.");
        }

        return citaRepository.findById(id).map(cita -> {

            String estadoActual = cita.getEstado();

            if (!"Programada".equals(estadoActual) &&
                !"En Sala de Espera".equals(estadoActual)) {

                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("No se puede modificar una cita en estado: " + estadoActual);
            }

            if ("En Consulta".equals(nuevoEstado) &&
                !"En Sala de Espera".equals(estadoActual)) {

                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("La cita debe estar en sala de espera para iniciar consulta.");
            }

            cita.setEstado(nuevoEstado);

            return ResponseEntity.ok(citaRepository.save(cita));

        }).orElseGet(() ->
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("No se encontró la cita.")
        );
    }

}