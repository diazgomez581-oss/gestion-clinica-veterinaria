package com.veterinaria.gcv.modulos.tratamientos;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tratamientos")
@CrossOrigin(origins = "http://localhost:5173")
public class TratamientoController {

    private final TratamientoService tratamientoService;

    public TratamientoController(TratamientoService tratamientoService) {
        this.tratamientoService = tratamientoService;
    }

    @GetMapping("/consulta/{idConsulta}")
    public ResponseEntity<?> listarPorConsulta(@PathVariable Long idConsulta) {
        try {
            List<Tratamiento> tratamientos = tratamientoService.listarPorConsulta(idConsulta);
            return ResponseEntity.ok(tratamientos);
        } catch (IllegalArgumentException e) {
            return respuestaError(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Tratamiento tratamiento) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(tratamientoService.registrar(tratamiento));
        } catch (IllegalArgumentException e) {
            return respuestaError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            return respuestaError(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @PutMapping("/{idTratamiento}")
    public ResponseEntity<?> actualizar(
            @PathVariable Long idTratamiento,
            @RequestBody Tratamiento tratamiento) {
        try {
            return ResponseEntity.ok(tratamientoService.actualizar(idTratamiento, tratamiento));
        } catch (IllegalArgumentException e) {
            return respuestaError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            return respuestaError(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @DeleteMapping("/{idTratamiento}")
    public ResponseEntity<?> eliminar(@PathVariable Long idTratamiento) {
        try {
            tratamientoService.eliminar(idTratamiento);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return respuestaError(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            return respuestaError(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> respuestaError(HttpStatus estado, String mensaje) {
        return ResponseEntity.status(estado).body(Map.of("mensaje", mensaje));
    }
}
