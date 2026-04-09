#!/usr/bin/env groovy

// ============================================================
// 📨 KAFKA PUBLISHER - Jenkins Shared Library
// ============================================================

def call(Map config) {
    def topic = config.topic ?: 'jenkins-events'
    def event = config.event ?: [:]
    
    // Add Jenkins metadata
    event.jenkinsUrl = env.JENKINS_URL
    event.jobName = env.JOB_NAME
    event.buildNumber = env.BUILD_NUMBER
    event.buildUrl = env.BUILD_URL
    event.timestamp = new Date().format("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    
    // Publish to Kafka using kafkacat
    sh """
        echo '${groovy.json.JsonOutput.toJson(event)}' | \
        docker exec -i kafka kafka-console-producer \
          --bootstrap-server localhost:9092 \
          --topic ${topic}
    """
    
    echo "📨 Published to ${topic}: ${event.type}"
}

return this
