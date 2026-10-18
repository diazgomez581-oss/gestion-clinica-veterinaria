package com.veterinaria.gcv.modulos.propietarios;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class PropietarioService {

    private final PropietarioRepository propietarioRepository;
    private static final Pattern DUI_PATTERN = Pattern.compile("^\\d{8}-\\d{1}$");

    public PropietarioService(PropietarioRepository propietarioRepository) {
        this.propietarioRepository = propietarioRepository;
    }

    public List<Propietario> listarTodos() {
        return propietarioRepository.findAll();
    }

    public Propietario registrarPropietario(Propietario propietario) {
        // Criterio 1: Validar campos obligatorios
        if (propietario.getNombres() == null || propietario.getNombres().trim().isEmpty() ||
            propietario.getApellidos() == null || propietario.getApellidos().trim().isEmpty() ||
            propietario.getTelefono() == null || propietario.getTelefono().trim().isEmpty() ||
            propietario.getDireccion() == null || propietario.getDireccion().trim().isEmpty()) {
            throw new IllegalArgumentException("Nombres, apellidos, teléfono y dirección son obligatorios.");
        }

        // Criterio 2: Validar formato de DUI (8 dígitos, guion y 1 dígito)
        if (propietario.getDui() == null || !DUI_PATTERN.matcher(propietario.getDui().trim()).matches()) {
            throw new IllegalArgumentException("El formato del DUI debe ser válido (ej. 12345678-9).");
        }

        String duiLimpio = propietario.getDui().trim();

        // Criterio 2: Validar que el DUI sea único en la base de datos
        if (propietarioRepository.existsByDui(duiLimpio)) {
            throw new IllegalStateException("Ya existe un propietario registrado con el DUI: " + duiLimpio);
        }

        propietario.setDui(duiLimpio);
        propietario.setNombres(propietario.getNombres().trim());
        propietario.setApellidos(propietario.getApellidos().trim());
        propietario.setTelefono(propietario.getTelefono().trim());
        propietario.setDireccion(propietario.getDireccion().trim());
        if (propietario.getCorreo() != null) {
            propietario.setCorreo(propietario.getCorreo().trim());
        }

        // Criterio 3: Persistir y retornar con el ID autogenerado
        return propietarioRepository.save(propietario);
    }
}