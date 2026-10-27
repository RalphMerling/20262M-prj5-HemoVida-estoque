
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
    

        stage('Fazer Deploy') {
            steps {
                script {
                    def appName = 'schoolmanager-gateway'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    sh "docker stop ${appName} || exit 0"
                    sh "docker rm -v ${appName} || exit 0"
                    sh "docker run -d --name ${appName} -p 9517:9517 --env-file .env ${imageTag}"
                }
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
