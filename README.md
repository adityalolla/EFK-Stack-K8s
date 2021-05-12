
# EFK Stack 

For this project we will be using a Linode K8s - Managed control plane kubernetes cluster. 
* Install K8s cluster using Linode v1.18
* Deploy Kubernetes dashboard 
* Use a nodejs web application with express and pino logger library
* Containerize the application from Docker Private repository
* Deploy and manage the application via K8s 
* Use helm to deploy ELK stack 

#### Note : Since we will be using apps that are hosted on a private repo on Docker hub we will be creating a docker registry secret 

```
kubectl create secret docker-registry linode-private --docker-server=docker.io --docker-username=lva
ditya --docker-password=****** --docker-email=adi*******@abc.com
```

### Linode K8s 

Linode offers infrastructure on the cloud for pay per use model. The offer Kubernetes managed service as an offering. We will only be provisioning worker nodes and the control plane is managed by Linode. 

Version : 1.18 
Worker nodes : 80GB, 4GM RAM, 2CPU 

We identify the k8s control plane using the kubeconfig yaml file which is provided by Linode for download. clustername-kubeconfig.yaml 

```
export=/Users/adi/Downloads/uswest-dev-kubeconfig.yaml
kubectl get nodes -o wide 
NAME                          STATUS   ROLES    AGE   VERSION    INTERNAL-IP       EXTERNAL-IP     OS-IMAGE                       KERNEL-VERSION         CONTAINER-RUNTIME
lke26481-38008-609b7f95d279   Ready    <none>   52m   v1.18.18   192.168.200.78    45.56.93.82     Debian GNU/Linux 9 (stretch)   5.10.0-6-cloud-amd64   docker://19.3.15
lke26481-38008-609b7f95f912   Ready    <none>   51m   v1.18.18   192.168.212.115   45.79.107.145   Debian GNU/Linux 9 (stretch)   5.10.0-6-cloud-amd64   docker://19.3.15
lke26481-38008-609b7f961e02   Ready    <none>   51m   v1.18.18   192.168.205.244   45.33.46.79     Debian GNU/Linux 9 (stretch)   5.10.0-6-cloud-amd64   docker://19.3.15
```

### NodeJS Web Application 

We have a simple nodejs app which runs on port 3000 and runs on the container. The application is hosted on my github as docker nodejs web app. This app has also been dockerized and the image is hosted on a private dockerhub repository. To access this image we have already created the docker secret. 

```
kubectl apply -f deployment.yaml 
kubectl logs podname 
{"level":30,"time":"2021-05-12T08:25:53.357Z","pid":1,"hostname":"uswest-node-76cd9748fc-jrkkm","msg":"This is a nodejs app"}
{"level":30,"time":"2021-05-12T08:25:53.358Z","pid":1,"hostname":"uswest-node-76cd9748fc-jrkkm","msg":"The app has been dockerized"}
{"level":30,"time":"2021-05-12T08:25:53.358Z","pid":1,"hostname":"uswest-node-76cd9748fc-jrkkm","msg":"Orchestration will be done by K8s"}
{"level":30,"time":"2021-05-12T08:25:53.358Z","pid":1,"hostname":"uswest-node-76cd9748fc-jrkkm","msg":"Deployment will be setup"}
{"level":30,"time":"2021-05-12T08:25:53.358Z","pid":1,"hostname":"uswest-node-76cd9748fc-jrkkm","msg":"This is to test the ELK stack deployment"}
Server running at http://0.0.0.0:3000/
{"level":30,"time":"2021-05-12T08:25:53.362Z","pid":1,"hostname":"uswest-node-76cd9748fc-jrkkm","msg":"App listening on port 3000"}
```

### EFK Stack 

We want to deploy EFK for collecting and visualizing application data and metrics. Elasticsearch for storage of app data, fluentd which collects and sends data and finally Kibana for visualizing this data. 

* Add metadata to the collected logs 
* Add pod source 
* Format
* Deploy elasticsearch using replicated stateful set
* Helm charts

### ElasticSearch 

Elasticsearch is a search engine for analyzing application, infrastructure and logging data. (A lof more use cases on Elasticsearch). It stores data in json format and relies on indexing to provide minimum latency and support powerful queries. 

* Deploy ES using helm 
* Configure physical storage from Linode for persistence 
* Setup values.yaml 

#### Install : 

We will want to generate a values.yaml file which will contain the custom parameters we want to specify for our installation of elasticsearch. We want to speficy our resource requests and a volume claim template specifying the storage class. 
Values.yaml contains this information and it will dynamically create the needed storage objects in Linode. We can check the K8s dashboard to see the persistent volumes show up. 

```
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -f values.yaml
```



