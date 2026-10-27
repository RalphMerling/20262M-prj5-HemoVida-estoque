
pipeline {
    agent any
    stages {
        stage('Verificar Repositório') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: '*/main']], useRemoteConfigs: [[url: 'https://github.com/RalphMerling/20262M-prj5-HemoVida-estoque']]])
            }
        }

        stage('Fetch Secrets') {
            steps {
                sh 'npx -y @infisical/cli export --env="dev" --path="/quarto" --token="st.0f20435c-cc8b-4f06-8409-66d5cf392ad3.161752b8e21c58feeeba8cb68067cd37.a9504cd622815cea2d12e004cbf37e42" > .env'
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
                    def appName = 'hemovida-estoque'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    sh "docker stop ${appName} || exit 0"
                    sh "docker rm -v ${appName} || exit 0"
                    sh "docker run -d --name ${appName} -p 7503:7503 --env-file .env ${imageTag}"
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
