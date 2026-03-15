package com.example.demo.common.enums;

public enum InventoryMode {

    STRICT,     // No permite vender sin stock
    WARNING,    // Permite vender pero muestra advertencia
    DISABLED    // No controla inventario

}