package com.veterinaria.gcv.modulos.vacunas;

import com.veterinaria.gcv.modulos.citas.Cita;
import com.veterinaria.gcv.modulos.citas.CitaRepository;
import com.veterinaria.gcv.modulos.citas.Veterinario;
import com.veterinaria.gcv.modulos.citas.VeterinarioRepository;
import com.veterinaria.gcv.modulos.mascotas.Mascota;
import com.veterinaria.gcv.modulos.mascotas.MascotaRepository;
import com.veterinaria.gcv.modulos.usuarios.Usuario;
import com.veterinaria.gcv.modulos.usuarios.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/mascotas/{idMascota}/vacunas")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AplicacionVacunaController {

    private static final ZoneId ZONA = ZoneId.of("America/El_Salvador");

    private final AplicacionVacunaRepository aplicacionVacunaRepository;
    private final MascotaRepository mascotaRepository;
    private final VeterinarioRepository veterinarioRepository;
    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;

    public AplicacionVacunaController(
            AplicacionVacunaRepository aplicacionVacunaRepository,
            MascotaRepository mascotaRepository,
            VeterinarioRepository veterinarioRepository,
            CitaRepository citaRepository,
            UsuarioRepository usuarioRepository) {
        this.aplicacionVacunaRepository = aplicacionVacunaRepository;
        this.mascotaRepository = mascotaRepository;
        this.veterinarioRepository = veterinarioRepository;
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Solo recibimos datos clínicos. No se confía en el veterinario ni la fecha del navegador.
    public record RegistrarVacunaRequest(
            @NotNull(message = "La cita activa es obligatoria.") Long idCita,
            @NotBlank(message = "El nombre o tipo de vacuna es obligatorio.")
            @Size(max = 100, message = "El nombre o tipo de vacuna no puede exceder 100 caracteres.")
            String nombreTipoVacuna,
            @NotBlank(message = "El lote es obligatorio.")
            @Size(max = 50, message = "El lote no puede exceder 50 caracteres.")
            String lote,
            LocalDate proximaDosis
    ) {}

    @GetMapping
    public List<AplicacionVacuna> listarCartilla(@PathVariable Long idMascota) {
        return aplicacionVacunaRepository.findByMascotaIdMascotaOrderByFechaAplicacionDesc(idMascota);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<AplicacionVacuna> registrarVacuna(
            @PathVariable Long idMascota,
            @Valid @RequestBody RegistrarVacunaRequest datos,
            HttpServletRequest request) {

        HttpSession sesion = request.getSession(false);
        Object usuarioId = sesion != null ? sesion.getAttribute("usuarioId") : null;
        if (!(usuarioId instanceof Long)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Tu sesión ha expirado. Iniciá sesión nuevamente.");
        }

        Usuario usuario = usuarioRepository.findById((Long) usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "La sesión no corresponde a un usuario válido."));

        if (!Boolean.TRUE.equals(usuario.getActivo()) ||
                !"VETERINARIO".equals(usuario.getRol()) ||
                usuario.getIdVeterinario() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo un usuario activo con rol VETERINARIO puede aplicar vacunas.");
        }

        Cita cita = citaRepository.findById(datos.idCita())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "La cita seleccionada no existe."));

        if (!"En Consulta".equals(cita.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La cita debe estar en estado En Consulta para registrar vacunas.");
        }
        if (!Objects.equals(cita.getIdMascota(), idMascota)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La mascota no corresponde a la cita que se está atendiendo.");
        }
        if (!Objects.equals(cita.getIdVeterinario(), usuario.getIdVeterinario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el veterinario asignado a esta cita puede registrar la vacuna.");
        }

        LocalDate fechaAplicacion = LocalDate.now(ZONA);
        if (!fechaAplicacion.equals(cita.getFecha())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La cita debe corresponder a la fecha actual para aplicar la vacuna.");
        }
        if (datos.proximaDosis() != null && !datos.proximaDosis().isAfter(fechaAplicacion)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La próxima dosis debe ser posterior a la fecha de aplicación.");
        }

        Mascota mascota = mascotaRepository.findById(idMascota)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "La mascota no existe."));
        Veterinario veterinario = veterinarioRepository.findById(usuario.getIdVeterinario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El usuario no está vinculado a un veterinario válido."));

        AplicacionVacuna aplicacion = new AplicacionVacuna();
        aplicacion.setMascota(mascota);
        aplicacion.setVeterinario(veterinario);
        aplicacion.setNombreTipoVacuna(datos.nombreTipoVacuna().trim());
        aplicacion.setLote(datos.lote().trim());
        aplicacion.setFechaAplicacion(fechaAplicacion);
        aplicacion.setProximaDosis(datos.proximaDosis());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aplicacionVacunaRepository.save(aplicacion));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> manejarValidacion(MethodArgumentNotValidException e) {
        String mensaje = e.getBindingResult().getAllErrors().isEmpty()
                ? "Los datos de la vacuna no son válidos."
                : e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.badRequest().body(Map.of("mensaje", mensaje));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> manejarEstado(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(Map.of("mensaje", e.getReason() != null ? e.getReason() : "Error de validación."));
    }
}
