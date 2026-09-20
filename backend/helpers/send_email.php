<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/smtp.php';

function sendEmail($to, $subject, $body){
    global $host, $port, $username, $password;
    $mail = new PHPMailer(true);

    try{
        $mail-> isSMTP();
        $mail-> Host = $host;
        $mail-> SMTPAuth = true;
        $mail-> Username = $username;
        $mail-> Password = $password;
        $mail-> SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail-> Port = $port;
        $mail-> setFrom('noreply@taskmanager.com', 'Task Manager');
        $mail-> addAddress($to);
        $mail-> isHTML(true);
        $mail-> Subject = $subject;
        $mail-> Body = $body;
        $mail-> send();
    }catch (Exception $e){
        echo "Mailer Error: " . $mail->ErrorInfo;
        exit;
    }
}
