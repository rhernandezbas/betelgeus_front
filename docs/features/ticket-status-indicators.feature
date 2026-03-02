Feature: Indicadores de estado de tickets (reopen y pre-alerta)
  Como administrador
  Quiero ver el estado de reapertura y pre-alertas en las vistas de tickets
  Para entender el ciclo de vida completo del ticket

  Background:
    Given el usuario está autenticado como admin

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar contador de reaperturas en dashboard
    Given un ticket tiene campo recreado > 0
    When se muestra en la lista de tickets del dashboard
    Then se muestra Badge con icono RefreshCw y número de reaperturas
    And el Badge tiene tooltip "Reabierto X veces"

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar número de ticket GR
    Given un ticket tiene numero_ticket_gr
    When se muestra en el detalle del ticket
    Then se muestra "Ticket GR #[numero]" como campo informativo

  @status:new
  @changed:2026-03-02
  Scenario: Mostrar indicador de pre-alerta enviada
    Given un ticket tiene pre_alert_sent_at no nulo
    When se muestra en el detalle del ticket
    Then se muestra icono Clock con texto "Pre-alerta enviada" y timestamp
