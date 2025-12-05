# Dashboards Importados para Grafana

En esta carpeta encontrarás archivos JSON de dashboards listos para importar en Grafana.


## Directorios requeridos

Asegúrate de que existan los siguientes directorios antes de ejecutar Docker Compose para Grafana:

- `DonarApp/grafana/`
- `DonarApp/grafana/provisioning/`
- `DonarApp/grafana/provisioning/datasources/`
- `DonarApp/grafana/provisioning/dashboards-imports/`
- `fontnd-donarApp/`
- `fontnd-donarApp/frontend`

Si no existen, créalos manualmente para evitar errores de montaje o configuración.

## ¿Cómo importar un dashboard?

1. Ingresa a la interfaz web de Grafana (`http://localhost:3000`).
2. Inicia sesión (usuario: `admin`, contraseña: `admin`).
3. Ve al menú izquierdo → **Dashboards** → **+ Import dashboard**.
4. Selecciona el archivo JSON que deseas importar desde esta carpeta.
5. Elige la fuente de datos (debe ser `Prometheus`).
6. Haz clic en **Import**.

## Sugerencias y posibles errores

- **Error: No data source named Prometheus**
  - Solución: Verifica que Prometheus esté configurado como fuente de datos en Grafana. Si no aparece, agrega la data source manualmente o revisa la configuración de provisioning.

- **Error: No data shown in dashboard**
  - Solución: Asegúrate de que el backend y Prometheus estén corriendo y conectados. Verifica en Prometheus (`http://localhost:9090/targets`) que el estado del target esté "UP".

- **Error al importar el JSON**
  - Solución: Verifica que el archivo esté completo y que la versión de Grafana sea compatible. Puedes copiar el contenido del JSON y pegarlo directamente en el campo de importación.

## Recomendación
- Antes de importar, asegúrate que la fuente de datos Prometheus esté conectada y funcionando.
- Puedes crear y exportar tus propios dashboards desde Grafana para compartirlos aquí.

---

revisa la documentación oficial de Grafana: https://grafana.com/docs/grafana/latest/dashboards/export-import/
