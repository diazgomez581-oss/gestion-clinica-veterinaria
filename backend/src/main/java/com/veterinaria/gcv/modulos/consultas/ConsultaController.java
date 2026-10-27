package com.veterinaria.gcv.modulos.consultas;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultas")
@CrossOrigin(origins = "http://localhost:5173")
public class ConsultaController {

    private final ConsultaService consultaService;

    public ConsultaController(ConsultaService consultaService) {
        this.consultaService = consultaService;
    }

    // GET /api/consultas -> listado general de consultas registradas
    @GetMapping
    public ResponseEntity<List<Consulta>> listarConsultas() {
        return ResponseEntity.ok(consultaService.listarTodas());
    }

    // GET /api/consultas/mascota/{idMascota} -> historial clínico previo para CON-01
    @GetMapping("/mascota/{idMascota}")
    public ResponseEntity<?> historialPorMascota(@PathVariable Long idMascota) {
        try {
            return ResponseEntity.ok(consultaService.historialPorMascota(idMascota));
        } catch (IllegalArgumentException e) {
            return respuestaError(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // POST /api/consultas -> HU GCV-8 [CON-01]: Registro de consulta médica y diagnóstico
    @PostMapping
    public ResponseEntity<?> registrarConsulta(@RequestBody Consulta consulta) {
        try {
            Consulta guardada = consultaService.registrarConsulta(consulta);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
        } catch (IllegalArgumentException e) {
            return respuestaError(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            return respuestaError(HttpStatus.CONFLICT, e.getMessage());
        } catch (Exception e) {
            return respuestaError(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error interno al registrar la consulta médica.");
        }
    }

    private ResponseEntity<Map<String, String>> respuestaError(HttpStatus estado, String mensaje) {
        Map<String, String> error = new HashMap<>();
        error.put("mensaje", mensaje);
        return ResponseEntity.status(estado).body(error);
    }
}
