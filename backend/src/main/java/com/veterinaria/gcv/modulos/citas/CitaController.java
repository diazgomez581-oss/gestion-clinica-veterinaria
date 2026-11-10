package com.veterinaria.gcv.modulos.citas;

import com.veterinaria.gcv.modulos.mascotas.Mascota;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "http://localhost:5173")
public class CitaController {

    private static final ZoneId ZONA = ZoneId.of("America/El_Salvador");
    private static final DateTimeFormatter FORMATO_HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final CitaRepository citaRepository;
    private final VeterinarioRepository veterinarioRepository;
    private final EntityManager entityManager;

    public CitaController(
            CitaRepository citaRepository,
            VeterinarioRepository veterinarioRepository,
            EntityManager entityManager) {
        this.citaRepository = citaRepository;
        this.veterinarioRepository = veterinarioRepository;
        this.entityManager = entityManager;
    }

    @GetMapping
    public List<Cita> listarTodasLasCitas() {
        return citaRepository.findAll();
    }

    @GetMapping("/hoy")
    public List<Cita> listarCitasHoy() {
        return citaRepository.findByFechaOrderByHoraAsc(LocalDate.now(ZONA));
    }

    @GetMapping("/hoy/detalle")
    public List<CitaDashboardProjection> listarCitasHoyConDetalle() {
        return citaRepository.obtenerCitasDashboard(LocalDate.now(ZONA));
    }

    @GetMapping("/veterinarios")
    public List<Veterinario> listarVeterinarios() {
        return veterinarioRepository.findAll();
    }

    // Consultar la ocupación real en PostgreSQL para una fecha, veterinario y mascota.
    @GetMapping("/disponibilidad")
    public ResponseEntity<?> consultarDisponibilidad(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam Long idVeterinario,
            @RequestParam(required = false) Long idMascota) {

        if (fecha == null || idVeterinario == null) {
            return ResponseEntity.badRequest().body("Indica fecha y veterinario.");
        }

        Set<String> horariosVeterinario = new LinkedHashSet<>();
        Set<String> horariosMascota = new LinkedHashSet<>();

        for (Cita existente : citaRepository.findByFechaOrderByHoraAsc(fecha)) {
            if (!bloqueaHorario(existente) || existente.getHora() == null) {
                continue;
            }
            String hora = existente.getHora().format(FORMATO_HORA);
            if (Objects.equals(existente.getIdVeterinario(), idVeterinario)) {
                horariosVeterinario.add(hora);
            }
            if (idMascota != null && Objects.equals(existente.getIdMascota(), idMascota)) {
                horariosMascota.add(hora);
            }
        }

        return ResponseEntity.ok(Map.of(
                "horariosVeterinario", horariosVeterinario,
                "horariosMascota", horariosMascota));
    }

    // Bloqueos pesimistas en las filas del veterinario y la mascota: evitan que
    // dos solicitudes simultáneas reserven el mismo bloque en PostgreSQL.
    @PostMapping
    @Transactional
    public ResponseEntity<?> programarCita(@RequestBody Cita cita) {
        if (cita.getFecha() == null || cita.getHora() == null ||
                cita.getIdVeterinario() == null || cita.getIdMascota() == null) {
            return ResponseEntity.badRequest()
                    .body("Debes indicar fecha, hora, veterinario y mascota.");
        }

        LocalDate hoy = LocalDate.now(ZONA);
        LocalTime ahora = LocalTime.now(ZONA);
        if (cita.getFecha().isBefore(hoy) ||
                (cita.getFecha().equals(hoy) && !cita.getHora().isAfter(ahora))) {
            return ResponseEntity.badRequest()
                    .body("No puedes programar citas en fechas u horas pasadas.");
        }

        if (!esHorarioPermitido(cita.getHora())) {
            return ResponseEntity.badRequest()
                    .body("Selecciona un bloque de 30 minutos entre 08:00-11:30 o 14:00-21:00.");
        }

        Veterinario veterinario = entityManager.find(
                Veterinario.class, cita.getIdVeterinario(), LockModeType.PESSIMISTIC_WRITE);
        if (veterinario == null) {
            return ResponseEntity.badRequest().body("El veterinario seleccionado no existe.");
        }

        Mascota mascota = entityManager.find(
                Mascota.class, cita.getIdMascota(), LockModeType.PESSIMISTIC_WRITE);
        if (mascota == null) {
            return ResponseEntity.badRequest().body("La mascota seleccionada no existe.");
        }

        for (Cita existente : citaRepository.findByFechaOrderByHoraAsc(cita.getFecha())) {
            if (!bloqueaHorario(existente) || !cita.getHora().equals(existente.getHora())) {
                continue;
            }
            if (Objects.equals(existente.getIdVeterinario(), cita.getIdVeterinario())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Conflicto de agenda: el veterinario ya atiende otra cita a esa hora.");
            }
            if (Objects.equals(existente.getIdMascota(), cita.getIdMascota())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Conflicto de agenda: la mascota ya tiene otra cita a esa hora.");
            }
        }

        cita.setEstado("Programada");
        Cita guardada = citaRepository.saveAndFlush(cita);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    private boolean bloqueaHorario(Cita cita) {
        String estado = cita.getEstado();
        return estado == null ||
                (!"Cancelada".equalsIgnoreCase(estado) &&
                 !"No Asistió".equalsIgnoreCase(estado));
    }

    private boolean esHorarioPermitido(LocalTime hora) {
        if (hora.getSecond() != 0 || hora.getNano() != 0 ||
                (hora.getMinute() != 0 && hora.getMinute() != 30)) {
            return false;
        }
        boolean manana = !hora.isBefore(LocalTime.of(8, 0)) &&
                !hora.isAfter(LocalTime.of(11, 30));
        boolean tarde = !hora.isBefore(LocalTime.of(14, 0)) &&
                !hora.isAfter(LocalTime.of(21, 0));
        return manana || tarde;
    }

    @PatchMapping("/{id}/check-in")
    public ResponseEntity<?> registrarCheckIn(@PathVariable Long id) {
        return citaRepository.findById(id).map(cita -> {
            if (!"Programada".equals(cita.getEstado())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Solo se puede registrar check-in de una cita programada.");
            }
            cita.setEstado("En Sala de Espera");
            cita.setHoraLlegada(LocalTime.now(ZONA));
            return ResponseEntity.ok(citaRepository.save(cita));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("No se encontró la cita."));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> datos) {

        String nuevoEstado = datos.get("estado");
        if (nuevoEstado == null || !List.of(
                "Cancelada", "No Asistió", "En Consulta").contains(nuevoEstado)) {
            return ResponseEntity.badRequest().body("El estado solicitado no es válido.");
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
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("No se encontró la cita."));
    }
}
