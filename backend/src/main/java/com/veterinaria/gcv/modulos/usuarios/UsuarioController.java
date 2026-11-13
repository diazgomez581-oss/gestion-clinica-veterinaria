
package com.veterinaria.gcv.modulos.usuarios;

import com.veterinaria.gcv.modulos.citas.Veterinario;
import com.veterinaria.gcv.modulos.citas.VeterinarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/usuarios")



public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final VeterinarioRepository veterinarioRepository;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    private static final Set<String> ROLES =
            Set.of("ADMIN", "RECEPCIONISTA", "VETERINARIO");

    public UsuarioController(
            UsuarioRepository usuarioRepository,
            VeterinarioRepository veterinarioRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.veterinarioRepository = veterinarioRepository;
    }

    public record UsuarioRequest(
            String username,
            String nombre,
            String password,
            String rol,
            Long idVeterinario
    ) {}

    public record UsuarioResponse(
            Long idUsuario,
            String username,
            String nombre,
            String rol,
            Boolean activo,
            Long idVeterinario
    ) {}

    private UsuarioResponse convertir(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getNombre(),
                usuario.getRol(),
                usuario.getActivo(),
                usuario.getIdVeterinario()
        );
    }

    // Verificar permisos de administrador
    private boolean esAdmin(HttpServletRequest request) {

        HttpSession sesion = request.getSession(false);

        if (sesion == null) {
            return false;
        }

        Object id = sesion.getAttribute("usuarioId");

        if (!(id instanceof Long idUsuario)) {
            return false;
        }

        return usuarioRepository.findById(idUsuario)
                .filter(u -> Boolean.TRUE.equals(u.getActivo()))
                .map(u -> "ADMIN".equals(u.getRol()))
                .orElse(false);
    }

    private ResponseEntity<?> accesoDenegado() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                        "mensaje",
                        "No tenés permisos para gestionar usuarios."
                ));
    }

    // =====================================
    // LISTAR USUARIOS
    // GET /api/usuarios
    // =====================================

    @GetMapping
    public ResponseEntity<?> listar(HttpServletRequest request) {

        if (!esAdmin(request)) {
            return accesoDenegado();
        }

        List<UsuarioResponse> usuarios =
                usuarioRepository.findAll()
                        .stream()
                        .map(this::convertir)
                        .toList();

        return ResponseEntity.ok(usuarios);
    }

    // =====================================
    // REGISTRAR USUARIO
    // POST /api/usuarios
    // =====================================

    @PostMapping
    @Transactional
    public ResponseEntity<?> registrar(
            @RequestBody UsuarioRequest datos,
            HttpServletRequest request
    ) {

        if (!esAdmin(request)) {
            return accesoDenegado();
        }

        if (datos == null ||
                datos.username() == null ||
                datos.nombre() == null ||
                datos.password() == null ||
                datos.rol() == null ||
                datos.username().isBlank() ||
                datos.nombre().isBlank() ||
                datos.password().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "mensaje",
                            "Completá todos los campos obligatorios."
                    ));
        }

        String rol = datos.rol().trim().toUpperCase();
        String username = datos.username().trim();
        String nombre = datos.nombre().trim();

        if (!ROLES.contains(rol)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "mensaje",
                            "Rol no válido."
                    ));
        }

        if (nombre.length() > 100) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "mensaje",
                            "El nombre no puede superar los 100 caracteres."
                    ));
        }

        if (datos.password().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "mensaje",
                            "La contraseña debe tener al menos 8 caracteres."
                    ));
        }

        if (usuarioRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "mensaje",
                            "Ese nombre de usuario ya existe."
                    ));
        }

        Long idVeterinario = null;

        // =====================================
        // CREAR VETERINARIO AUTOMÁTICAMENTE
        // =====================================

        if ("VETERINARIO".equals(rol)) {

            Veterinario veterinario = new Veterinario();

            veterinario.setNombre(nombre);

            Veterinario guardado =
                    veterinarioRepository.saveAndFlush(veterinario);

            idVeterinario = guardado.getIdVeterinario();
        }

        // =====================================
        // CREAR CUENTA DE USUARIO
        // =====================================

        Usuario usuario = new Usuario();

        usuario.setUsername(username);
        usuario.setNombre(nombre);

        usuario.setPasswordHash(
                passwordEncoder.encode(datos.password())
        );

        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setIdVeterinario(idVeterinario);

        Usuario guardado = usuarioRepository.saveAndFlush(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(convertir(guardado));
    }

    // =====================================
    // ACTIVAR O DESACTIVAR USUARIO
    // PATCH /api/usuarios/{id}/estado
    // =====================================

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> datos,
            HttpServletRequest request
    ) {

        if (!esAdmin(request)) {
            return accesoDenegado();
        }

        Boolean activo = datos.get("activo");

        if (activo == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "mensaje",
                            "Debés indicar el estado del usuario."
                    ));
        }

        HttpSession sesion = request.getSession(false);

        if (sesion != null &&
                id.equals(sesion.getAttribute("usuarioId")) &&
                !activo) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "mensaje",
                            "No podés desactivar tu propia cuenta."
                    ));
        }

        return usuarioRepository.findById(id)
                .<ResponseEntity<?>>map(usuario -> {

                    usuario.setActivo(activo);
                    usuarioRepository.save(usuario);

                    return ResponseEntity.ok(convertir(usuario));
                })
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                        "mensaje",
                                        "Usuario no encontrado."
                                ))
                );
    }
}
