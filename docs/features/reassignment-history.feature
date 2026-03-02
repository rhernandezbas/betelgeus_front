Feature: Historial de reasignaciones mejorado
  Como administrador
  Quiero ver el historial completo de reasignaciones con filtros
  Para auditar cambios de asignación y entender patrones

  Background:
    Given el usuario está autenticado como admin
    And la página es accesible en /reassignment-history

  @status:implemented
  Scenario: Ver historial básico de reasignaciones
    Given existen registros de reasignación
    When se carga la página
    Then se muestra tabla con ticket_id, operadores from/to, razón, fecha

  @status:new
  @changed:2026-03-02
  @reason:Campos nuevos del backend para tracking completo
  Scenario: Mostrar tipo de reasignación con color
    Given existen reasignaciones de diferentes tipos
    When se muestra la tabla
    Then cada fila tiene un Badge de color según reassignment_type:
    And "splynx_sync" se muestra en azul
    And "manual" se muestra en verde
    And "auto_unassign" se muestra en naranja
    And "end_of_shift" se muestra en rojo

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar nombres de operadores
    Given una reasignación tiene from_operator_name y to_operator_name
    When se muestra en la tabla
    Then se muestra el nombre del operador (no solo el ID)

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar estado de notificación
    Given una reasignación tiene notification_sent
    When se muestra en la tabla
    Then se muestra Badge verde con check si se envió notificación
    Or Badge gris con X si no se envió

  @status:new
  @changed:2026-03-02
  Scenario: Filtrar por tipo de reasignación
    Given existen múltiples tipos de reasignación
    When el admin selecciona un tipo en el dropdown de filtro
    Then solo se muestran reasignaciones de ese tipo
    And el filtro tiene opciones: Todos, Manual, Splynx Sync, Auto Desasignar, Fin de Turno

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar campo created_by
    Given una reasignación fue creada por 'system' o un admin
    When se muestra en la tabla
    Then se muestra quién inició la reasignación
