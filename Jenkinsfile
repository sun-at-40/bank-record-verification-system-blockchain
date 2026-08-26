pipeline {
    agent any

    environment {
        // You can define environment variables here
        DOCKER_IMAGE_BACKEND = 'bank-registry-backend'
        DOCKER_IMAGE_FRONTEND = 'bank-registry-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout source code from SCM
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    script {
                        docker.build("${DOCKER_IMAGE_BACKEND}:${env.BUILD_ID}")
                    }
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    script {
                        docker.build("${DOCKER_IMAGE_FRONTEND}:${env.BUILD_ID}")
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                // This assumes docker-compose is installed on the Jenkins agent
                // and you have a docker-compose.yml file in the repository root.
                sh 'docker-compose down'
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished!'
        }
        success {
            echo 'Build and Deployment Successful!'
        }
        failure {
            echo 'Pipeline failed. Check logs.'
        }
    }
}
