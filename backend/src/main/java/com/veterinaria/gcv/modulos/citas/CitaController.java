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
            cita.setEstado("En Sala de Espera");
            cita.setHoraLlegada(LocalTime.now());
            return ResponseEntity.ok(citaRepository.save(cita));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}