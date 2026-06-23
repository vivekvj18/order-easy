package com.ordereasy.inventory_service.controller;

import com.ordereasy.inventory_service.entity.DarkStore;
import com.ordereasy.inventory_service.repository.DarkStoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only controller for dark store information.
 * Useful for admin dashboards and delivery assignment.
 */
@RestController
@RequestMapping("/dark-stores")
@RequiredArgsConstructor
public class DarkStoreController {

    private final DarkStoreRepository darkStoreRepository;

    @GetMapping
    public List<DarkStore> getAllDarkStores() {
        return darkStoreRepository.findAll();
    }

    @GetMapping("/active")
    public List<DarkStore> getActiveDarkStores() {
        return darkStoreRepository.findByActiveTrueAndLatitudeBetweenAndLongitudeBetween(
                -90.0, 90.0, -180.0, 180.0
        );
    }
}
