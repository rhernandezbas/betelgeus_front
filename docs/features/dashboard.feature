Feature: Dashboard de administración
  Como administrador
  Quiero ver un resumen del estado del sistema
  Para monitorear operadores, tickets y asignaciones

  Background:
    Given el usuario está autenticado como admin
    And el Dashboard es accesible en /

  @status:implemented
  Scenario: Ver estadísticas del sistema
    Given el dashboard carga datos de /api/admin/dashboard/stats
    When se renderiza la página
    Then se muestran tarjetas con total operadores, activos y pausados
    And se muestra total de asignaciones y asignaciones de hoy
    And se muestra tickets sin resolver, vencidos y tiempo promedio de respuesta

  @status:implemented
  Scenario: Auto-refresh cada 30 segundos
    Given el dashboard está visible
    When pasan 30 segundos
    Then se recargan automáticamente las estadísticas
    And se actualiza la UI sin recargar la página

  @status:implemented
  Scenario: Pausar sistema completo
    Given el sistema está activo
    When el admin hace clic en "Pausar Sistema"
    And proporciona una razón
    Then se envía POST a /api/system/pause
    And el indicador cambia a "Sistema Pausado"

  @status:implemented
  Scenario: Reanudar sistema
    Given el sistema está pausado
    When el admin hace clic en "Reanudar Sistema"
    Then se envía POST a /api/system/resume
    And el indicador cambia a "Sistema Activo"

  @status:implemented
  Scenario: Ver métricas de operadores
    Given hay operadores con tickets asignados
    When se renderiza la sección de métricas
    Then se muestran barras con tickets por operador
    And se muestra asignaciones actuales, total manejados y sin resolver

  @status:implemented
  Scenario: Resetear contadores de asignación
    Given el admin quiere resetear los contadores
    When hace clic en "Resetear Contadores"
    Then se envía POST a /api/admin/assignment/reset
    And se muestra toast de confirmación

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar contador de reaperturas en tickets
    Given un ticket tiene recreado > 0
    When se muestra en la lista del dashboard
    Then se muestra un Badge con el contador de reaperturas
    And el Badge usa icono RefreshCw de lucide-react

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar indicador de pre-alerta
    Given un ticket tiene pre_alert_sent_at no nulo
    When se muestra en el detalle de ticket
    Then se muestra un indicador "Pre-alerta enviada" con timestamp
