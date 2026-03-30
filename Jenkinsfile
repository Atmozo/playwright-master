pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.48.0-jammy'
            args '-u root:root'
        }
    }

    environment {
        NODE_ENV = 'test'
    }

    stages {

        stage('Install') {
            steps {
                sh '''
                    npm ci
                    npx playwright install --with-deps chromium
                '''
            }
        }

        stage('Test') {
            steps {
                withCredentials([string(credentialsId: 'openweather-api-key', variable: 'OPENWEATHER_API_KEY')]) {
                    sh '''
                        echo "Running tests with API key..."
                        export OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
                        npx playwright test
                    '''
                }
            }
        }

        stage('Report') {
            steps {
                publishHTML([
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Report',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: true
                ])
            }
        }
    }

    post {
        success {
            echo ' Pipeline passed!'
        }
        failure {
            echo ' Pipeline failed!'
        }
    }
}
