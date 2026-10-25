
FROM jenkins/ssh-agent:latest-jdk21

USER root

# Instala os pacotes necessários para acessar o repositório Docker
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates curl && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg \
      -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc

# Adiciona o repositório oficial do Docker para Debian
RUN echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian trixie stable" \
    > /etc/apt/sources.list.d/docker.list

# Instala somente o Docker CLI
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Prepara o diretório de trabalho do agente Jenkins
RUN mkdir -p /home/jenkins/agent && \
    chown -R jenkins:jenkins /home/jenkins/agent

# Preserva a inicialização SSH da imagem oficial
ENTRYPOINT ["setup-sshd"]
