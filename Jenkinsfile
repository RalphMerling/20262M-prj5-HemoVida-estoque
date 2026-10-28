pipeline {
    agent any

    stages {

        stage('Verificar Repositório') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/RalphMerling/20262M-prj5-HemoVida-estoque'
                    ]]
                ])
            }
        }

        stage('Fetch Secrets') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'tokenralphhemovida',
                        variable: 'INFISICAL_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        npx -y @infisical/cli export \
                            --env="prod" \
                            --path="/hemovida" \
                            --token="$INFISICAL_TOKEN" > .env
                    '''
                }
            }
        }

        stage('Instalar Dependências') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Prisma Generate') {
            steps {
                sh 'npx prisma generate'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Docker Up') {
            steps {
                sh 'docker compose up -d'
            }
        }

        stage('Docker PS') {
            steps {
                sh 'docker compose ps'
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

        always {
            sh 'rm -f .env'
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

    post {
        success {
            echo 'Pipeline HemoVida executado com sucesso!'
        }

        failure {
            echo 'Falha na execução do pipeline HemoVida.'
        }
    }
