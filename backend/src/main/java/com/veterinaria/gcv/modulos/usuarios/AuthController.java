
package com.veterinaria.gcv.modulos.usuarios;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")

public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public record LoginRequest(
            String username,
            String password
    ) {}

    public record UsuarioResponse(
            Long idUsuario,
            String username,
            String nombre,
            String rol,
            Long idVeterinario
    ) {}

    private UsuarioResponse convertirUsuario(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getNombre(),
                usuario.getRol(),
                usuario.getIdVeterinario()
        );
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest datos,
            HttpServletRequest request
    ) {

        if (datos == null ||
                datos.username() == null ||
                datos.password() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "Ingresá usuario y contraseña."));
        }

        var usuarioEncontrado =
                usuarioRepository.findByUsername(datos.username().trim());

        if (usuarioEncontrado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Usuario o contraseña incorrectos."));
        }

        Usuario usuario = usuarioEncontrado.get();

        if (!Boolean.TRUE.equals(usuario.getActivo()) ||
                !passwordEncoder.matches(
                        datos.password(),
                        usuario.getPasswordHash()
                )) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Usuario o contraseña incorrectos."));
        }

        // Evitar reutilizar una sesión anterior
        HttpSession anterior = request.getSession(false);
        if (anterior != null) {
            anterior.invalidate();
        }

        HttpSession sesion = request.getSession(true);
        sesion.setAttribute("usuarioId", usuario.getIdUsuario());
        sesion.setMaxInactiveInterval(15 * 60);

        return ResponseEntity.ok(convertirUsuario(usuario));
    }

    // GET /api/auth/me
    @GetMapping("/me")
    public ResponseEntity<?> usuarioActual(
            HttpServletRequest request
    ) {
        HttpSession sesion = request.getSession(false);

        if (sesion == null ||
                sesion.getAttribute("usuarioId") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "No hay una sesión activa."));
        }

        Long idUsuario = (Long) sesion.getAttribute("usuarioId");

        return usuarioRepository.findById(idUsuario)
                .filter(usuario -> Boolean.TRUE.equals(usuario.getActivo()))
                .<ResponseEntity<?>>map(usuario ->
                        ResponseEntity.ok(convertirUsuario(usuario)))
                .orElseGet(() -> {
                    sesion.invalidate();
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("mensaje", "Sesión no válida."));
                });
    }

    // POST /api/auth/logout
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request
    ) {
        HttpSession sesion = request.getSession(false);

        if (sesion != null) {
            sesion.invalidate();
        }

        return ResponseEntity.ok(
                Map.of("mensaje", "Sesión cerrada correctamente.")
        );
    }
}
