package com.veterinaria.gcv.modulos.mascotas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/mascotas")
@CrossOrigin(origins = "http://localhost:5173")
public class MascotaController {

    @Autowired
    private MascotaRepository mascotaRepository;

    @GetMapping
    public List<Mascota> listarMascotas() {
        return mascotaRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Mascota> registrarMascota(@RequestBody Mascota mascota) {
        // Criterio 1: Validar que venga un propietario asignado
        if (mascota.getPropietario() == null || mascota.getPropietario().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Mascota nuevaMascota = mascotaRepository.save(mascota);
        return ResponseEntity.ok(nuevaMascota);
    }
}

