<?php
session_start();

// Temporäre Lösung: Passwort direkt vergleichen (nur für Tests!)
// In Produktionsumgebung sollte Hashing verwendet werden
$correct_password = '!let*me*in!';

// In der Produktionsumgebung sollte das Passwort aus einer sicheren Konfigurationsdatei oder Umgebungsvariable geladen werden
// $correct_password_hash = $_ENV['LOGIN_PASSWORD_HASH'] ?? '';

$error_message = "";
$login_attempts = $_SESSION['login_attempts'] ?? 0;
$last_attempt_time = $_SESSION['last_attempt_time'] ?? 0;

// Rate Limiting: Max 5 Versuche alle 15 Minuten
if ($login_attempts >= 5 && (time() - $last_attempt_time) < 900) {
    $error_message = "Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.";
} elseif ($_POST && isset($_POST['password'])) {
    $entered_password = $_POST['password'];
    
    // Reset counter nach 15 Minuten
    if ((time() - $last_attempt_time) >= 900) {
        $_SESSION['login_attempts'] = 0;
    }
    
    if ($entered_password === $correct_password) {
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        // Reset login attempts nach erfolgreichem Login
        unset($_SESSION['login_attempts']);
        unset($_SESSION['last_attempt_time']);
        
        // Regenerate Session ID für Sicherheit
        session_regenerate_id(true);
        
        header('Location: main.php');
        exit;
    } else {
        $_SESSION['login_attempts'] = $login_attempts + 1;
        $_SESSION['last_attempt_time'] = time();
        $error_message = "Falsches Passwort. Bitte versuchen Sie es erneut.";
        
        // Logging für Sicherheitszwecke (in Produktionsumgebung in Log-Datei)
        error_log("Failed login attempt from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefanie & René – Hochzeitsalbum</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    <style>
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .login-card {
            background: linear-gradient(180deg, var(--bg-soft), rgba(20, 22, 26, .7));
            border-radius: var(--radius);
            padding: 2rem;
            box-shadow: var(--shadow);
            border: 1px solid rgba(212, 175, 55, .12);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .login-title {
            font-size: clamp(1.4rem, 4vw, 2.2rem);
            letter-spacing: .02em;
            margin: 0 0 .5rem;
            color: var(--accent);
            text-shadow: 0 0 18px rgba(212, 175, 55, .12);
            font-weight: 700;
        }
        
        .login-subtitle {
            margin: 0 0 2rem;
            color: var(--muted);
            font-weight: 600;
            letter-spacing: .08em;
            text-transform: uppercase;
            font-size: .9rem;
        }
        
        .login-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .password-input {
            appearance: none;
            border: 1px solid rgba(212, 175, 55, .35);
            background: linear-gradient(180deg, rgba(212, 175, 55, .08), rgba(212, 175, 55, .02));
            color: var(--fg);
            border-radius: 8px;
            padding: .75rem 1rem;
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
        }
        
        .password-input:focus {
            outline: none;
            border-color: var(--gold);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, .1);
        }
        
        .password-input::placeholder {
            color: var(--muted);
            opacity: 0.7;
        }
        
        .login-button {
            appearance: none;
            border: 1px solid rgba(212, 175, 55, .35);
            background: linear-gradient(180deg, rgba(212, 175, 55, .15), rgba(212, 175, 55, .08));
            color: var(--fg);
            border-radius: 8px;
            padding: .75rem 1.5rem;
            cursor: pointer;
            font-weight: 600;
            letter-spacing: .02em;
            font-size: 1rem;
            transition: all 0.2s ease;
            font-family: inherit;
        }
        
        .login-button:hover {
            background: linear-gradient(180deg, rgba(212, 175, 55, .25), rgba(212, 175, 55, .15));
            border-color: var(--gold);
            transform: translateY(-1px);
        }
        
        .error-message {
            background: rgba(220, 38, 38, .1);
            border: 1px solid rgba(220, 38, 38, .3);
            color: #ff6b6b;
            padding: .75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: .9rem;
        }
        
        .login-description {
            color: var(--muted);
            margin-bottom: 1.5rem;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <h1 class="login-title">René & Stefanie</h1>
            <p class="login-subtitle">Hochzeitsalbum</p>
            <p class="login-description">Willkommen zu unserem privaten Hochzeitsalbum. Bitte geben Sie das Passwort ein, um die Fotos anzusehen.</p>
            
            <?php if (isset($_GET['timeout'])): ?>
                <div class="error-message">Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.</div>
            <?php elseif ($error_message): ?>
                <div class="error-message"><?php echo htmlspecialchars($error_message); ?></div>
            <?php endif; ?>
            
            <form method="POST" class="login-form">
                <input 
                    type="password" 
                    name="password" 
                    class="password-input" 
                    placeholder="Passwort eingeben..." 
                    required 
                    autofocus
                >
                <button type="submit" class="login-button">Anmelden</button>
            </form>
        </div>
    </div>
</body>
</html>