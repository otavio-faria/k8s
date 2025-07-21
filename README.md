# FastTech Foods - Kubernetes Deployment Guide

## 🏗️ Arquitetura da Solução

Sistema de microsserviços para rede de fast food com foco em escalabilidade, observabilidade e automação.

### Microsserviços
- **AuthService** (Porta 30001) - Autenticação de funcionários
- **MenuService** (Porta 30002) - Gestão do cardápio  
- **SearchService** (Porta 30003) - Busca e filtros de produtos
- **OrderService** (Porta 30004) - Gestão de pedidos

### Dependências
- **MongoDB** - Banco de dados NoSQL (usando `mongodb-simple.yaml` para melhor compatibilidade)
- **RabbitMQ** (Porta 30672) - Mensageria entre serviços
- **Prometheus** (Porta 30090) - Coleta de métricas
- **Grafana** (Porta 30300) - Visualização de métricas

### ℹ️ Versões do MongoDB

- **`mongodb.yaml`** - Versão com PersistentVolume (para produção)
- **`mongodb-simple.yaml`** - Versão simplificada com emptyDir (recomendada para desenvolvimento/teste)

## 🚀 Pré-requisitos

- Kubernetes (Minikube, Kind, Docker Desktop ou cluster)
- kubectl configurado
- k6 (para testes de carga)

### Instalação do k6

