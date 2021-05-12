
# ELK Stack 

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

