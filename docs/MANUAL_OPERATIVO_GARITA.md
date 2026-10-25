# 🛡️ Manual Operativo de Garita y Control de Acceso
**Sistema CAI v2 - Procedimientos para Personal de Seguridad Física**  
*Documento de Capacitación y Operación Diaria - Fase 5*

---

## 1. Dispositivos de Captura y Métodos de Lectura

La estación de garita soporta tres modalidades de ingreso de identificación:

### A. Pistola Lectora Láser USB (Recomendado para Alto Flujo)
* Conecte el lector USB al terminal de garita. No requiere drivers adicionales (opera como teclado HID).
* Al apuntar al código de barras del carnet o cédula y presionar el gatillo, el sistema emite un pitido de confirmación (`laser beep`) y valida automáticamente a la persona sin necesidad de tocar el teclado ni el ratón.

### B. Cámara Web / PDA Móvil Android
* En dispositivos móviles o puestos de control equipados con cámara, pulse el botón **"Cámara Web"** o toque el icono de la cámara en el campo de búsqueda.
* Enfoque el código QR impreso o mostrado en la pantalla del teléfono del visitante. La lectura se ejecuta automáticamente al enfocar.

### C. Búsqueda Manual por Teclado
* Ingrese la cédula (ej. `V-12345678` o sólo los números `12345678`) y presione **Enter** o el botón **"Validar"**.

---

## 2. Validación de Pases Digitales QR (`CAI2:...`)

Los visitantes autorizados portan un pase digital seguro generado por su anfitrión. Al escanearlo, el sistema valida la firma criptográfica y la vigencia temporal:

| Resultado en Pantalla | Indicador Visual | Sonido | Acción del Guardia |
| :--- | :--- | :--- | :--- |
| **Pase Autorizado y Vigente** | Borde cian/esmeralda, badge `🔒 Pase Firmado (Vence: YYYY-MM-DD)` | Pitido doble ascendente | **Permitir el ingreso.** Si el pase indica placa de vehículo, verificar concordancia física y presionar `REGISTRAR ENTRADA`. |
| **Pase Vencido** | Mensaje rojo: `⛔ PASE DIGITAL EXPIRADO: Este pase venció el...` | Tono de alarma grave | **Denegar el ingreso.** Indicar al visitante que contacte a su anfitrión para emitir un nuevo pase digital actualizado. |
| **Firma Falsificada o Alterada** | Mensaje rojo: `⛔ SEGURIDAD: Firma digital alterada o no reconocida` | Tono de alarma grave | **Denegar el ingreso de inmediato.** Posible intento de falsificación de código QR. Notificar al supervisor de turno. |
| **Persona Vetada / Bloqueada** | Ficha con borde rojo intermitente: `⛔ ACCESO RESTRINGIDO: Bloqueado por orden de RRHH` | Tono de alarma prolongado | **Prohibir el acceso bajo cualquier circunstancia.** Notificar de inmediato al departamento de seguridad y Recursos Humanos. |

---

## 3. Registro de Entradas y Salidas (Anti-Passback)

* **Entrada**: Pulse el botón verde **`REGISTRAR ENTRADA`**. El estado cambiará a `EN INSTALACIONES`.
* **Salida**: Pulse el botón naranja **`REGISTRAR SALIDA`**. El estado cambiará a `FUERA`.
* **Protección Anti-Passback**: El sistema previene fraudes impidiendo registrar dos entradas consecutivas sin una salida intermedia, o una salida de quien no figure dentro del recinto.

---

## 4. Conducta ante Pérdida de Conexión (Modo Offline)

Si la red local experimenta fallas, aparecerá el banner superior rojo:  
`⚠️ Modo Sin Conexión: Sin enlace con el servidor de garita.`

* **¿Qué sigue funcionando?**:
  * La pistola láser y la cámara continúan leyendo y validando la firma y fecha de caducidad de los pases digitales locales `CAI2:...`.
* **Protocolo de contingencia**:
  1. Pulse el botón **"Reconectar"** en el banner.
  2. Si el servidor de garita sigue apagado, registre las novedades en la bitácora física de respaldo.
  3. Al restablecerse el servidor, el banner se ocultará automáticamente.

---

## 5. Protocolo de Evacuación de Emergencia (Roll Call)

En caso de conato de incendio, sismo o desalojo general:

1. Presione el botón rojo **`Evacuación`** (icono de llama) ubicado en la esquina superior de la garita.
2. Se desplegará la lista en tiempo real de **todo el personal y visitantes presentes en las instalaciones**.
3. Pulse **`Exportar Acta`** o **`Imprimir Acta`** para obtener el documento legal con totales de empleados y visitantes para los cuerpos de bomberos y brigadas de rescate.
