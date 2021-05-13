
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

### Kibana 

Kibana is a data visualization dashboard software for Elasticsearch. It provides visualization capabilities on top of the content indexed on an Elasticsearch cluster. Users can create bar, line and scatter plots, or pie charts and maps on top of large volumes of data.

#### Install : 

```
helm install kibana elastic/kibana
```

We will be creating an ingress for this service, but one way to check the install on localhost is to use kubectl port-forward
```
kubectl get services | grep kibana 
#We can see that the port the service uses is 5601
kubectl port-forward deployment/kibana-kibana 5601 
```
Navigate to localhost:5601 to see the kibana dashboard. 

### Ingress controller : 

Ingress is a k8s component that is used to handle incoming requests to our backend services. There are many ingress controllers that we can use. We will be using nginx ingress controller for our project. The helm chart will dynamically also provision a Linode Nodebalancer. You can check this on the Linode dashboard once installing the chart. 

```
helm repo add stable https://charts.helm.sh/stable 
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx
```

#### Creating the ingress object 

We will use the ingress.yaml file to define our rule and forwarding to the backend service : kibana on the port of the clusterip 
When specifying the hostname in the yaml file, we will need to give the FQDN of the nodebalancer from Linode as IP address will not be accepted. This FQDN you can get from your Linode dashboard under Node balancers. 

To verify Kibana: enter the fqdn in your browser 
PLS NOTE ::: FOR A PROD SETUP, YOU WILL ALSO NEED TO ADD YOUR DOMAIN ROUTES AND THE TLS SECTION TO THE YAML FILE.

### FluentD 

Fluentd is an open source data collector which adds value to collected data such as timestamps, source, hosts etc. We will be using FluentD instead of Logstash in our project. 

#### Install : 

```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install fluentd bitnami/fluentd
```
Fluentd will be deployed on every node in your cluster as a daemonset object. 

The next steps will cover how to setup the fluentd forwarder to collect logs from your application. 

* From the K8s dashboard : http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/#/overview?namespace=default
* You will see a config Map called : fluentd-forwarder-cm
* Edit this config file with the file in the project : fluentd-config.yaml 
* This yaml file defines : fluentd.conf which will be read by the fluent pods in the daemonset. 
* For the config file at a high level : We are adding the container regex **node-app**.log

#### To verify fluentd setup : 

```
kubectl get pods | grep flu 
fluentd-0                                                 1/1     Running   0          24h
fluentd-49rlk                                             1/1     Running   0          9m43s
fluentd-ctrh7                                             1/1     Running   0          10m
fluentd-t7m8s                                             1/1     Running   0          9m21s

kubectl logs fluentd-t7m8s
#You should see your app log messages here 
```

### Elasticsearch setup 

Follow the fluent config to setup elastic search. You will need the FQDN of the Elasticsearch K8s service name : elasticsearch-master.default.svc.local.io 
We will also set up an index name for our app logs. We will then define the JSON parser to extract the needed logs. 

Note : Before adding elasticsearch step, we will print all logs to stdout. That is the reason we can see the logs when doing kubectl logs fluentdpod 
Once elasticsearch is configured all logs are sent to it. Visualization can be done through Kibana. 

### Kibana setup

```
kubectl port-forward deployment/kibana-kibana 5601 &
#Use localhost:5601 to login to kibana dashboard 
```
Once on Kibana -> 
* From the menu on the left hand side -> Management -> Stack management 
* Under index management you should be able to see your index which was defined in the fluentd config file for elasticsearch index_name
* Click on Index Patterns under Kibana 
* Create index pattern 
* Give a name to your pattern and select the index for it 
* Click on the left hand side menu again and go to Discover 
* You will start to see your log files now. 

<img width="1204" alt="Kibana" src="https://user-images.githubusercontent.com/81785727/118116618-54deed80-b39f-11eb-8001-045484f75984.png">

#### Finishing up 

You can always configure different micro services to use different index names, or send all data to app index and then create index patterns or dashboards from once log stream source. 

<img width="1421" alt="Screen Shot 2021-05-13 at 3 59 30 AM" src="https://user-images.githubusercontent.com/81785727/118116859-af784980-b39f-11eb-8d58-9592567b557c.png">

<img width="1080" alt="Screen Shot 2021-05-13 at 4 01 18 AM" src="https://user-images.githubusercontent.com/81785727/118117067-f108f480-b39f-11eb-8634-4cb803c0d0be.png">
