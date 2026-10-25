
pipeline {
    agent {
        label 'hemovida'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
