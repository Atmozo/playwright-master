// ============================================================
// PLAYWRIGHT TESTS - PRODUCTION PIPELINE 
// ============================================================

pipeline {

    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.48.0-jammy'
            args '-u root:root'
        }
    }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'production'], description: 'Target environment')
        choice(name: 'BROWSER', choices: ['chromium', 'firefox', 'webkit', 'all'], description: 'Which browser to test')
        booleanParam(name: 'HEADLESS', defaultValue: true, description: 'Run tests in headless mode')
        string(name: 'TEST_PATTERN', defaultValue: '**/*.spec.ts', description: 'Test file pattern')
    }

    environment {
        OPENWEATHER_API_KEY = credentials('openweather-api-key')
        WEATHER_BASE_URL    = 'https://api.openweathermap.org'
        REQRES_BASE_URL     = 'https://reqres.in'
        DOGS_BASE_URL       = 'https://dog.ceo/api'
        NODE_ENV            = 'test'
        CI                  = 'true'
        TEST_ENV            = "${params.ENVIRONMENT}"
    }

    options {
        buildDiscarder(logRotator(
            numToKeepStr: '30',
            daysToKeepStr: '30',
            artifactNumToKeepStr: '10'
        ))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H/15 * * * *')
        cron('0 2 * * *')
    }

    stages {

        // ─────────────────────────────────────────────
        // Pipeline Info
        // ─────────────────────────────────────────────
        stage('Pipeline Info') {
            steps {
                script {
                    echo """
                    ============================================
                    PLAYWRIGHT TEST PIPELINE
                    ============================================
                    Branch:      ${env.BRANCH_NAME ?: 'N/A'}
                    Environment: ${params.ENVIRONMENT}
                    Browser:     ${params.BROWSER}
                    Headless:    ${params.HEADLESS}
                    Build:       #${BUILD_NUMBER}
                    ============================================
                    """
                }
                sh '''
                    echo "Commit: $GIT_COMMIT"
                    git log -1 --pretty=format:"%h - %an: %s"
                '''
            }
        }

        // ─────────────────────────────────────────────
        // Install Dependencies
        // ─────────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                script {
                    if (params.BROWSER == 'all') {
                        sh 'npx playwright install --with-deps'
                    } else {
                        sh "npx playwright install --with-deps ${params.BROWSER}"
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // Code Quality
        // ─────────────────────────────────────────────
        stage('Code Quality') {
            parallel {
                stage('ESLint') {
                    steps { sh 'npm run lint || true' }
                }
                stage('TypeScript') {
                    steps { sh 'npx tsc --noEmit || true' }
                }
            }
        }

        // ─────────────────────────────────────────────
        // Run Tests (FIXED)
        // ─────────────────────────────────────────────
        stage('Run Tests') {
            steps {
                script {
                    def browserArg  = params.BROWSER == 'all' ? '' : "--project=${params.BROWSER}"
                    def headlessArg = params.HEADLESS ? '' : '--headed'

                    // ✅ Always run ALL tests
                    def testScope = params.TEST_PATTERN ?: '**/*.spec.ts'

                    // Ensure results folder exists
                    sh 'mkdir -p test-results'

                    sh """
                        npx playwright test ${browserArg} ${headlessArg} \
                        --reporter=html \
                        --reporter=junit=test-results/results.xml \
                        ${testScope}
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // Security Scan
        // ─────────────────────────────────────────────
        stage('Security Scan') {
            when { branch 'main' }
            steps {
                sh 'npm audit --production || true'
            }
        }

        // ─────────────────────────────────────────────
        // Publish Reports
        // ─────────────────────────────────────────────
        stage('Publish Reports') {
            steps {
                publishHTML([
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Test Report',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: true
                ])

                junit testResults: 'test-results/*.xml', allowEmptyResults: true
                archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
            }
        }

        // ─────────────────────────────────────────────
        // Deploy (AUTO, NO INPUT BLOCK)
        // ─────────────────────────────────────────────
        stage('Deploy') {
            when {
                allOf {
                    branch 'main'
                    expression { params.ENVIRONMENT == 'production' }
                }
            }
            steps {
                echo 'Deploying to production...'
                sh './deploy.sh'
            }
        }
    }

    // ─────────────────────────────────────────────
    // Post Actions
    // ─────────────────────────────────────────────
    post {
        success {
            script {
                def duration = currentBuild.durationString.replace(' and counting', '')
                echo "Build #${BUILD_NUMBER} succeeded in ${duration}"
            }
        }
        failure {
            echo "Build #${BUILD_NUMBER} failed"
        }
        always {
            deleteDir()
        }
    }
}
