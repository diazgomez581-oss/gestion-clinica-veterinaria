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

    private static final ZoneId ZONA =
            ZoneId.of("America/El_Salvador");

    private static final DateTimeFormatter FORMATO_HORA =
            DateTimeFormatter.ofPattern("HH:mm");

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
        return citaRepository.findByFechaOrderByHoraAsc(
                LocalDate.now(ZONA));
    }

    @GetMapping("/hoy/detalle")
    public List<CitaDashboardProjection> listarCitasHoyConDetalle() {
        return citaRepository.obtenerCitasDashboard(
                LocalDate.now(ZONA));
    }

    @GetMapping("/veterinarios")
    public List<Veterinario> listarVeterinarios() {
        return veterinarioRepository.findAll();
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<?> consultarDisponibilidad(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fecha,
            @RequestParam Long idVeterinario,
            @RequestParam(required = false) Long idMascota) {

        if (fecha == null || idVeterinario == null) {
            return ResponseEntity.badRequest()
                    .body("Indica fecha y veterinario.");
        }

        Set<String> horariosVeterinario = new LinkedHashSet<>();
        Set<String> horariosMascota = new LinkedHashSet<>();

        for (Cita existente :
                citaRepository.findByFechaOrderByHoraAsc(fecha)) {

            if (!bloqueaHorario(existente)
                    || existente.getHora() == null) {
                continue;
            }

            String hora = existente.getHora().format(FORMATO_HORA);

            if (Objects.equals(
                    existente.getIdVeterinario(), idVeterinario)) {
                horariosVeterinario.add(hora);
            }

            if (idMascota != null
                    && Objects.equals(
                            existente.getIdMascota(), idMascota)) {
                horariosMascota.add(hora);
            }
        }

        return ResponseEntity.ok(Map.of(
                "horariosVeterinario", horariosVeterinario,
                "horariosMascota", horariosMascota
        ));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> programarCita(@RequestBody Cita cita) {
        if (cita.getIdCitaOrigen() != null) {
            return ResponseEntity.badRequest().body("Usá la opción Reprogramar de la agenda.");
        }
        return guardarCita(cita, false);
    }

    public record DatosReprogramacion(LocalDate fecha, LocalTime hora, Long idVeterinario) {}

    @PostMapping("/{id}/reprogramar")
    @Transactional
    public ResponseEntity<?> reprogramarCita(
            @PathVariable Long id, @RequestBody DatosReprogramacion datos) {
        // La fila original se bloquea para impedir dos reprogramaciones simultáneas.
        Cita original = entityManager.find(Cita.class, id, LockModeType.PESSIMISTIC_WRITE);
        if (original == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No se encontró la cita original.");
        }
        if (!List.of("Cancelada", "No Asistió").contains(
                original.getEstado() == null ? "" : original.getEstado())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Solo se pueden reprogramar citas canceladas o no asistidas.");
        }
        Long sucesoras = entityManager.createQuery(
                "SELECT COUNT(c) FROM Cita c WHERE c.idCitaOrigen = :id", Long.class)
                .setParameter("id", id).getSingleResult();
        if (sucesoras > 0L) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Esta cita ya fue reprogramada. Consultá la nueva cita en la agenda.");
        }
        // Identidad, motivo y vacuna se toman del registro original, no del navegador.
        Cita nueva = new Cita(datos.fecha(), datos.hora(), original.getMotivo(),
                original.getIdMascota(), datos.idVeterinario());
        nueva.setIdAplicacionVacuna(original.getIdAplicacionVacuna());
        nueva.setIdCitaOrigen(original.getIdCita());
        return guardarCita(nueva, true);
    }

    private ResponseEntity<?> guardarCita(Cita cita, boolean reprogramacion) {

        if (cita.getIdCita() != null) {
            return ResponseEntity.badRequest().body(
                    "Una cita nueva no debe incluir un ID de cita.");
        }

        if (cita.getFecha() == null
                || cita.getHora() == null
                || cita.getIdVeterinario() == null
                || cita.getIdMascota() == null) {

            return ResponseEntity.badRequest().body(
                    "Debes indicar fecha, hora, veterinario y mascota.");
        }

        if (cita.getMotivo() == null
                || cita.getMotivo().isBlank()) {

            return ResponseEntity.badRequest().body(
                    "Debes indicar el motivo de la cita.");
        }

        String motivo = cita.getMotivo().trim();

        if (motivo.length() > 255) {
            return ResponseEntity.badRequest().body(
                    "El motivo no puede superar los 255 caracteres.");
        }

        LocalDate hoy = LocalDate.now(ZONA);
        LocalTime ahora = LocalTime.now(ZONA);

        if (cita.getFecha().isBefore(hoy)
                || (cita.getFecha().equals(hoy)
                && !cita.getHora().isAfter(ahora))) {

            return ResponseEntity.badRequest().body(
                    "No puedes programar citas en fechas u horas pasadas.");
        }

        if (!esHorarioPermitido(cita.getHora())) {
            return ResponseEntity.badRequest().body(
                    "Selecciona un bloque de 30 minutos entre "
                            + "08:00-11:30 o 14:00-21:00.");
        }

        // Serializa las reservas del mismo veterinario.
        Veterinario veterinario = entityManager.find(
                Veterinario.class,
                cita.getIdVeterinario(),
                LockModeType.PESSIMISTIC_WRITE
        );

        if (veterinario == null) {
            return ResponseEntity.badRequest().body(
                    "El veterinario seleccionado no existe.");
        }

        // Serializa las reservas de la misma mascota.
        Mascota mascota = entityManager.find(
                Mascota.class,
                cita.getIdMascota(),
                LockModeType.PESSIMISTIC_WRITE
        );

        if (mascota == null) {
            return ResponseEntity.badRequest().body(
                    "La mascota seleccionada no existe.");
        }

        // Validaciones adicionales para una cita de refuerzo.
        if (cita.getIdAplicacionVacuna() != null) {

            // Usa los atributos de la entidad en JPQL.
            // No necesita llamar a AplicacionVacuna.getMascota().
            Long coincidencias = entityManager.createQuery("""
                    SELECT COUNT(a)
                    FROM AplicacionVacuna a
                    WHERE a.idAplicacionVacuna = :idAplicacion
                      AND a.mascota.idMascota = :idMascota
                      AND (:reprogramacion = true OR a.proximaDosis = :fecha)
                    """, Long.class)
                    .setParameter(
                            "idAplicacion",
                            cita.getIdAplicacionVacuna())
                    .setParameter(
                            "idMascota",
                            cita.getIdMascota())
                    .setParameter(
                            "fecha",
                            cita.getFecha())
                    .setParameter("reprogramacion", reprogramacion)
                    .getSingleResult();

            if (coincidencias == 0L) {
                return ResponseEntity.badRequest().body(
                        "La mascota y la fecha deben coincidir "
                                + "con el refuerzo seleccionado.");
            }

            // Evita agendar varias citas para el mismo refuerzo.
            // Las canceladas o no asistidas permiten volver a agendar.
            Long citasVinculadas = entityManager.createQuery("""
                    SELECT COUNT(c)
                    FROM Cita c
                    WHERE c.idAplicacionVacuna = :idAplicacion
                      AND (
                          c.estado IS NULL
                          OR LOWER(TRIM(c.estado))
                              NOT IN ('cancelada', 'no asistió')
                      )
                    """, Long.class)
                    .setParameter(
                            "idAplicacion",
                            cita.getIdAplicacionVacuna())
                    .getSingleResult();

            if (citasVinculadas > 0L) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Este refuerzo ya tiene una cita vinculada.");
            }

            // Conserva el criterio usado por el listado de próximas vacunas:
            // una aplicación posterior de la misma vacuna cubre el refuerzo.
            Long refuerzosAplicados = entityManager.createQuery("""
                    SELECT COUNT(r)
                    FROM AplicacionVacuna r, AplicacionVacuna original
                    WHERE original.idAplicacionVacuna = :idAplicacion
                      AND r.mascota = original.mascota
                      AND LOWER(TRIM(r.nombreTipoVacuna))
                          = LOWER(TRIM(original.nombreTipoVacuna))
                      AND r.fechaAplicacion > original.fechaAplicacion
                    """, Long.class)
                    .setParameter(
                            "idAplicacion",
                            cita.getIdAplicacionVacuna())
                    .getSingleResult();

            if (refuerzosAplicados > 0L) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Este refuerzo ya fue aplicado.");
            }
        }

        // Comprueba la disponibilidad nuevamente al guardar.
        for (Cita existente :
                citaRepository.findByFechaOrderByHoraAsc(
                        cita.getFecha())) {

            if (!bloqueaHorario(existente)
                    || !cita.getHora().equals(existente.getHora())) {
                continue;
            }

            if (Objects.equals(
                    existente.getIdVeterinario(),
                    cita.getIdVeterinario())) {

                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Conflicto de agenda: el veterinario "
                                + "ya atiende otra cita a esa hora.");
            }

            if (Objects.equals(
                    existente.getIdMascota(),
                    cita.getIdMascota())) {

                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Conflicto de agenda: la mascota "
                                + "ya tiene otra cita a esa hora.");
            }
        }

        cita.setMotivo(motivo);
        cita.setEstado("Programada");
        cita.setHoraLlegada(null);

        Cita guardada = citaRepository.saveAndFlush(cita);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(guardada);
    }

    private boolean bloqueaHorario(Cita cita) {
        String estado = cita.getEstado();

        if (estado == null) {
            return true;
        }

        return !"Cancelada".equalsIgnoreCase(estado.trim())
                && !"No Asistió".equalsIgnoreCase(estado.trim());
    }

    private boolean esHorarioPermitido(LocalTime hora) {

        if (hora == null
                || hora.getSecond() != 0
                || hora.getNano() != 0
                || (hora.getMinute() != 0
                && hora.getMinute() != 30)) {
            return false;
        }

        boolean manana =
                !hora.isBefore(LocalTime.of(8, 0))
                        && !hora.isAfter(LocalTime.of(11, 30));

        boolean tarde =
                !hora.isBefore(LocalTime.of(14, 0))
                        && !hora.isAfter(LocalTime.of(21, 0));

        return manana || tarde;
    }

    @PatchMapping("/{id}/check-in")
    @Transactional
    public ResponseEntity<?> registrarCheckIn(@PathVariable Long id) {

        Cita cita = entityManager.find(
                Cita.class,
                id,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (cita == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontró la cita.");
        }

        if (!"Programada".equals(cita.getEstado())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Solo se puede registrar check-in "
                            + "de una cita programada.");
        }

        cita.setEstado("En Sala de Espera");
        cita.setHoraLlegada(LocalTime.now(ZONA));

        return ResponseEntity.ok(citaRepository.save(cita));
    }

    @PatchMapping("/{id}/estado")
    @Transactional
    public ResponseEntity<?> actualizarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> datos) {

        String nuevoEstado = datos.get("estado");

        if (nuevoEstado == null
                || !List.of(
                        "Cancelada",
                        "No Asistió",
                        "En Consulta"
                ).contains(nuevoEstado)) {

            return ResponseEntity.badRequest().body(
                    "El estado solicitado no es válido.");
        }

        Cita cita = entityManager.find(
                Cita.class,
                id,
                LockModeType.PESSIMISTIC_WRITE
        );

        if (cita == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontró la cita.");
        }

        String estadoActual = cita.getEstado();

        if (!"Programada".equals(estadoActual)
                && !"En Sala de Espera".equals(estadoActual)) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("No se puede modificar una cita en estado: "
                            + estadoActual);
        }

        if ("En Consulta".equals(nuevoEstado)
                && !"En Sala de Espera".equals(estadoActual)) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("La cita debe estar en sala de espera "
                            + "para iniciar consulta.");
        }

        cita.setEstado(nuevoEstado);

        return ResponseEntity.ok(citaRepository.save(cita));
    }
}