FROM grafana/grafana:latest
# Puedes agregar plugins o configuraciones personalizadas aquí
# Ejemplo para instalar un plugin:
# RUN grafana-cli plugins install grafana-piechart-panel
COPY grafana.ini /etc/grafana/grafana.ini
COPY provisioning/datasources/prometheus.yaml /etc/grafana/provisioning/datasources/prometheus.yaml
