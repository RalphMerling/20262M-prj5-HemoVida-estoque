pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        APP_NAME = 'hemovida-estoque'
    }

    stages {

        stage('Checkout GitHub') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/RalphMerling/20262M-prj5-HemoVida-estoque.git'
                    ]]
                ])
            }
        }

        stage('Fetch Secrets - Infisical') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'tokenralphhemovida',
                        variable: 'INFISICAL_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        set -eu
                        umask 077

                        rm -f .env

                        npx -y @infisical/cli export \
                            --env="dev" \
                            --path="/hemovida" \
                            --token="$INFISICAL_TOKEN" \
                            > .env

                        test -s .env || {
                            echo "ERRO: Arquivo .env não foi gerado."
                            exit 1
                        }

                        echo "Secrets carregados com sucesso."
                    '''
                }
            }
        }

        stage('Validar Docker Compose') {
            steps {
                sh '''
                    set -eu

                    docker compose config --quiet

                    echo "Docker Compose validado."
                '''
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                sh '''
                    set -eu

                    docker compose build

                    echo "Imagem Docker construída."
                '''
            }
        }

        stage('Deploy Docker') {
            steps {
                sh '''
                    set -eu

                    docker compose up -d --no-build \
                        --force-recreate

                    echo "Deploy executado."
                '''
            }
        }

        stage('Verificar Container') {
            steps {
                sh '''
                    set -eu

                    echo "Verificando container..."

                    sleep 10

                    RUNNING=$(docker inspect \
                        --format '{{.State.Running}}' \
                        "$APP_NAME")

                    if [ "$RUNNING" != "true" ]; then
                        echo "ERRO: Container não está rodando."

                        docker compose logs --tail=50 \
                            "$APP_NAME" || true

                        exit 1
                    fi

                    echo "Container em execução."
                    docker compose ps

                    echo "Versão do Node.js no container:"
                    docker exec "$APP_NAME" node -v
                '''
            }
        }
    }

    post {

        success {
            echo '''
            ====================================
             HEMOVIDA ESTOQUE
             DEPLOY EXECUTADO COM SUCESSO
             PORTA: 7503
            ====================================
            '''
        }

        failure {
            echo '''
            ====================================
             HEMOVIDA ESTOQUE
             FALHA NA EXECUÇÃO DO PIPELINE
            ====================================
            '''
        }

        // always {
        //     sh '''
        //         set +x
        //         rm -f .env
        //     '''
        // }
    }
}
