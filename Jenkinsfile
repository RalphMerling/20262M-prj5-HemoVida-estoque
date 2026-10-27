
pipeline {
    agent any
    stages {
        stage('Verificar Repositório') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: '*/main']], useRemoteConfigs: [[url: 'https://github.com/RalphMerling/20262M-prj5-HemoVida-estoque']]])
            }
        }

        stage('Instalar Dependências') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                script {
                    def appName = 'hemovida-estoque'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    sh "docker build -t ${imageTag} ."
                }
            }
        }
    

        stage('Docker Build') {
            steps {
                sh 'docker build -t hemovida-estoque:1.0 .'
            }
        }

        stage('Verificar Imagem') {
            steps {
                sh 'docker image inspect hemovida-estoque:1.0 --format "{{.Id}}"'
            }
        }
    }

    post {
        success {
            echo 'Pipeline HemoVida executado com sucesso!'
        }

        failure {
            echo 'Falha na execução do pipeline HemoVida.'
        }
    }
}