**Linux/Mac:**
```bash
brew install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

## 📋 Deployment Completo

### Parte 1: Limpar recursos anteriores (se necessário)

```bash
kubectl delete namespace fasttech-foods --ignore-not-found
```

Aguarde a exclusão completa:
```bash
kubectl wait --for=delete namespace/fasttech-foods --timeout=60s
```

### Parte 2: Implantação inicial

1. **Criar namespace**
```bash
kubectl apply -f namespace.yaml
```

2. **Aplicar ConfigMap**
```bash
kubectl apply -f configmap.yaml
```

3. **Implantar MongoDB (versão simplificada)**
```bash
kubectl apply -f mongodb-simple.yaml
```

4. **Implantar RabbitMQ**
```bash
kubectl apply -f rabbitmq.yaml
```

5. **Aguardar MongoDB e RabbitMQ estarem prontos**
```bash
kubectl wait --for=condition=ready pod -l app=mongodb -n fasttech-foods --timeout=120s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n fasttech-foods --timeout=120s
```

6. **Implantar microsserviços**
```bash
kubectl apply -f authservice.yaml
kubectl apply -f menuservice.yaml
kubectl apply -f searchservice.yaml
kubectl apply -f orderservice.yaml
```

### Parte 3: Configurar Auto-Scaling (HPA)

1. **Verificar se o Metrics Server está instalado**
```bash
kubectl get deployment metrics-server -n kube-system
```
Para clusters padrão:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

2. **Aplicar HPAs**
```bash
kubectl apply -f authservice-hpa.yaml
kubectl apply -f menuservice-hpa.yaml
kubectl apply -f searchservice-hpa.yaml
kubectl apply -f orderservice-hpa.yaml
```

3. **Verificar status dos HPAs**
```bash
kubectl get hpa -n fasttech-foods
```

### Parte 4: Observabilidade (Prometheus + Grafana)

1. **Configurar Prometheus**
```bash
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus.yaml
```

2. **Configurar Grafana**
```bash
kubectl apply -f grafana-config.yaml
kubectl apply -f grafana.yaml
```

3. **Aguardar serviços estarem prontos**
```bash
kubectl wait --for=condition=ready pod -l app=prometheus -n fasttech-foods --timeout=60s
kubectl wait --for=condition=ready pod -l app=grafana -n fasttech-foods --timeout=60s
```

## 🌐 Acessos aos Serviços

### APIs dos Microsserviços
- **AuthService**: http://localhost:30001
- **MenuService**: http://localhost:30002
- **SearchService**: http://localhost:30003
- **OrderService**: http://localhost:30004

### Observabilidade
- **Prometheus**: http://localhost:30090
- **Grafana**: http://localhost:30300
  - 👤 Usuário: `admin` | Senha: `admin`

### Mensageria
- **RabbitMQ Management**: http://localhost:30672
  - 👤 Usuário: `admin` | Senha: `password123`

## 🧪 Executar Teste de Carga

1. **Monitorar Auto-Scaling** (abrir terminais separados)

Terminal 1 - Monitorar HPAs:
```bash
kubectl get hpa -n fasttech-foods -w
```

Terminal 2 - Monitorar Pods:
```bash
kubectl get pods -n fasttech-foods -w
```

2. **Executar teste de carga**
```bash
k6 run stress-test.js
```

3. **Usar Docker (alternativa)**
```bash
docker run --rm -i grafana/k6 run - <stress-test.js
```

## 📊 Verificação e Monitoramento

1. **Verificar todos os pods**
```bash
kubectl get pods -n fasttech-foods
```

2. **Verificar serviços**
```bash
kubectl get services -n fasttech-foods
```

3. **Verificar auto-scaling**
```bash
kubectl get hpa -n fasttech-foods
```

4. **Ver logs específicos**
```bash
kubectl logs -l app=authservice -n fasttech-foods --tail=50
kubectl logs -l app=searchservice -n fasttech-foods --tail=50
```

5. **Verificar métricas de recursos**
```bash
kubectl top pods -n fasttech-foods
kubectl top nodes
```

## 🔧 Comandos Úteis

### Restart de serviços
```bash
kubectl rollout restart deployment authservice -n fasttech-foods
kubectl rollout restart deployment searchservice -n fasttech-foods
```

### Port Forward (acesso local)
```bash
kubectl port-forward svc/authservice -n fasttech-foods 8001:80
kubectl port-forward svc/grafana -n fasttech-foods 3000:3000
```

### Escalar manualmente
```bash
kubectl scale deployment authservice --replicas=5 -n fasttech-foods
```

### Verificar eventos
```bash
kubectl get events -n fasttech-foods --sort-by='.lastTimestamp'
```

## 🛑 Limpeza Completa

```bash
# Deletar todos os recursos
kubectl delete -f authservice-hpa.yaml -f menuservice-hpa.yaml -f searchservice-hpa.yaml -f orderservice-hpa.yaml
kubectl delete -f authservice.yaml -f menuservice.yaml -f searchservice.yaml -f orderservice.yaml
kubectl delete -f prometheus.yaml -f grafana.yaml -f grafana-config.yaml -f prometheus-config.yaml
kubectl delete -f rabbitmq.yaml -f mongodb-simple.yaml
kubectl delete -f configmap.yaml
kubectl delete namespace fasttech-foods
```

## 🚨 Solução de Problemas

### Auto-Scaling não funciona
1. Verificar Metrics Server:
```bash
kubectl top pods -n fasttech-foods
```

2. Verificar HPAs:
```bash
kubectl describe hpa -n fasttech-foods
```

### Pods não inicializam
1. Verificar logs:
```bash
kubectl describe pod [nome-do-pod] -n fasttech-foods
kubectl logs [nome-do-pod] -n fasttech-foods
```

### Prometheus não coleta métricas
1. Verificar configuração:
```bash
kubectl port-forward svc/prometheus -n fasttech-foods 9090:9090
```
Acesse http://localhost:9090/targets

### Grafana sem dashboards
1. Reiniciar Grafana:
```bash
kubectl rollout restart deployment grafana -n fasttech-foods
```

## 📈 Métricas de Sucesso

- ✅ Todos os pods em estado `Running`
- ✅ HPAs mostrando métricas de CPU/Memory
- ✅ Prometheus coletando métricas dos serviços
- ✅ Grafana exibindo dashboards
- ✅ Auto-scaling funcionando durante teste de carga
- ✅ Resposta < 500ms nos endpoints principais