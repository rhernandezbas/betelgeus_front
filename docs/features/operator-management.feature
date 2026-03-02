Feature: Gestión de operadores
  Como administrador
  Quiero gestionar operadores, sus horarios y estados
  Para controlar la asignación de tickets y notificaciones

  Background:
    Given el usuario está autenticado como admin
    And la página es accesible en /operators-management

  @status:implemented
  Scenario: Listar operadores con estado
    Given existen operadores configurados
    When se carga la página
    Then se muestran tarjetas de operador con nombre, person_id, WhatsApp
    And se muestra estado: activo, pausado total, pausado asignaciones
    And se muestra si notificaciones están habilitadas

  @status:implemented
  Scenario: Pausar operador completamente
    Given existe un operador activo
    When el admin hace clic en "Pausar" y proporciona razón
    Then se envía POST a /api/admin/operators/{id}/pause
    And la tarjeta muestra estado "Pausado" con razón y timestamp

  @status:implemented
  Scenario: Pausar solo asignaciones
    Given existe un operador activo
    When el admin pausa solo asignaciones
    Then assignment_paused = true pero is_paused = false
    And el operador no recibe nuevos tickets pero mantiene los actuales

  @status:implemented
  Scenario: Reanudar operador
    Given existe un operador pausado
    When el admin hace clic en "Reanudar"
    Then se envía POST a /api/admin/operators/{id}/resume
    And el operador vuelve a estado activo

  @status:implemented
  Scenario: Gestionar horarios del operador
    Given se abre el dialog de configuración del operador
    When el admin configura horarios por día y tipo (work/assignment/alert)
    Then se crean/actualizan en /api/admin/schedules
    And se muestran los 3 tipos de horario organizados por tabs
