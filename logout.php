<?php
session_start();

// Session zerstören
session_destroy();

// Session-Cookie löschen
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Zurück zur Login-Seite
header('Location: index.php');
exit;
?>