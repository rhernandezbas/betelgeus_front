Feature: Panel de administración de WhatsApp
  Como administrador
  Quiero enviar mensajes WhatsApp manualmente y verificar el estado del servicio
  Para comunicarme con operadores y monitorear la integración

  Background:
    Given el usuario está autenticado como admin
    And la página es accesible en /whatsapp

  @status:new
  @changed:2026-03-02
  Scenario: Ver estado de salud del servicio WhatsApp
    Given la página se carga
    When se consulta GET /api/whatsapp/health
    Then se muestra un Badge verde "Conectado" si el servicio está activo
    Or se muestra un Badge rojo "Desconectado" si no responde

  @status:new
  @changed:2026-03-02
  Scenario: Ver configuración WhatsApp de operadores
    Given la página se carga
    When se consulta GET /api/whatsapp/operators/config
    Then se muestra tabla con todos los operadores
    And cada fila muestra: nombre, person_id, número WhatsApp, si está validado
    And operadores sin número configurado se muestran con advertencia

  @status:new
  @changed:2026-03-02
  Scenario: Enviar mensaje de texto directo
    Given el admin selecciona tab "Texto"
    When ingresa número de teléfono y mensaje
    And hace clic en "Enviar"
    Then se envía POST a /api/whatsapp/send/text
    And se muestra toast de éxito o error

  @status:new
  @changed:2026-03-02
  Scenario: Enviar alerta de tickets vencidos
    Given el admin selecciona tab "Alerta Vencidos"
    When selecciona un operador y la lista de tickets
    And hace clic en "Enviar Alerta"
    Then se envía POST a /api/whatsapp/send/overdue-alert
    And se muestra confirmación con nombre del operador y cantidad de tickets

  @status:new
  @changed:2026-03-02
  Scenario: Enviar resumen de fin de turno
    Given el admin selecciona tab "Resumen Turno"
    When selecciona un operador
    And hace clic en "Enviar Resumen"
    Then se envía POST a /api/whatsapp/send/shift-summary

  @status:new
  @changed:2026-03-02
  Scenario: Enviar notificación de asignación
    Given el admin selecciona tab "Asignación"
    When selecciona operador e ingresa datos del ticket
    And hace clic en "Enviar"
    Then se envía POST a /api/whatsapp/send/assignment

  @status:new
  @changed:2026-03-02
  Scenario: Enviar mensaje personalizado
    Given el admin selecciona tab "Personalizado"
    When selecciona operador e ingresa mensaje libre
    And hace clic en "Enviar"
    Then se envía POST a /api/whatsapp/send/custom

  @status:new
  @changed:2026-03-02
  Scenario: Enviar mensaje masivo
    Given el admin selecciona tab "Masivo"
    When selecciona múltiples operadores (máximo 50)
    And ingresa el mensaje
    And hace clic en "Enviar a Todos"
    Then se envía POST a /api/whatsapp/send/bulk
    And se muestra resumen de envíos exitosos y fallidos

  @status:new
  @changed:2026-03-02
  Scenario: Validar configuración de operador
    Given se muestra la tabla de operadores
    When el admin hace clic en "Validar" en un operador
    Then se consulta GET /api/whatsapp/operators/{person_id}/validate
    And se muestra resultado de validación (nombre, número, estado)
