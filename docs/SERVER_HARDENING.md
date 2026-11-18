# Server Hardening & Operating Setup Guide

This document provides a step-by-step setup guide for configuring an unmanaged Ubuntu 22.04 / 24.04 LTS VPS/Dedicated server from scratch for our production environment.

---

## 1. Initial User Creation & SSH Hardening

Execute as `root` upon first login:

```bash
# Add non-root admin user
adduser adminuser
# Explanation: Creates a new system user named 'adminuser' for daily administration.

# Grant sudo privileges
usermod -aG sudo adminuser
# Explanation: Adds 'adminuser' to the 'sudo' group so they can run administrative commands.

# Set up SSH key directory for adminuser
mkdir -p /home/adminuser/.ssh
# Explanation: Creates the hidden directory for SSH authorization keys.

chmod 700 /home/adminuser/.ssh
# Explanation: Restricts directory permissions so only owner has read/write/execute access.

cp /root/.ssh/authorized_keys /home/adminuser/.ssh/
# Explanation: Copies public SSH key from root to adminuser.

chown -R adminuser:adminuser /home/adminuser/.ssh
# Explanation: Updates file ownership to adminuser.

chmod 600 /home/adminuser/.ssh/authorized_keys
# Explanation: Restricts SSH key permissions to owner read/write only.
```

### SSH Hardening (`/etc/ssh/sshd_config`)

Edit `/etc/ssh/sshd_config` and set the following parameters:

```ini
PermitRootLogin no
PasswordAuthentication no
X11Forwarding no
MaxAuthTries 3
```

Apply SSH changes:
```bash
sudo systemctl restart ssh
# Explanation: Restarts the SSH daemon to apply security config changes immediately.
```

---

## 2. Uncomplicated Firewall (UFW) Setup

```bash
sudo ufw default deny incoming
# Explanation: Blocks all incoming connections by default.

sudo ufw default allow outgoing
# Explanation: Allows server to make outgoing requests (downloads, updates, API calls).

sudo ufw allow 22/tcp
# Explanation: Opens SSH port 22 for administrative logins.

sudo ufw allow 80/tcp
# Explanation: Opens HTTP port 80 for Caddy automatic TLS challenges.

sudo ufw allow 443/tcp
# Explanation: Opens HTTPS port 443 for encrypted web traffic.

sudo ufw enable
# Explanation: Turns on the firewall with configured rules active.
```

---

## 3. Automated Security Updates & Fail2ban

```bash
sudo apt-get update && sudo apt-get install -y unattended-upgrades fail2ban
# Explanation: Updates package metadata and installs automatic security patcher and brute-force prevention tool.

sudo dpkg-reconfigure --priority=low unattended-upgrades
# Explanation: Configures unattended-upgrades to automatically install security updates daily.
```

### Configure Fail2ban (`/etc/fail2ban/jail.local`)

Create `/etc/fail2ban/jail.local`:

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
findtime = 600
bantime = 3600
```

Start Fail2ban:
```bash
sudo systemctl enable fail2ban && sudo systemctl start fail2ban
# Explanation: Enables Fail2ban to start on boot and starts the service immediately.
```

---

## 4. Docker Installation

```bash
# Install dependencies
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repo
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose plugin
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add adminuser to docker group
sudo usermod -aG docker adminuser
```

---

## 5. Security Checklist Audit

- [x] SSH password auth disabled (`PasswordAuthentication no`)
- [x] SSH root login disabled (`PermitRootLogin no`)
- [x] UFW active: Ports 22, 80, 443 only
- [x] Database port `5432` not exposed publicly
- [x] Docker socket access isolated via `docker-socket-proxy` in read-only mode
- [x] Automated security updates active
- [x] Fail2ban SSH jail active
