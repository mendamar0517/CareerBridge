# Лаборатори 09 — Minikube орчинд Deployment, Service үүсгэх

F.CSA316 · 10-р долоо хоног · CLO4 · Баг 11

## Зорилго

1. Minikube локал Kubernetes cluster эхлүүлэх
2. Deployment, Service YAML файл бие даан бичиж хэрэгжүүлэх
3. `kubectl` командаар cluster-ийн байдлыг шалгах, оношлох

## Файлууд

| Файл | Агуулга |
| --- | --- |
| [`k8s/deployment.yaml`](../k8s/deployment.yaml) | 3 replica, `ghcr.io/mendamar0517/careerbridge:latest`, readiness/liveness probe (`/health`), resource limit, root бус хэрэглэгч |
| [`k8s/service.yaml`](../k8s/service.yaml) | `NodePort`: 80 → Pod 3000, гаднаас `30080` |

Image нь Лаб 07–08-д CI-ээр бүтээгдэж GHCR-д public байдлаар хадгалагдсан. Мөн `amd64`, `arm64` хоёр хувилбартай тул Apple Silicon Mac дээрх Minikube шууд татна.

## Урьдчилсан бэлтгэл (macOS)

```bash
brew install minikube kubectl     # суугаагүй бол
minikube version
kubectl version --client
```

## Алхам ба командууд

| № | Алхам | Команд | Хүлээгдэх үр дүн |
| --- | --- | --- | --- |
| 1 | Minikube эхлүүлэх | `minikube start --driver=docker` | `Done! kubectl is now configured…` |
| 2 | Cluster шалгах | `kubectl get nodes` | `minikube   Ready   control-plane` |
| 3 | Deployment YAML | `k8s/deployment.yaml` | `replicas: 3` |
| 4 | Deployment хэрэгжүүлэх | `kubectl apply -f k8s/deployment.yaml` | `deployment.apps/careerbridge-api created` |
| 5 | Pod шалгах | `kubectl get pods -l app=careerbridge-api` | 3 Pod `1/1 Running` |
| 6 | Service YAML + хэрэгжүүлэх | `kubectl apply -f k8s/service.yaml` | `service/careerbridge-api created` |
| 7 | Self-healing | доорх хэсгийг үзнэ үү | Устгасан Pod-ийн оронд шинэ Pod |
| 8 | Апп руу хандах | `minikube service careerbridge-api --url` | `http://127.0.0.1:xxxxx` → `/health` |

### 4–5. Deployment ба Pod

```bash
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/careerbridge-api     # successfully rolled out
kubectl get deployment careerbridge-api                # READY 3/3
kubectl get pods -l app=careerbridge-api -o wide       # 3 Pod, Running
```

### 6, 8. Service ба апп руу хандах

```bash
kubectl apply -f k8s/service.yaml
kubectl get service careerbridge-api                   # TYPE NodePort, 80:30080/TCP
minikube service careerbridge-api --url                # Mac (docker driver): терминал нээлттэй байх ёстой
```

Хэвлэгдсэн URL-ийг шинэ терминалд ашиглана:

```bash
URL=http://127.0.0.1:xxxxx                            # дээрх командын гаралт
curl $URL/health
# {"status":"ok","service":"careerbridge-api","version":"0.3.0","instance":"careerbridge-api-xxxxx-yyyyy",…}

# Хүсэлт аль Pod-д очсоныг харах (instance = Pod-ийн нэр)
for i in $(seq 1 10); do curl -s $URL/health | sed 's/.*"instance":"\([^"]*\)".*/\1/'; done | sort | uniq -c
```

Mac дээрх `minikube service` tunnel нь нэг холболтыг ихэвчлэн нэг Pod руу чиглүүлдэг. Тиймээс бүх хүсэлт нэг Pod-д очиж болно. Cluster доторх ачааллын хуваарилалтыг CI-ийн `k8s` job NodePort-оор харуулна.

Энэ Лабд өгөгдлийн сан ашиглахгүй. Тиймээс `/health/db` нь `503` буцаана, энэ нь хэвийн.

### 7. Self-healing туршилт

**Терминал 1:** Pod-уудыг тасралтгүй ажиглана.

```bash
kubectl get pods -l app=careerbridge-api -w
```

**Терминал 2:** нэг Pod-ийг устгана.

```bash
kubectl get pods -l app=careerbridge-api
kubectl delete pod <pod-name>
kubectl get pods -l app=careerbridge-api                # шинэ нэртэй Pod (AGE хэдхэн секунд), нийт 3
kubectl describe deployment careerbridge-api | tail -5  # ReplicaSet-ийн event
```

Хүлээгдэх үр дүн: устгасан Pod `Terminating` төлөвт орж, түүний оронд Deployment (ReplicaSet) шинэ Pod үүсгэнэ. Шинэ Pod `ContainerCreating` → `Running` болж, нийт тоо 3 болж сэргэнэ.

### Цэвэрлэх

```bash
kubectl delete -f k8s/
minikube stop
```

## CI дээрх баталгаажуулалт

`.github/workflows/ci.yml`-ийн `k8s` job PR болон `main` бүр дээр [kind](https://kind.sigs.k8s.io/) cluster үүсгэж дараах шалгалтуудыг хийнэ:

1. `kubeconform`-оор manifest-уудын схемийг шалгана (Kubernetes 1.31).
2. Тухайн commit-ийн кодоор image бүтээж cluster-т ачаална.
3. `kubectl apply -f k8s/` хийгээд rollout дуустал хүлээнэ. `readyReplicas = 3` эсэхийг шалгана.
4. NodePort 30080-оор `/health`-д 10 хүсэлт илгээж, аль Pod-д очсоныг тоолно.
5. Нэг Pod-ийг устгаж, шинэ Pod үүсэн 3/3 Ready болохыг шалгана (self-healing).

## Хүлээлгэж өгөх зүйл (deliverable)

- [x] `k8s/deployment.yaml` (3 replica)
- [x] `k8s/service.yaml`
- [ ] Screenshot 1: `kubectl apply` + `kubectl get pods`, 3 Pod `Running`
- [ ] Screenshot 2: Pod устгасны дараа шинэ Pod үүссэн байдал
