
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
                sh 'npx -y @infisical/cli export --env="dev" --path="/hemovida" --token="st.0ffee575-a9ce-42aa-98be-e1b771c34e1c.4f5c640a4524bd30c8a98522decb4019.4f3697b54407b5addb96d086f54d10a5" > .env'
            }
        }

        stage('Instalar Dependências') {
            steps {
                sh 'npm install'
            }
        }

         stage('Prisma Generate') {

            steps {

                sh 'npx prisma generate'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                script {
                    def appName = 'hemovida-estoque'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    sh 'docker compose build'
                }
            }
        }
    

        // stage('Fazer Deploy') {
        //     steps {
        //         script {
        //             def appName = 'hemovida-estoque'
        //             def imageTag = "${appName}:${env.BUILD_ID}"

        //             sh "docker stop ${appName} || exit 0"
        //             sh "docker rm -v ${appName} || exit 0"
        //             sh "docker run -d --name ${appName} -p 7503:7503 --env-file .env ${imageTag}"
        //         }
        //     }
        // }

        stage('Docker Up') {

            steps {

                sh 'docker compose up -d'
            }
        }

        stage('Docker PS') {

            steps {

                sh 'node -v'
                sh 'npm -v'
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
