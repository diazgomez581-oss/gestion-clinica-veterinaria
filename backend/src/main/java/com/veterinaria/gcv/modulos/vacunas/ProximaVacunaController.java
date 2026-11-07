package com.veterinaria.gcv.modulos.vacunas;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vacunas")
@CrossOrigin(origins = "http://localhost:5173")
public class ProximaVacunaController {

    private final AplicacionVacunaRepository aplicacionVacunaRepository;

    public ProximaVacunaController(AplicacionVacunaRepository aplicacionVacunaRepository) {
        this.aplicacionVacunaRepository = aplicacionVacunaRepository;
    }

    // GET /api/vacunas/proximas?dias=30 -> Refuerzos vencidos y los que vencen entre hoy y hoy + dias
    @GetMapping("/proximas")
    public List<ProximaVacuna> listarProximas(@RequestParam(defaultValue = "30") int dias) {
        return aplicacionVacunaRepository.listarProximas(LocalDate.now().plusDays(dias));
    }
}
