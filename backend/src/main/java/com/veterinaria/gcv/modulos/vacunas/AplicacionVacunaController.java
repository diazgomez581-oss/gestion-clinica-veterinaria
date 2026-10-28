package com.veterinaria.gcv.modulos.vacunas;

import com.veterinaria.gcv.modulos.citas.Veterinario;
import com.veterinaria.gcv.modulos.citas.VeterinarioRepository;
import com.veterinaria.gcv.modulos.mascotas.Mascota;
import com.veterinaria.gcv.modulos.mascotas.MascotaRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/mascotas/{idMascota}/vacunas")
@CrossOrigin(origins = "http://localhost:5173")
public class AplicacionVacunaController {

    private final AplicacionVacunaRepository aplicacionVacunaRepository;
    private final MascotaRepository mascotaRepository;
    private final VeterinarioRepository veterinarioRepository;

    public AplicacionVacunaController(AplicacionVacunaRepository aplicacionVacunaRepository,
                                      MascotaRepository mascotaRepository,
                                      VeterinarioRepository veterinarioRepository) {
        this.aplicacionVacunaRepository = aplicacionVacunaRepository;
        this.mascotaRepository = mascotaRepository;
        this.veterinarioRepository = veterinarioRepository;
    }

    // GET /api/mascotas/{idMascota}/vacunas -> Cartilla de vacunación de la mascota
    @GetMapping
    public List<AplicacionVacuna> listarCartilla(@PathVariable Long idMascota) {
        return aplicacionVacunaRepository.findByMascotaIdMascotaOrderByFechaAplicacionDesc(idMascota);
    }

    // POST /api/mascotas/{idMascota}/vacunas -> Registra una vacuna aplicada a la mascota
    @PostMapping
    public ResponseEntity<AplicacionVacuna> registrarVacuna(@PathVariable Long idMascota,
                                                            @Valid @RequestBody AplicacionVacuna aplicacion) {
        Mascota mascota = mascotaRepository.findById(idMascota)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La mascota no existe."));

        Veterinario veterinario = Optional.ofNullable(aplicacion.getVeterinario().getIdVeterinario())
            .flatMap(veterinarioRepository::findById)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El veterinario no existe."));

        aplicacion.setMascota(mascota);
        aplicacion.setVeterinario(veterinario);
        return ResponseEntity.status(HttpStatus.CREATED).body(aplicacionVacunaRepository.save(aplicacion));
    }

    // Errores con el mismo formato {"mensaje": ...} que el módulo de propietarios
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> manejarValidacion(MethodArgumentNotValidException e) {
        return ResponseEntity.badRequest()
            .body(Map.of("mensaje", e.getBindingResult().getAllErrors().get(0).getDefaultMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> manejarEstado(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("mensaje", e.getReason()));
    }
}
